// @ts-check
/* Minimum : un mur d’affiches de l’accueil. Chaque colonne défile de son
   côté, sans fin (demande d’Eliott, 17.11.2026) : sur ordinateur, quatre
   colonnes indépendantes, deux par mur ; sur téléphone, une par mur.

   La seconde colonne d’un mur prend les affiches dans un autre ordre et
   part d’une demi-case plus bas, pour que les affiches ne s’alignent pas
   en rangées. Elle reprend les mêmes affiches que la première : seule la
   première est lue par le clavier et les lecteurs d’écran. */

import { monterColonne } from "./colonne.js";

/** @typedef {import("./types.js").Carte} Carte */

const ORDINATEUR = "(min-width: 56rem)";

/**
 * Monte un mur dans son conteneur et renvoie de quoi le démonter.
 * @param {HTMLElement} conteneur   Le conteneur des colonnes (.moitie__colonnes).
 * @param {Carte[]} cartes
 * @param {string} racine
 * @returns {() => void}
 */
export function monterMur(conteneur, cartes, racine) {
  if (cartes.length === 0) return () => {};
  const ordinateur = window.matchMedia(ORDINATEUR);
  /** @type {Array<() => void>} */
  let demontages = [];

  const dessiner = () => {
    for (const demonter of demontages) demonter();
    conteneur.innerHTML = colonnesHTML(ordinateur.matches ? 2 : 1);
    const colonnes = [...conteneur.children].filter((el) => el instanceof HTMLElement);
    demontages = colonnes.map((colonne, rang) =>
      monterColonne(colonne, {
        cartes,
        ordre: ordreDeColonne(cartes.length, rang),
        racine,
        accessible: rang === 0,
        depart: rang === 0 ? 0 : 0.5,
      })
    );
  };

  dessiner();
  ordinateur.addEventListener("change", dessiner);

  return () => {
    ordinateur.removeEventListener("change", dessiner);
    for (const demonter of demontages) demonter();
  };
}

/**
 * La première colonne suit l’ordre du programme ; la seconde commence à
 * la moitié de la liste.
 * @param {number} nombre
 * @param {number} rang
 * @returns {number[]}
 */
function ordreDeColonne(nombre, rang) {
  const rotation = rang === 0 ? 0 : Math.ceil(nombre / 2);
  return Array.from({ length: nombre }, (_, i) => (i + rotation) % nombre);
}

/**
 * Les colonnes vides, que monterColonne remplit. La seconde est cachée aux
 * lecteurs d’écran et hors de la tabulation : elle répète la première.
 * @param {number} nombre
 * @returns {string}
 */
function colonnesHTML(nombre) {
  let html = `<div class="moitie__colonne"></div>`;
  for (let rang = 1; rang < nombre; rang++) {
    html += `<div class="moitie__colonne" aria-hidden="true" tabindex="-1"></div>`;
  }
  return html;
}
