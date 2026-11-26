// @ts-check
/* Minimum : l’accueil, deux murs (Musique et Cinéma) dont chaque colonne défile seule. */

import { cartesCinema, cartesMusique } from "./carte.js";
import { chargerProgramme } from "./donnees.js";
import { echapper } from "./format.js";
import { monterMur } from "./mur.js";

/** @typedef {import("./types.js").Programme} Programme */
/** @typedef {import("./types.js").Carte} Carte */

/**
 * @param {HTMLElement} moitie
 * @param {string} message
 */
function afficherMessage(moitie, message) {
  const colonnes = moitie.querySelector(".moitie__colonnes");
  if (colonnes) colonnes.innerHTML = `<p class="moitie__message">${echapper(message)}</p>`;
}

/**
 * Remplit une moitié et renvoie de quoi la démonter.
 * @param {HTMLElement | null} moitie
 * @param {Carte[]} cartes
 * @param {string} vide   La phrase quand il n’y a rien.
 * @param {string} racine
 * @returns {() => void}
 */
function remplir(moitie, cartes, vide, racine) {
  if (!moitie) return () => {};
  const colonnes = moitie.querySelector(".moitie__colonnes");
  if (!(colonnes instanceof HTMLElement)) return () => {};
  if (cartes.length === 0) {
    afficherMessage(moitie, vide);
    return () => {};
  }
  return monterMur(colonnes, cartes, racine);
}

/**
 * Écrit dans la tête d’un mur ce qu’il contient : « 7 soirées · 5 lives ».
 * @param {HTMLElement | null} moitie
 * @param {Carte[]} cartes
 * @param {Array<[Carte["genre"], string, string]>} genres  Genre, singulier, pluriel.
 */
function compter(moitie, cartes, genres) {
  const compte = moitie?.querySelector("[data-compte]");
  if (!(compte instanceof HTMLElement)) return;
  const parties = genres
    .map(([genre, un, plusieurs]) => {
      const n = cartes.filter((c) => c.genre === genre).length;
      return n ? `${n}\u00a0${n > 1 ? plusieurs : un}` : "";
    })
    .filter(Boolean);
  if (parties.length) compte.textContent = parties.join(" · ");
}

/**
 * Lance l’accueil. Renvoie de quoi le démonter avant de changer de page.
 * @returns {() => void}
 */
export function initAccueil() {
  const racine = document.body.dataset.racine ?? "";
  const musique = document.querySelector('[data-monde="musique"]');
  const cinema = document.querySelector('[data-monde="cinema"]');
  const moitieMusique = musique instanceof HTMLElement ? musique : null;
  const moitieCinema = cinema instanceof HTMLElement ? cinema : null;

  /** @type {Array<() => void>} */
  const demontages = [];
  let actif = true;

  chargerProgramme()
    .then((programme) => {
      if (!actif) return;
      const cartesM = cartesMusique(programme);
      const cinema = cartesCinema(programme);
      compter(moitieMusique, cartesM, [
        ["soiree", "soirée", "soirées"],
        ["emission", "live", "lives"],
      ]);
      compter(moitieCinema, cinema, [["film", "film", "films"]]);
      demontages.push(remplir(moitieMusique, cartesM, "Aucune soirée ni live annoncé pour l’instant.", racine));
      demontages.push(remplir(moitieCinema, cinema, "Aucun film programmé pour l’instant.", racine));
    })
    .catch((/** @type {unknown} */ erreur) => {
      console.warn("Minimum : programme indisponible.", erreur);
      const message = "Le programme n’a pas pu être chargé. Rechargez la page dans un instant.";
      if (moitieMusique) afficherMessage(moitieMusique, message);
      if (moitieCinema) afficherMessage(moitieCinema, message);
    });

  return () => {
    actif = false;
    for (const demonter of demontages) demonter();
  };
}
