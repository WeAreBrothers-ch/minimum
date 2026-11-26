// @ts-check
/* Minimum : la fiche d’un film. Tout ce qu’on sait du film, ses séances,
   et la caisse pour prendre un billet. Adresse : film/?id=…[&seance=…][#billets]

   Une grille de cases jointes d’un trait, alignée sur celle du site.
   Téléphone :                      Ordinateur (quatre colonnes) :
     ┌───────────────┐                ┌─────────────────────┬────────┐
     │ ← Tous films  │                │ ← Tous les films     │BILLETS │
     ├───────────────┤                ├─────────────────────┤ (vert) │
     │ TITRE         │                │ TITRE                │        │
     ├───────────────┤                ├──────┬──────────────┼────────┤
     │ BILLETS (vert)│                │AFFICHE│ synopsis    │SÉANCES │
     ├───────┬───────┤                ├──────┤ bande-annonce│        │
     │AFFICHE│repères│                │repères│ liens       │        │
     ├───────┴───────┤                └──────┴──────────────┴────────┘
     │ SÉANCES       │
     │ synopsis…     │
     └───────────────┘
   Un clic sur Billets ou sur une séance ouvre la caisse (panneau.js). */

import { caisseHTML, seancesHTML } from "../billetterie/panneau-html.js";
import { monterPanneau } from "../billetterie/panneau.js";
import { chargerProgrammeComplet, filmParId, seancesAVenir } from "../donnees.js";
import { duree, echapper, heureCourte, jourCourt, jourLong, jourLongMajuscule } from "../format.js";
import { bandeAnnonceHTML } from "./bande-annonce.js";
import { afficheHTML, afficherErreur, allerALAncre, nommerPage, zoneAremplir } from "./commun.js";
import { caseBilletsHTML, faitsHTML, retourHTML } from "./detail-cases.js";
import { liensHTML, photosHTML } from "./film-commun.js";

/** @typedef {import("../types.js").Film} Film */
/** @typedef {import("../types.js").Seance} Seance */
/** @typedef {import("../types.js").Programme} Programme */
/** @typedef {import("../billetterie/panneau-html.js").OptionsPanneau} OptionsPanneau */

const ETATS = /** @type {const} */ ({ complet: "Complet", annule: "Annulée" });

/**
 * L’invité·e, avec son jour s’il ne vient qu’à une séance.
 * @param {Film} film
 * @returns {string}
 */
function presenceHTML(film) {
  if (!film.presence) return "";
  const jour = film.presenceJour ? `, ${jourLong(film.presenceJour)}` : "";
  return `<p class="detail__mention">En présence de ${echapper(film.presence)}${echapper(jour)}</p>`;
}

/**
 * La case du titre : le film, qui l’a fait, s’il est à l’affiche.
 * @param {Film} film
 * @param {Programme} programme
 * @param {OptionsPanneau} options
 * @returns {string}
 */
function teteHTML(film, programme, options) {
  const annonce = film.sortie && film.sortie > programme.aujourdhui ? `Sortie le ${jourLong(film.sortie)}` : "Pas de séance prévue";
  return (
    `<header class="detail__tete">` +
    `<h1 class="page__titre"><span class="masque"><span>${echapper(film.titre)}</span></span></h1>` +
    (film.titreOriginal ? `<p class="detail__original">${echapper(film.titreOriginal)}</p>` : "") +
    `<p class="detail__ligne">Un film de ${echapper(film.realisation)}</p>` +
    `<p class="detail__etat"><span class="pastille pastille--etat">${echapper(options.choix.length ? "À l’affiche" : annonce)}</span>` +
    (film.mention ? `<span class="detail__mention">${echapper(film.mention)}</span>` : "") +
    `</p>${presenceHTML(film)}</header>`
  );
}

/**
 * Ce qu’on lit dans la case Billets quand rien ne s’achète en ligne.
 * @param {OptionsPanneau} options
 * @returns {string}
 */
function sansVente(options) {
  if (options.choix.length === 0) return "Pas encore en vente";
  if (options.choix.every((c) => c.indisponible !== null)) return "Plus de billets en ligne";
  return "À la buvette, 15 minutes avant la séance";
}

/**
 * La case du texte : synopsis, interprètes, bande-annonce et liens.
 * La bande-annonce et les liens vont d’un bord à l’autre de la case.
 * @param {Film} film
 * @returns {string}
 */
function texteHTML(film) {
  return (
    `<div class="detail__texte"><div class="detail__colle"><p class="detail__bloc detail__resume">${echapper(film.resume)}</p>` +
    (film.avec ? `<p class="detail__bloc detail__avec"><span class="detail__terme">Avec</span> ${echapper(film.avec)}</p>` : "") +
    bandeAnnonceHTML(film.bandeAnnonce, film.titre) +
    liensHTML(film.liens) +
    `</div></div>`
  );
}

/**
 * @param {Film} film
 * @param {Programme} programme
 * @param {OptionsPanneau} options
 * @returns {string}
 */
function ficheHTML(film, programme, options) {
  const racine = document.body.dataset.racine ?? "";
  const vide = film.sortie ? "Les séances seront annoncées ici." : "Pas de séance prévue pour l’instant.";
  return (
    `<article class="detail">${retourHTML(`${racine}cinema/`, "Tous les films")}` +
    `${teteHTML(film, programme, options)}${caseBilletsHTML(options, sansVente(options))}` +
    `<div class="detail__affiche">${afficheHTML(film.affiche, film.titre, { detail: true })}</div>` +
    faitsHTML([
      ["Durée", duree(film.duree)],
      ["Version", film.version],
      ["Âge", film.age],
      ["Genre", film.genre],
      ["Année", String(film.annee)],
      ["Pays", film.pays],
    ]) +
    `${seancesHTML(options, vide)}${texteHTML(film)}${photosHTML(film.photos)}</article>` +
    caisseHTML(options)
  );
}

/**
 * @param {Film} film
 * @param {Seance[]} seances
 * @param {Programme} programme
 * @returns {OptionsPanneau}
 */
function optionsAchat(film, seances, programme) {
  return {
    genre: "seance",
    titre: film.titre,
    choix: seances.map((s) => ({
      id: s.id,
      jour: jourLongMajuscule(s.date),
      court: jourCourt(s.date),
      heure: heureCourte(s.heure),
      indisponible: s.etat ? ETATS[s.etat] : null,
      mention: film.presence && film.presenceJour === s.date ? `En présence de ${film.presence}` : null,
    })),
    choisi: new URLSearchParams(location.search).get("seance"),
    tarifs: programme.tarifsCinema,
  };
}

/** @param {HTMLElement} zone */
function introuvable(zone) {
  const racine = document.body.dataset.racine ?? "";
  nommerPage("Film introuvable, Minimum Neuchâtel", "Ce film n’est pas au programme du cinéma Minimum.");
  zone.innerHTML =
    `<h1 class="page__titre">Film introuvable</h1><p class="page__intro">Ce film n’est pas, ou plus, au programme.</p>` +
    `<p class="page__intro"><a href="${racine}cinema/">Voir les films à l’affiche</a></p>`;
}

/**
 * Remplit la fiche du film demandé dans l’adresse.
 * @returns {() => void} Débranche la page.
 */
export function initFilm() {
  const fin = new AbortController();
  const zone = zoneAremplir();
  if (!zone) return () => fin.abort();
  const id = new URLSearchParams(location.search).get("id") ?? "";
  chargerProgrammeComplet()
    .then((programme) => {
      if (fin.signal.aborted) return;
      const film = filmParId(programme, id);
      if (!film) return introuvable(zone);
      const options = optionsAchat(film, seancesAVenir(programme, film.id), programme);
      nommerPage(
        `${film.titre} : séances et billets, Minimum Neuchâtel`,
        `${film.titre}, de ${film.realisation} (${film.pays}, ${film.annee}). Séances et billets au cinéma Minimum, à Neuchâtel.`
      );
      zone.innerHTML = ficheHTML(film, programme, options);
      monterPanneau(zone, options, fin.signal);
      allerALAncre();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
  return () => fin.abort();
}
