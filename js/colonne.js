// @ts-check
/* Minimum : une colonne d’affiches qui défile sans fin, de son côté.

   La colonne empile plusieurs copies d’un même cycle d’affiches. On se
   tient vers la copie du milieu ; quand le défilement s’arrête trop loin,
   on revient d’un nombre entier de cycles. Le contenu étant identique
   d’une copie à l’autre, le saut ne se voit pas. Les cases ont une hauteur
   entière en pixels : le cycle tombe juste et le saut n’accumule aucun
   décalage. */

import { carteHTML } from "./carte.js";

/** @typedef {import("./types.js").Carte} Carte */

const COPIES = 7;
const CENTRE = 3;
const PROPORTION = 1.5;
const ATTENTE_ARRET = 120;

/**
 * @typedef {Object} OptionsColonne
 * @property {Carte[]} cartes
 * @property {number[]} ordre       L’ordre des affiches dans le cycle (rangs dans `cartes`).
 * @property {string} racine
 * @property {boolean} accessible   Vrai pour la colonne que lisent le clavier et les lecteurs d’écran.
 * @property {number} depart        Où la colonne commence, en fraction de case (0 ou 0,5).
 */

/**
 * @typedef {Object} Geometrie
 * @property {number} cycle     Hauteur d’un cycle, en pixels (0 : colonne sans largeur).
 * @property {number} pas       Une case et son joint, en pixels.
 * @property {number} largeur   Largeur de la colonne au moment du calcul.
 */

/**
 * Remplit une colonne défilante et renvoie de quoi la démonter.
 * @param {HTMLElement} colonne
 * @param {OptionsColonne} options
 * @returns {() => void}
 */
export function monterColonne(colonne, options) {
  let geometrie = construire(colonne, options);
  colonne.scrollTop = CENTRE * geometrie.cycle + Math.round(options.depart * geometrie.pas);

  let minuterie = 0;
  let enAttente = false;

  const recentrer = () => {
    const { cycle } = geometrie;
    const y = colonne.scrollTop;
    if (cycle === 0 || (y >= (CENTRE - 2) * cycle && y <= (CENTRE + 2) * cycle)) return;
    colonne.scrollTop = CENTRE * cycle + (((y % cycle) + cycle) % cycle);
  };

  const auDefilement = () => {
    window.clearTimeout(minuterie);
    minuterie = window.setTimeout(recentrer, ATTENTE_ARRET);
    if (enAttente) return;
    enAttente = true;
    window.requestAnimationFrame(() => {
      enAttente = false;
      const { cycle } = geometrie;
      const max = colonne.scrollHeight - colonne.clientHeight;
      if (colonne.scrollTop < cycle || colonne.scrollTop > max - cycle) recentrer();
    });
  };

  /* La largeur change : on redessine en gardant la même affiche en vue. */
  const observateur = new ResizeObserver(() => {
    if (Math.abs(colonne.clientWidth - geometrie.largeur) < 1) return;
    const fraction = geometrie.cycle ? (colonne.scrollTop % geometrie.cycle) / geometrie.cycle : 0;
    geometrie = construire(colonne, options);
    colonne.scrollTop = (CENTRE + fraction) * geometrie.cycle;
  });

  colonne.addEventListener("scroll", auDefilement, { passive: true });
  observateur.observe(colonne);

  return () => {
    window.clearTimeout(minuterie);
    colonne.removeEventListener("scroll", auDefilement);
    observateur.disconnect();
  };
}

/**
 * Dessine les cases de la colonne et renvoie sa géométrie.
 * @param {HTMLElement} colonne
 * @param {OptionsColonne} options
 * @returns {Geometrie}
 */
function construire(colonne, options) {
  const largeur = colonne.clientWidth;
  if (largeur < 1 || options.cartes.length === 0) {
    colonne.innerHTML = "";
    return { cycle: 0, pas: 0, largeur };
  }
  const joint = parseFloat(getComputedStyle(colonne).rowGap) || 0;
  const hauteurCase = Math.round(largeur * PROPORTION);
  const pas = hauteurCase + joint;

  /* Assez de cases par cycle pour qu’un cycle dépasse l’écran. */
  const ecran = colonne.clientHeight || window.innerHeight;
  const repetitions = Math.max(1, Math.ceil((ecran * 1.5) / (options.cartes.length * pas)));
  const casesParCycle = options.cartes.length * repetitions;

  colonne.style.setProperty("--hauteur-case", `${hauteurCase}px`);
  colonne.innerHTML = casesHTML(options, casesParCycle, pas, ecran);
  return { cycle: casesParCycle * pas, pas, largeur };
}

/**
 * Toutes les copies du cycle, de haut en bas.
 * @param {OptionsColonne} options
 * @param {number} casesParCycle
 * @param {number} pas
 * @param {number} ecran
 * @returns {string}
 */
function casesHTML({ cartes, ordre, racine, accessible, depart }, casesParCycle, pas, ecran) {
  let html = "";
  for (let rang = 0; rang < COPIES * casesParCycle; rang++) {
    const copie = Math.floor(rang / casesParCycle);
    const place = rang % casesParCycle;
    const carte = cartes[ordre[place % ordre.length] ?? 0];
    if (!carte) continue;
    /* Une seule fois chaque affiche pour les lecteurs d’écran et le clavier :
       la première série de la copie du milieu, dans la colonne accessible. */
    const lisible = accessible && copie === CENTRE && place < cartes.length;
    const prioritaire = copie === CENTRE && (place - depart) * pas < ecran;
    html += carteHTML(carte, racine, lisible, prioritaire);
  }
  return html;
}
