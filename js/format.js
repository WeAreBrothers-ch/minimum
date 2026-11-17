// @ts-check
/* Minimum : écrire les dates, heures et textes à la manière de Suisse romande. */

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/**
 * Échappe un texte avant de l’insérer dans du HTML.
 * @param {string} texte
 * @returns {string}
 */
export function echapper(texte) {
  return texte
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Lit une date AAAA-MM-JJ à midi, heure locale, pour éviter tout décalage de jour.
 * @param {string} iso
 * @returns {Date}
 */
export function lireDate(iso) {
  const [annee, mois, jour] = iso.split("-").map(Number);
  return new Date(annee ?? 1970, (mois ?? 1) - 1, jour ?? 1, 12);
}

/**
 * « mercredi 11 novembre »
 * @param {string} iso
 * @returns {string}
 */
export function jourLong(iso) {
  const d = lireDate(iso);
  return `${JOURS[d.getDay()]} ${d.getDate()}${d.getDate() === 1 ? "er" : ""} ${MOIS[d.getMonth()]}`;
}

/**
 * « Mercredi 11 novembre »
 * @param {string} iso
 * @returns {string}
 */
export function jourLongMajuscule(iso) {
  const texte = jourLong(iso);
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/**
 * « 19 h », « 21 h 30 »
 * @param {string} heure HH:MM
 * @returns {string}
 */
export function heureCourte(heure) {
  const [h, m] = heure.split(":");
  const heures = String(Number(h));
  return m && m !== "00" ? `${heures} h ${m}` : `${heures} h`;
}

/**
 * « 1 h 34 »
 * @param {number} minutes
 * @returns {string}
 */
export function duree(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/**
 * Ajoute des jours à une date AAAA-MM-JJ.
 * @param {string} iso
 * @param {number} jours
 * @returns {string}
 */
export function decalerDate(iso, jours) {
  const d = lireDate(iso);
  d.setDate(d.getDate() + jours);
  return isoLocal(d);
}

/**
 * La date du jour (ou d’une date donnée) en AAAA-MM-JJ, heure locale.
 * @param {Date} [d]
 * @returns {string}
 */
export function isoLocal(d = new Date()) {
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

/**
 * « CHF 16.– », « CHF 15.50 » : la façon suisse d’écrire un prix.
 * @param {number} montant En francs.
 * @returns {string}
 */
export function prix(montant) {
  const centimes = Math.round(montant * 100);
  const francs = Math.floor(centimes / 100);
  const reste = centimes % 100;
  return `CHF\u00a0${francs}.${reste === 0 ? "–" : String(reste).padStart(2, "0")}`;
}
