// @ts-check
/* Minimum : les cases que partagent la fiche d’un film et celle d’une
   soirée. La case Billets, verte, et les repères (année, pays, durée…),
   chacun sur sa ligne. La grille est dans detail-grille.css. */

import { premierChoix, venteOuverte } from "../billetterie/panneau-html.js";
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
 * La case Billets. Verte (l’argent) et ouvrant la caisse quand on peut
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
    `<button type="button" class="detail__acheter" data-acheter="${echapper(premierChoix(options) ?? "")}">` +
    `<span class="detail__acheter-titre">Billets <span class="fleche" aria-hidden="true"></span></span>` +
    `<span class="detail__acheter-prix">${fourchette(options.tarifs)}</span></button>`
  );
}

/**
 * Les repères, une ligne chacun, le nom devant la valeur. Les vides sont sautés.
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

/**
 * Le chemin de retour, en case au-dessus du titre.
 * @param {string} href
 * @param {string} texte
 * @returns {string}
 */
export function retourHTML(href, texte) {
  return `<p class="detail__retour"><a href="${echapper(href)}"><span class="fleche fleche--retour" aria-hidden="true"></span>${echapper(texte)}</a></p>`;
}
