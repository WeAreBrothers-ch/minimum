// @ts-check
/* Minimum : l’agenda, tout ce qui se passe, jour par jour. */

import { chargerProgramme, filmParId } from "../donnees.js";
import { echapper, heureCourte, jourLongMajuscule } from "../format.js";
import { afficherErreur, zoneAremplir } from "./commun.js";
import { lienFilm } from "./film-commun.js";

/** @typedef {import("../types.js").Programme} Programme */

/**
 * @typedef {Object} Rendez
 * @property {string} date
 * @property {string} heure
 * @property {string} titre
 * @property {string} lien
 * @property {"Cinéma" | "Nuit" | "Radio"} monde
 */

/** La couleur de chaque monde (code couleur, jetons.css). @type {Record<Rendez["monde"], string>} */
const TEINTE = { Cinéma: "cinema", Nuit: "nuit", Radio: "radio" };

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
    if (film) liste.push({ date: s.date, heure: s.heure, titre: film.titre, lien: lienFilm("", film.id, s.id), monde: "Cinéma" });
  }
  for (const s of programme.soirees) {
    liste.push({ date: s.date, heure: s.heure, titre: s.titre, lien: `soiree/?id=${encodeURIComponent(s.id)}`, monde: "Nuit" });
  }
  for (const e of programme.emissions) {
    liste.push({ date: e.date, heure: e.heure, titre: e.titre, lien: `radio/#${e.id}`, monde: "Radio" });
  }
  return liste
    .filter((r) => r.date >= programme.aujourdhui)
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
}

/**
 * @param {Rendez[]} liste
 * @param {string} racine
 * @returns {string}
 */
function joursHTML(liste, racine) {
  /** @type {Map<string, Rendez[]>} */
  const parJour = new Map();
  for (const r of liste) parJour.set(r.date, [...(parJour.get(r.date) ?? []), r]);
  return [...parJour.entries()]
    .map(
      ([date, rdv]) =>
        `<section class="jour"><h2 class="page__sous-titre">${echapper(jourLongMajuscule(date))}</h2>` +
        `<span class="tirets" aria-hidden="true"></span><ul class="jour__liste">${rdv
          .map(
            (r) =>
              `<li class="jour__ligne"><span class="jour__heure">${heureCourte(r.heure)}</span>` +
              `<a class="jour__titre" href="${echapper(racine + r.lien)}">${echapper(r.titre)}</a>` +
              `<span class="jour__monde"><span class="pastille pastille--${TEINTE[r.monde]}">${r.monde}</span></span></li>`
          )
          .join("")}</ul></section>`
    )
    .join("");
}

/** Remplit la page Agenda. */
export function initAgenda() {
  const zone = zoneAremplir();
  if (!zone) return;
  const racine = document.body.dataset.racine ?? "";
  chargerProgramme()
    .then((programme) => {
      const liste = rendezVous(programme);
      zone.innerHTML =
        (liste.length ? joursHTML(liste, racine) : '<p class="page__vide">Rien d’annoncé pour l’instant.</p>');
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
}
