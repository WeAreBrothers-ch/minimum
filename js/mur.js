// @ts-check
/* Minimum : un mur d’affiches de l’accueil. Chaque colonne défile de son
   côté, sans fin (demande d’Eliott, 17.11.2026) : sur ordinateur, quatre
   colonnes indépendantes, deux par mur ; sur téléphone, une par mur.

   Chaque colonne reçoit sa propre liste (accueil.js) : en tête, la case de
   sa rubrique, puis les affiches. La seconde colonne d’un mur prend les
   affiches dans un autre ordre. Les affiches ne sont lues qu’une fois par
   le clavier et les lecteurs d’écran (première colonne du mur) ; les cases
   de rubrique, dans chaque colonne. */

import { monterColonne } from "./colonne.js";

/** @typedef {import("./types.js").Carte} Carte */

const ORDINATEUR = "(min-width: 56rem)";

/**
 * Monte un mur dans son conteneur et renvoie de quoi le démonter.
 * @param {HTMLElement} conteneur   Le conteneur des colonnes (.moitie__colonnes).
 * @param {(ordinateur: boolean) => Carte[][]} colonnesDe  Les cases de chaque colonne.
 * @param {string} racine
 * @returns {() => void}
 */
export function monterMur(conteneur, colonnesDe, racine) {
  const ordinateur = window.matchMedia(ORDINATEUR);
  /** @type {Array<() => void>} */
  let demontages = [];

  const dessiner = () => {
    for (const demonter of demontages) demonter();
    const listes = colonnesDe(ordinateur.matches).filter((l) => l.length > 0);
    conteneur.innerHTML = listes.map(() => `<div class="moitie__colonne"></div>`).join("");
    const colonnes = [...conteneur.children].filter((el) => el instanceof HTMLElement);
    demontages = colonnes.map((colonne, rang) => {
      const cartes = listes[rang] ?? [];
      return monterColonne(colonne, {
        cartes,
        ordre: cartes.map((_, i) => i),
        racine,
        accessible: rang === 0,
        depart: 0,
      });
    });
  };

  dessiner();
  ordinateur.addEventListener("change", dessiner);

  return () => {
    ordinateur.removeEventListener("change", dessiner);
    for (const demonter of demontages) demonter();
  };
}

/**
 * Les mêmes affiches, à partir de la moitié de la liste : la seconde
 * colonne d’un mur ne montre pas les mêmes affiches en même temps.
 * @template T
 * @param {T[]} liste
 * @returns {T[]}
 */
export function decaler(liste) {
  const rotation = Math.ceil(liste.length / 2);
  return [...liste.slice(rotation), ...liste.slice(0, rotation)];
}
