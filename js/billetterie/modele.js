// @ts-check
/* Minimum : les règles du panier, sans toucher à la page.
   Le serveur refait toutes ces vérifications et recalcule le montant :
   celles-ci évitent seulement un aller-retour inutile au visiteur. */

import { MAX_BILLETS } from "../config.js";

/** @typedef {import("../types.js").Tarif} Tarif */

/** Nombre de billets par clé de tarif.
    @typedef {Record<string, number>} Panier */

/**
 * Ce qui empêche de payer, et le champ concerné.
 * @typedef {Object} Probleme
 * @property {"billets" | "email"} champ
 * @property {string} message
 */

const LONGUEUR_EMAIL_MAX = 160;
const FORME_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * @param {Tarif[]} tarifs
 * @returns {Panier}
 */
export function panierVide(tarifs) {
  return Object.fromEntries(tarifs.map((t) => [t.cle, 0]));
}

/**
 * @param {Panier} panier
 * @returns {number}
 */
export function nombreDeBillets(panier) {
  return Object.values(panier).reduce((somme, n) => somme + n, 0);
}

/**
 * Un billet de plus ou de moins, dans les limites. Renvoie un nouveau panier.
 * @param {Panier} panier
 * @param {string} cle
 * @param {1 | -1} pas
 * @returns {Panier}
 */
export function changerNombre(panier, cle, pas) {
  const actuel = panier[cle];
  if (actuel === undefined) return panier;
  if (pas < 0 && actuel === 0) return panier;
  if (pas > 0 && nombreDeBillets(panier) >= MAX_BILLETS) return panier;
  return { ...panier, [cle]: actuel + pas };
}

/**
 * @param {Panier} panier
 * @param {Tarif[]} tarifs
 * @returns {number} En francs.
 */
export function montant(panier, tarifs) {
  return tarifs.reduce((somme, t) => somme + (panier[t.cle] ?? 0) * t.prix, 0);
}

/**
 * @param {string} email
 * @returns {boolean}
 */
export function emailValide(email) {
  const propre = email.trim();
  return propre.length <= LONGUEUR_EMAIL_MAX && FORME_EMAIL.test(propre);
}

/**
 * Le premier problème qui empêche de payer, ou null.
 * @param {Panier} panier
 * @param {string} email
 * @returns {Probleme | null}
 */
export function probleme(panier, email) {
  const nombre = nombreDeBillets(panier);
  if (nombre < 1) return { champ: "billets", message: "Choisissez au moins un billet." };
  if (nombre > MAX_BILLETS) {
    return { champ: "billets", message: `Au-delà de ${MAX_BILLETS} billets, écrivez-nous : cineminimum@gmail.com.` };
  }
  if (!emailValide(email)) {
    return { champ: "email", message: "Indiquez une adresse e-mail complète, par exemple nom@exemple.ch." };
  }
  return null;
}

/**
 * « ordinaire:2,avs:1 » : le panier dans une adresse (billet d’aperçu).
 * @param {Panier} panier
 * @returns {string}
 */
export function panierEnTexte(panier) {
  return Object.entries(panier)
    .filter(([, n]) => n > 0)
    .map(([cle, n]) => `${cle}:${n}`)
    .join(",");
}

/**
 * L’inverse de panierEnTexte. Ignore tout ce qui n’a pas la bonne forme.
 * @param {string} texte
 * @param {Tarif[]} tarifs
 * @returns {Panier}
 */
export function panierDepuisTexte(texte, tarifs) {
  const panier = panierVide(tarifs);
  for (const morceau of texte.split(",")) {
    const [cle, nombre] = morceau.split(":");
    const n = Number(nombre);
    if (cle && cle in panier && Number.isInteger(n) && n > 0 && n <= MAX_BILLETS) panier[cle] = n;
  }
  return panier;
}
