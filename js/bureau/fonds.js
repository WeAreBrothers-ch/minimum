// @ts-check
/* Minimum Radio : les fonds d'écran et la couleur d'accent des fenêtres, que
   le visiteur change dans Réglages. Des fonds de couleur unie, quatre fonds
   dessinés pour Minimum, et une image à soi. Les couleurs sont celles du site
   (jetons.css) : le bleu est celui de la radio, le rose celui de la nuit. */

import { ecrire, lire } from "./memoire.js";

/**
 * @typedef {Object} Fond
 * @property {string} id
 * @property {string} nom
 * @property {"couleur" | "image"} genre
 * @property {string} valeur   Une couleur, ou le chemin d'une image du site.
 */

/** @type {Fond[]} */
export const FONDS_SYSTEME = [
  { id: "noir", nom: "Noir", genre: "couleur", valeur: "#000000" },
  { id: "blanc", nom: "Blanc", genre: "couleur", valeur: "#ffffff" },
  { id: "bleu", nom: "Bleu radio", genre: "couleur", valeur: "var(--bleu-vif)" },
];

/** @type {Fond[]} */
export const FONDS_IMAGES = [
  { id: "lac", nom: "Lac", genre: "image", valeur: "assets/img/fonds/lac.svg" },
  { id: "nuit", nom: "Nuit", genre: "image", valeur: "assets/img/fonds/nuit.svg" },
  { id: "ecran", nom: "Écran", genre: "image", valeur: "assets/img/fonds/ecran.svg" },
  { id: "coucher", nom: "Coucher", genre: "image", valeur: "assets/img/fonds/coucher.svg" },
];

/** La couleur d'accent : barre de titre de la fenêtre ouverte, plage choisie,
    touche de lecture. « texte » est la couleur lisible dessus. */
export const COULEURS = [
  { id: "bleu", nom: "Bleu radio", valeur: "var(--bleu-vif)", texte: "#000000" },
  { id: "rose", nom: "Rose nuit", valeur: "var(--rose-vif)", texte: "#000000" },
  { id: "jaune", nom: "Jaune cinéma", valeur: "var(--jaune-vif)", texte: "#000000" },
  { id: "noir", nom: "Noir", valeur: "#000000", texte: "#ffffff" },
];

const CLE_FOND = "minimum:radio:fond";
const CLE_PERSO = "minimum:radio:fond-perso";
const CLE_COULEUR = "minimum:radio:couleur";
export const FOND_PERSO = "perso";

/** @type {string | null} Une image choisie dans cette visite, quand le navigateur n'a pas pu la garder. */
let imagePersoDeSession = null;

/** @returns {string} */
export function fondChoisi() {
  const id = lire(CLE_FOND);
  const connu = [...FONDS_SYSTEME, ...FONDS_IMAGES].some((f) => f.id === id);
  if (id === FOND_PERSO && imageDeVisiteur()) return FOND_PERSO;
  return connu && id ? id : "noir";
}

/** @returns {string | null} */
function imageDeVisiteur() {
  return imagePersoDeSession ?? lire(CLE_PERSO);
}

/** @returns {string} */
export function couleurChoisie() {
  const id = lire(CLE_COULEUR);
  return COULEURS.some((c) => c.id === id) && id ? id : "bleu";
}

/**
 * Pose un fond sur le bureau.
 * @param {HTMLElement} ecran
 * @param {string} id
 * @param {string} racine   Chemin relatif vers la racine du site.
 */
export function appliquerFond(ecran, id, racine) {
  const fond = [...FONDS_SYSTEME, ...FONDS_IMAGES].find((f) => f.id === id);
  if (id === FOND_PERSO && imageDeVisiteur()) {
    ecran.style.backgroundColor = "#000";
    ecran.style.backgroundImage = `url("${imageDeVisiteur()}")`;
  } else if (fond?.genre === "image") {
    ecran.style.backgroundColor = "#000";
    ecran.style.backgroundImage = `url("${racine}${fond.valeur}")`;
  } else {
    ecran.style.backgroundImage = "none";
    ecran.style.backgroundColor = fond?.valeur ?? "#000000";
  }
  ecran.dataset.fond = id;
  ecrire(CLE_FOND, id);
}

/**
 * Pose la couleur d'accent des fenêtres.
 * @param {HTMLElement} bureau
 * @param {string} id
 */
export function appliquerCouleur(bureau, id) {
  const couleur = COULEURS.find((c) => c.id === id) ?? COULEURS[0];
  if (!couleur) return;
  bureau.style.setProperty("--os-accent", couleur.valeur);
  bureau.style.setProperty("--os-accent-texte", couleur.texte);
  ecrire(CLE_COULEUR, couleur.id);
}

const LARGEUR_MAX = 1600;

/**
 * Lit une image du visiteur, la réduit à 1600 px de large et la garde pour
 * ses prochaines visites si le navigateur le permet. L'image ne quitte
 * jamais son appareil.
 * @param {File} fichier
 * @returns {Promise<void>}
 */
export async function importerImage(fichier) {
  if (!fichier.type.startsWith("image/")) throw new Error("Ce fichier n’est pas une image.");
  const bitmap = await createImageBitmap(fichier);
  const echelle = Math.min(1, LARGEUR_MAX / bitmap.width);
  const canevas = document.createElement("canvas");
  canevas.width = Math.round(bitmap.width * echelle);
  canevas.height = Math.round(bitmap.height * echelle);
  const contexte = canevas.getContext("2d");
  if (!contexte) throw new Error("Le navigateur ne sait pas redessiner l’image.");
  contexte.drawImage(bitmap, 0, 0, canevas.width, canevas.height);
  bitmap.close();
  const donnees = canevas.toDataURL("image/jpeg", 0.82);
  imagePersoDeSession = donnees;
  ecrire(CLE_PERSO, donnees);
}
