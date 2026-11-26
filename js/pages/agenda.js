// @ts-check
/* Minimum : l’agenda, tout ce qui se passe à Minimum (simplifié le
   26.11.2026 : « le client aime les choses simples »).

   Une seule liste, jour par jour, à partir d’aujourd’hui : le jour en
   titre, puis une ligne par rendez-vous (l’heure, le titre, un petit carré
   de la couleur de son monde). Toute la ligne mène à la fiche. Au-dessus,
   trois filtres : Tout, Cinéma, Musique (les lives de la radio font partie
   de la musique). */

import { chargerProgramme, filmParId } from "../donnees.js";
import { echapper, heureCourte, jourLongMajuscule } from "../format.js";
import { afficherErreur, zoneAremplir } from "./commun.js";
import { lienFilm } from "./film-commun.js";

/** @typedef {import("../types.js").Programme} Programme */

/** @typedef {"cinema" | "musique"} Monde */
/** @typedef {"tout" | Monde} Filtre */

/**
 * @typedef {Object} Rendez
 * @property {string} date
 * @property {string} heure
 * @property {string} titre
 * @property {string} sous     Une ligne de plus : réalisation, horaires, live.
 * @property {string} lien
 * @property {Monde} monde
 */

/** @type {Record<Monde, string>} */
const NOMS = { cinema: "Cinéma", musique: "Musique" };

/**
 * Tous les rendez-vous à partir d’aujourd’hui, dans l’ordre.
 * @param {Programme} programme
 * @returns {Rendez[]}
 */
function rendezVous(programme) {
  /** @type {Rendez[]} */
  const liste = [];
  for (const s of programme.seances) {
    const film = filmParId(programme, s.filmId);
    if (!film) continue;
    const etat = s.etat === "complet" ? "Complet" : s.etat === "annule" ? "Annulée" : "";
    liste.push({
      date: s.date,
      heure: s.heure,
      titre: film.titre,
      sous: etat || `${film.realisation}, ${film.version}`,
      lien: lienFilm("", film.id, s.id),
      monde: "cinema",
    });
  }
  for (const s of programme.soirees) {
    const fin = s.fin ? ` – ${heureCourte(s.fin)}` : "";
    liste.push({
      date: s.date,
      heure: s.heure,
      titre: s.titre,
      sous: `${heureCourte(s.heure)}${fin}${s.lineUp.length ? `, ${s.lineUp.length} passages` : ""}`,
      lien: `soiree/?id=${encodeURIComponent(s.id)}`,
      monde: "musique",
    });
  }
  for (const e of programme.emissions) {
    liste.push({
      date: e.date,
      heure: e.heure,
      titre: e.titre,
      sous: e.enDirect ? "En direct sur YouTube" : "Live sur YouTube",
      lien: `musique/#${e.id}`,
      monde: "musique",
    });
  }
  return liste
    .filter((r) => r.date >= programme.aujourdhui)
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
}

/**
 * Une ligne : l’heure, le titre et sa ligne, le carré du monde.
 * @param {Rendez} r
 * @param {string} racine
 * @returns {string}
 */
function ligneHTML(r, racine) {
  return (
    `<li><a class="rdv rdv--${r.monde}" href="${echapper(racine + r.lien)}">` +
    `<span class="rdv__heure">${heureCourte(r.heure).replace(" ", "\u00a0")}</span>` +
    `<span class="rdv__texte"><span class="rdv__titre">${echapper(r.titre)}</span>` +
    `<span class="rdv__sous">${echapper(r.sous)}</span></span>` +
    `<span class="rdv__monde" title="${NOMS[r.monde]}"><span class="visuellement-cache">${NOMS[r.monde]}</span></span>` +
    `<span class="fleche" aria-hidden="true"></span></a></li>`
  );
}

/**
 * @param {Filtre} filtre
 * @returns {string}
 */
function filtresHTML(filtre) {
  /** @type {Filtre[]} */
  const filtres = ["tout", "cinema", "musique"];
  return (
    `<div class="filtres filtres--3" role="group" aria-label="Afficher">` +
    filtres
      .map(
        (f) =>
          `<button type="button" class="filtre filtre--${f}" data-filtre="${f}" aria-pressed="${f === filtre}">` +
          `${f === "tout" ? "Tout" : NOMS[f]}</button>`
      )
      .join("") +
    `</div>`
  );
}

/**
 * Un jour : son nom en titre, puis ses rendez-vous.
 * @param {string} jour
 * @param {Rendez[]} liste
 * @param {string} aujourdhui
 * @param {string} racine
 * @returns {string}
 */
function jourHTML(jour, liste, aujourdhui, racine) {
  const [nom = "", ...date] = jourLongMajuscule(jour).split(" ");
  const auj = jour === aujourdhui;
  return (
    `<section class="journee${auj ? " journee--auj" : ""}" aria-label="${echapper(jourLongMajuscule(jour))}">` +
    `<h2 class="journee__tete"><span class="journee__nom">${auj ? "Aujourd’hui" : echapper(nom)}</span>` +
    `<span class="journee__date">${echapper(date.join("\u00a0"))}</span></h2>` +
    `<ul class="rdvs">${liste.map((r) => ligneHTML(r, racine)).join("")}</ul></section>`
  );
}

/**
 * Remplit la page Agenda.
 * @returns {() => void}
 */
export function initAgenda() {
  const zone = zoneAremplir();
  if (!zone) return () => {};
  const racine = document.body.dataset.racine ?? "";
  /** @type {(e: MouseEvent) => void} */
  let auClic = () => {};

  chargerProgramme()
    .then((programme) => {
      const tous = rendezVous(programme);
      if (tous.length === 0) {
        zone.innerHTML = '<p class="page__vide">Rien d’annoncé pour l’instant.</p>';
        return;
      }
      /** @type {Filtre} */
      let filtre = "tout";

      const dessiner = () => {
        const liste = filtre === "tout" ? tous : tous.filter((r) => r.monde === filtre);
        const jours = [...new Set(liste.map((r) => r.date))];
        zone.innerHTML =
          `<div class="agenda" data-filtre="${filtre}">` +
          filtresHTML(filtre) +
          jours
            .map((j) => jourHTML(j, liste.filter((r) => r.date === j), programme.aujourdhui, racine))
            .join("") +
          `</div>`;
      };

      auClic = (e) => {
        const cible = e.target instanceof Element ? e.target : null;
        const bouton = cible?.closest("[data-filtre]");
        if (!(bouton instanceof HTMLElement) || !bouton.dataset.filtre) return;
        filtre = /** @type {Filtre} */ (bouton.dataset.filtre);
        dessiner();
        const actif = zone.querySelector(`.filtre[data-filtre="${filtre}"]`);
        if (actif instanceof HTMLElement) actif.focus({ preventScroll: true });
      };
      zone.addEventListener("click", auClic);
      dessiner();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));

  return () => zone.removeEventListener("click", auClic);
}
