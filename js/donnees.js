// @ts-check
/* Minimum : le programme, chargé une seule fois et partagé par toutes les pages. */

import { DEMONSTRATION, JOUR_DE_DEMONSTRATION } from "./config.js";
import { isoLocal } from "./format.js";
import { completerFilm } from "./catalogue.js";
import { fichesParTitre } from "./sanity.js";
import { FILMS_DEMO, SEANCES_DEMO, TARIFS_CINEMA_DEMO } from "./demo/films.js";
import { EMISSIONS_DEMO, SOIREES_DEMO } from "./demo/musique.js";

/** @typedef {import("./types.js").Programme} Programme */
/** @typedef {import("./types.js").Film} Film */
/** @typedef {import("./types.js").Seance} Seance */
/** @typedef {import("./types.js").Soiree} Soiree */

/** @type {Promise<Programme> | null} */
let enCours = null;

/** Au-delà, la fiche d’un film s’affiche sans attendre le catalogue. */
const ATTENTE_CATALOGUE = 2000;

/** @type {Promise<Programme> | null} */
let completEnCours = null;

/**
 * Le programme de démonstration, tel quel : les affiches sont enregistrées
 * avec le site, rien n’est à attendre.
 * @returns {Programme}
 */
function programmeDeDemonstration() {
  return {
    films: FILMS_DEMO,
    seances: SEANCES_DEMO,
    tarifsCinema: TARIFS_CINEMA_DEMO,
    soirees: SOIREES_DEMO,
    emissions: EMISSIONS_DEMO,
    aujourdhui: JOUR_DE_DEMONSTRATION,
  };
}

/**
 * Le programme du lieu. Tant que les séances de Minimum ne sont pas dans
 * Sanity, c’est le programme de démonstration (config.js).
 * @returns {Promise<Programme>}
 */
export function chargerProgramme() {
  if (!enCours) {
    enCours = DEMONSTRATION
      ? Promise.resolve(programmeDeDemonstration())
      : Promise.reject(
          new Error(
            `Les séances de Minimum ne sont pas encore lues depuis Sanity (au ${isoLocal()}) : laisser DEMONSTRATION à true dans config.js.`
          )
        );
  }
  return enCours;
}

/**
 * Le programme, complété par le catalogue de Minimum (Sanity) : titres
 * originaux, images des films et presse. Seule la fiche d’un film s’en sert ;
 * les autres pages n’attendent pas Sanity. Si le catalogue ne répond pas, ou
 * pas assez vite, le programme reste tel quel : rien n’est inventé.
 * @returns {Promise<Programme>}
 */
export function chargerProgrammeComplet() {
  if (!completEnCours) {
    completEnCours = chargerProgramme().then(async (programme) => {
      try {
        /** @type {Promise<never>} */
        const delai = new Promise((_, refus) =>
          setTimeout(() => refus(new Error("Le catalogue met trop de temps à répondre.")), ATTENTE_CATALOGUE)
        );
        const fiches = await Promise.race([fichesParTitre(programme.films.map((f) => f.titre)), delai]);
        return {
          ...programme,
          films: programme.films.map((film) => completerFilm(film, fiches.get(film.titre.toLowerCase()))),
        };
      } catch (erreur) {
        console.warn("Minimum : catalogue indisponible, fiches sans images ni presse.", erreur);
        return programme;
      }
    });
  }
  return completEnCours;
}

/**
 * Les films qui ont encore au moins une séance à partir d’aujourd’hui.
 * @param {Programme} programme
 * @returns {Film[]}
 */
export function filmsALAffiche(programme) {
  const avecSeance = new Set(
    programme.seances.filter((s) => s.date >= programme.aujourdhui).map((s) => s.filmId)
  );
  return programme.films.filter((f) => avecSeance.has(f.id));
}

/**
 * Les films annoncés : sortie à venir, rangés par date de sortie.
 * @param {Programme} programme
 * @returns {Film[]}
 */
export function filmsAnnonces(programme) {
  return programme.films
    .filter((f) => f.sortie !== null && f.sortie > programme.aujourdhui)
    .sort((a, b) => (a.sortie ?? "").localeCompare(b.sortie ?? ""));
}

/**
 * Les séances d’un film à partir d’aujourd’hui, dans l’ordre.
 * @param {Programme} programme
 * @param {string} filmId
 * @returns {Seance[]}
 */
export function seancesAVenir(programme, filmId) {
  return programme.seances
    .filter((s) => s.filmId === filmId && s.date >= programme.aujourdhui)
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
}

/**
 * Retrouve une soirée par son identifiant.
 * @param {Programme} programme
 * @param {string} id
 * @returns {Soiree | undefined}
 */
export function soireeParId(programme, id) {
  return programme.soirees.find((s) => s.id === id);
}

/**
 * Retrouve un film par son identifiant.
 * @param {Programme} programme
 * @param {string} id
 * @returns {Film | undefined}
 */
export function filmParId(programme, id) {
  return programme.films.find((f) => f.id === id);
}
