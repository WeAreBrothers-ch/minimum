// @ts-check
/* Minimum Radio : un petit outil pour retrouver un élément de la page, ou
   le dire clairement s'il manque. */

/**
 * @template {Element} T
 * @param {ParentNode} parent
 * @param {string} selecteur
 * @param {new () => T} Classe
 * @returns {T}
 */
export function trouver(parent, selecteur, Classe) {
  const el = parent.querySelector(selecteur);
  if (!(el instanceof Classe)) throw new Error(`Élément introuvable : ${selecteur}`);
  return el;
}
