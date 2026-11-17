// @ts-check
/* Minimum : lecture du contenu publié dans Sanity (projet commun avec Zinéma). */

import { SANITY } from "./config.js";

/** @typedef {import("./types.js").Image} Image */

const ADRESSE = `https://${SANITY.projet}.apicdn.sanity.io/v${SANITY.version}/data/query/${SANITY.jeu}`;

/**
 * Envoie une requête GROQ. « perspective=published » : jamais de brouillon.
 * @param {string} requete
 * @param {Record<string, unknown>} [parametres]
 * @returns {Promise<unknown>}
 */
export async function requeteSanity(requete, parametres = {}) {
  const url = new URL(ADRESSE);
  url.searchParams.set("perspective", "published");
  url.searchParams.set("query", requete);
  for (const [nom, valeur] of Object.entries(parametres)) {
    url.searchParams.set(`$${nom}`, JSON.stringify(valeur));
  }
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`Sanity a répondu ${reponse.status}`);
  /** @type {{ result?: unknown }} */
  const json = await reponse.json();
  return json.result;
}

/**
 * Vérifie qu’une valeur reçue de Sanity a bien la forme d’une image.
 * @param {unknown} valeur
 * @returns {valeur is Image}
 */
function estUneImage(valeur) {
  if (!valeur || typeof valeur !== "object") return false;
  const image = /** @type {Record<string, unknown>} */ (valeur);
  return typeof image.url === "string" && typeof image.alt === "string";
}

/**
 * Ce que le catalogue commun (saisi pour Zinéma) sait d’un film.
 * @typedef {Object} FicheCatalogue
 * @property {Image | null} affiche
 * @property {string | null} titreOriginal
 * @property {Image[]} photos
 * @property {string | null} presse   Adresse d’un article de presse.
 */

const DIMENSIONS = '"largeur": asset->metadata.dimensions.width, "hauteur": asset->metadata.dimensions.height';
const REQUETE_FICHES =
  '*[_type == "film" && lower(title) in $titres]{"titre": lower(title), ' +
  '"affiche": poster{"url": asset->url, "alt": coalesce(alt, "Affiche du film " + ^.title), ' + DIMENSIONS + "}, " +
  '"titreOriginal": originalTitle, "presse": presseUrl, ' +
  '"photos": stillImages[defined(asset)]{"url": asset->url, "alt": coalesce(alt, "Image du film " + ^.title), ' + DIMENSIONS + "}}";

/**
 * Une image reçue de Sanity, avec ses dimensions si elles sont valables.
 * @param {unknown} valeur
 * @returns {Image | null}
 */
function lireImage(valeur) {
  if (!estUneImage(valeur)) return null;
  const { url, alt, largeur, hauteur } = valeur;
  return typeof largeur === "number" && typeof hauteur === "number" ? { url, alt, largeur, hauteur } : { url, alt };
}

/**
 * @param {unknown} valeur
 * @returns {string | null}
 */
function lireTexte(valeur) {
  return typeof valeur === "string" && valeur.trim() ? valeur.trim() : null;
}

/**
 * Une adresse web, seulement en http(s) : jamais de « javascript: » dans un lien.
 * @param {unknown} valeur
 * @returns {string | null}
 */
function lireAdresseWeb(valeur) {
  const texte = lireTexte(valeur);
  if (!texte) return null;
  try {
    const url = new URL(texte);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, unknown>} ligne
 * @returns {FicheCatalogue}
 */
function lireFiche(ligne) {
  const photos = Array.isArray(ligne.photos) ? ligne.photos.map(lireImage) : [];
  return {
    affiche: lireImage(ligne.affiche),
    titreOriginal: lireTexte(ligne.titreOriginal),
    photos: photos.filter((p) => p !== null),
    presse: lireAdresseWeb(ligne.presse),
  };
}

/**
 * Les fiches du catalogue commun, retrouvées par le titre du film.
 * Si deux fiches portent le même titre, celle qui a une affiche l’emporte.
 * Clé : le titre en minuscules.
 * @param {string[]} titres
 * @returns {Promise<Map<string, FicheCatalogue>>}
 */
export async function fichesParTitre(titres) {
  const resultat = await requeteSanity(REQUETE_FICHES, { titres: titres.map((t) => t.toLowerCase()) });
  /** @type {Map<string, FicheCatalogue>} */
  const fiches = new Map();
  if (!Array.isArray(resultat)) return fiches;
  for (const brut of /** @type {unknown[]} */ (resultat)) {
    if (!brut || typeof brut !== "object") continue;
    const ligne = /** @type {Record<string, unknown>} */ (brut);
    if (typeof ligne.titre !== "string") continue;
    const fiche = lireFiche(ligne);
    const deja = fiches.get(ligne.titre);
    if (!deja || (!deja.affiche && fiche.affiche)) fiches.set(ligne.titre, fiche);
  }
  return fiches;
}

/**
 * Adresse d’une image Sanity à la largeur voulue.
 * @param {string} url
 * @param {number} largeur
 * @returns {string}
 */
export function imageALaLargeur(url, largeur) {
  const adresse = new URL(url);
  adresse.searchParams.set("w", String(largeur));
  adresse.searchParams.set("auto", "format");
  adresse.searchParams.set("fit", "max");
  return adresse.toString();
}
