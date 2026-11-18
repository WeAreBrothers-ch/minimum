// @ts-check
/* Minimum : la fiche d’un film. Tout ce qu’on sait du film, ses séances,
   et la caisse pour prendre un billet. Adresse : film/?id=…[&seance=…]

   Une grille de cases, comme la fiche de Zinéma, en traits d’un pixel.
   Ordinateur large :
     ┌───────────────────────────────────┬───────────────┐
     │ TITRE, un film de…                │ BILLETS ↓     │
     │ à l’affiche                       │ (vert)        │
     ├───────────────────────────────────┴───────────────┤
     │ ANNÉE │ PAYS │ DURÉE │ GENRE │ VERSION │ ÂGE      │
     ├────────────┬──────────────────────┬───────────────┤
     │ AFFICHE    │ synopsis             │ SÉANCES ET    │
     │            │ ▬ BANDE-ANNONCE ▬    │ BILLETS       │
     │            │ distribution, presse │ (la caisse)   │
     └────────────┴──────────────────────┴───────────────┘
   Plus étroit, la caisse passe sous le texte (detail.css). */

import { panneauHTML } from "../billetterie/panneau-html.js";
import { monterPanneau } from "../billetterie/panneau.js";
import { chargerProgrammeComplet, filmParId, seancesAVenir } from "../donnees.js";
import { duree, echapper, heureCourte, jourLong, jourLongMajuscule } from "../format.js";
import { bandeAnnonceHTML, monterBandesAnnonces } from "./bande-annonce.js";
import { afficheHTML, afficherErreur, allerALAncre, nommerPage, zoneAremplir } from "./commun.js";
import { caseBilletsHTML, faitsHTML } from "./detail-cases.js";
import { liensHTML, photosHTML } from "./film-commun.js";

/** @typedef {import("../types.js").Film} Film */
/** @typedef {import("../types.js").Seance} Seance */
/** @typedef {import("../types.js").Programme} Programme */
/** @typedef {import("../billetterie/panneau-html.js").OptionsPanneau} OptionsPanneau */

/** Repris de la page Infos et du programme actuel de Minimum. */
const NOTES_CINEMA = [
  "Billets aussi à la buvette, 15 minutes avant la séance, en espèces ou par TWINT.",
  "Les tarifs réduits se justifient à l’entrée. AG culturel : CHF 0.–, à la buvette.",
];

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
  const racine = document.body.dataset.racine ?? "";
  const annonce = film.sortie && film.sortie > programme.aujourdhui ? `Sortie le ${jourLong(film.sortie)}` : "Pas de séance prévue";
  return (
    `<header class="detail__tete"><p class="detail__retour"><a href="${racine}cinema/">Tous les films</a></p>` +
    `<h1 class="page__titre"><span class="masque"><span>${echapper(film.titre)}</span></span></h1>` +
    (film.titreOriginal ? `<p class="detail__original">${echapper(film.titreOriginal)}</p>` : "") +
    `<p class="detail__ligne">Un film de ${echapper(film.realisation)}</p>` +
    `<p class="detail__etat"><span class="pastille pastille--cinema">${echapper(options.choix.length ? "À l’affiche" : annonce)}</span>` +
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
 * La caisse, puis le chemin vers toutes les séances de la semaine.
 * @param {Film} film
 * @param {OptionsPanneau} options
 * @returns {string}
 */
function billetsHTML(film, options) {
  const racine = document.body.dataset.racine ?? "";
  const contenu = options.choix.length
    ? panneauHTML(options)
    : `<p class="page__vide">${film.sortie ? "Les séances seront annoncées ici." : "Pas de séance prévue pour l’instant."}</p>`;
  return (
    `<section class="detail__billets" id="billets" aria-labelledby="titre-billets">` +
    `<h2 class="page__sous-titre" id="titre-billets">Séances et billets</h2>` +
    `<span class="tirets" aria-hidden="true"></span>${contenu}` +
    `<p class="detail__agenda"><a href="${racine}agenda/">Toutes les séances de la semaine, dans l’agenda</a></p></section>`
  );
}

/**
 * @param {Film} film
 * @param {Programme} programme
 * @param {OptionsPanneau} options
 * @returns {string}
 */
function ficheHTML(film, programme, options) {
  return (
    `<article class="detail">${teteHTML(film, programme, options)}${caseBilletsHTML(options, sansVente(options))}` +
    faitsHTML([
      ["Année", String(film.annee)],
      ["Pays", film.pays],
      ["Durée", duree(film.duree)],
      ["Genre", film.genre],
      ["Version", film.version],
      ["Âge", film.age],
    ]) +
    `<div class="detail__affiche">${afficheHTML(film.affiche, film.titre, { detail: true })}</div>` +
    `${texteHTML(film)}${billetsHTML(film, options)}${photosHTML(film.photos)}</article>`
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
    choix: seances.map((s) => ({
      id: s.id,
      jour: jourLongMajuscule(s.date),
      heure: heureCourte(s.heure),
      indisponible: s.etat ? ETATS[s.etat] : null,
      mention: film.presence && film.presenceJour === s.date ? `En présence de ${film.presence}` : null,
    })),
    choisi: new URLSearchParams(location.search).get("seance"),
    tarifs: programme.tarifsCinema,
    notes: NOTES_CINEMA,
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
      monterBandesAnnonces(zone, fin.signal);
      monterPanneau(zone, options, fin.signal);
      allerALAncre();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
  return () => fin.abort();
}
