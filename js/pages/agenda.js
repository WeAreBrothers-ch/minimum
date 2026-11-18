// @ts-check
/* Minimum : l’agenda, tout ce qui se passe, jour par jour. */

import { chargerProgramme, filmParId } from "../donnees.js";
import { decalerDate, echapper, heureCourte, jourLongMajuscule, lireDate } from "../format.js";
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

const SEMAINE = 7;

/** Les jours de la semaine, abrégés : « mer. », « jeu. »… */
const ABREGES = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/**
 * Une ligne du tableau : l’heure, puis le titre et le monde.
 * @param {Rendez} r
 * @param {string} racine
 * @returns {string}
 */
function ligneHTML(r, racine) {
  return (
    `<li class="rdv"><span class="rdv__heure">${heureCourte(r.heure)}</span>` +
    `<div class="rdv__texte"><a class="rdv__titre" href="${echapper(racine + r.lien)}">${echapper(r.titre)}</a>` +
    `<span class="pastille pastille--${TEINTE[r.monde]}">${r.monde}</span></div></li>`
  );
}

/**
 * @param {Rendez[]} liste
 * @param {string} racine
 * @param {string} vide
 * @returns {string}
 */
function listeHTML(liste, racine, vide) {
  if (liste.length === 0) return `<p class="page__vide">${echapper(vide)}</p>`;
  return `<ul class="rdvs">${liste.map((r) => ligneHTML(r, racine)).join("")}</ul>`;
}

/**
 * Plusieurs jours : une case de date, puis ses rendez-vous.
 * @param {Rendez[]} liste
 * @param {string} racine
 * @returns {string}
 */
function parJoursHTML(liste, racine) {
  /** @type {Map<string, Rendez[]>} */
  const parJour = new Map();
  for (const r of liste) parJour.set(r.date, [...(parJour.get(r.date) ?? []), r]);
  return [...parJour.entries()]
    .map(([date, rdv]) => `<h2 class="rdv__jour">${echapper(jourLongMajuscule(date))}</h2>${listeHTML(rdv, racine, "")}`)
    .join("");
}

/**
 * @param {string} aujourdhui
 * @returns {string[]}
 */
function septJours(aujourdhui) {
  return Array.from({ length: SEMAINE }, (_, i) => decalerDate(aujourdhui, i));
}

/** Remplit la page Agenda : un jour à la fois, la semaine, ou la suite. */
export function initAgenda() {
  const zone = zoneAremplir();
  if (!zone) return;
  const racine = document.body.dataset.racine ?? "";
  chargerProgramme()
    .then((programme) => {
      const liste = rendezVous(programme);
      if (liste.length === 0) {
        zone.innerHTML = '<p class="page__vide">Rien d’annoncé pour l’instant.</p>';
        return;
      }
      const jours = septJours(programme.aujourdhui);
      const dansLaSemaine = liste.filter((r) => jours.includes(r.date));
      const plusTard = liste.filter((r) => !jours.includes(r.date));
      /** @type {Array<{ id: string, titre: string }>} */
      const modes = [
        { id: "jour", titre: "Jour" },
        { id: "semaine", titre: "Semaine" },
        ...(plusTard.length ? [{ id: "plus-tard", titre: "Plus tard" }] : []),
      ];
      let mode = "jour";
      let jour = jours[0] ?? programme.aujourdhui;

      const dessiner = () => {
        const onglets =
          `<div class="onglets" role="group" aria-label="Affichage">${modes
            .map((m) => `<button type="button" class="onglet" data-mode="${m.id}" aria-pressed="${m.id === mode}">${m.titre}</button>`)
            .join("")}</div>`;
        const choixDuJour =
          mode === "jour"
            ? `<div class="onglets onglets--jours" role="group" aria-label="Jour">${jours
                .map((j) => {
                  const d = lireDate(j);
                  return (
                    `<button type="button" class="onglet onglet--jour" data-jour="${j}" aria-pressed="${j === jour}">` +
                    `${ABREGES[d.getDay()]}<b>${d.getDate()}</b></button>`
                  );
                })
                .join("")}</div>`
            : "";
        const contenu =
          mode === "jour"
            ? `<h2 class="rdv__jour">${echapper(jour === programme.aujourdhui ? "Aujourd’hui" : jourLongMajuscule(jour))}</h2>` +
              listeHTML(dansLaSemaine.filter((r) => r.date === jour), racine, "Rien d’annoncé ce jour-là.")
            : mode === "semaine"
              ? dansLaSemaine.length ? parJoursHTML(dansLaSemaine, racine) : listeHTML([], racine, "Rien d’annoncé cette semaine.")
              : parJoursHTML(plusTard, racine);
        zone.innerHTML = onglets + choixDuJour + contenu;
      };

      zone.addEventListener("click", (e) => {
        const cible = e.target instanceof Element ? e.target : null;
        const m = cible?.closest("[data-mode]");
        const j = cible?.closest("[data-jour]");
        if (m instanceof HTMLElement && m.dataset.mode) mode = m.dataset.mode;
        else if (j instanceof HTMLElement && j.dataset.jour) jour = j.dataset.jour;
        else return;
        dessiner();
        const actif = zone.querySelector('[aria-pressed="true"]' + (m ? "[data-mode]" : "[data-jour]"));
        if (actif instanceof HTMLElement) actif.focus();
      });
      dessiner();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
}
