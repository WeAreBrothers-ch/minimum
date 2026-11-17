// @ts-check
/* Minimum : les cases que partagent la fiche d’un film et celle d’une
   soirée. La case Billets, en haut à droite, et la rangée de repères
   (année, pays, durée…), chacun dans sa case. La grille est dans detail.css. */

import { BILLETTERIE } from "../config.js";
import { echapper, prix } from "../format.js";

/** @typedef {import("../types.js").Tarif} Tarif */
/** @typedef {import("../billetterie/panneau-html.js").OptionsPanneau} OptionsPanneau */

/**
 * « CHF 15.– », ou « De CHF 10.– à CHF 16.– ».
 * @param {Tarif[]} tarifs  Au moins un.
 * @returns {string}
 */
function fourchette(tarifs) {
  const montants = tarifs.map((t) => t.prix);
  const bas = Math.min(...montants);
  const haut = Math.max(...montants);
  return bas === haut ? prix(bas) : `De ${prix(bas)} à ${prix(haut)}`;
}

/**
 * Vrai si un billet peut s’acheter ici : vente ouverte, un tarif, une date libre.
 * @param {OptionsPanneau} options
 * @returns {boolean}
 */
export function venteOuverte(options) {
  return BILLETTERIE !== "fermee" && options.tarifs.length > 0 && options.choix.some((c) => c.indisponible === null);
}

/**
 * La case Billets. Verte (l’argent) et menant à la caisse quand on peut
 * acheter ; sinon blanche, avec ce qu’il faut savoir à la place.
 * @param {OptionsPanneau} options
 * @param {string} sansVente  « Pas encore en vente », « Complet »…
 * @returns {string}
 */
export function caseBilletsHTML(options, sansVente) {
  if (!venteOuverte(options)) {
    return (
      `<div class="detail__acheter detail__acheter--ferme"><p class="detail__acheter-titre">Billets</p>` +
      `<p class="detail__acheter-prix">${echapper(sansVente)}</p></div>`
    );
  }
  return (
    `<a class="detail__acheter" href="#billets"><span class="detail__acheter-titre">Billets <span aria-hidden="true">↓</span></span>` +
    `<span class="detail__acheter-prix">${fourchette(options.tarifs)}</span></a>`
  );
}

/**
 * Les repères, une case chacun, le nom au-dessus de la valeur. Les vides sont sautés.
 * @param {Array<[string, string | null]>} lignes
 * @returns {string}
 */
export function faitsHTML(lignes) {
  const cases = lignes
    .filter(([, valeur]) => valeur)
    .map(([terme, valeur]) => `<div class="detail__fait"><dt>${echapper(terme)}</dt><dd>${echapper(valeur ?? "")}</dd></div>`)
    .join("");
  return `<dl class="detail__faits">${cases}</dl>`;
}
