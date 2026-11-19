// @ts-check
/* Minimum : point d’entrée. Lance la page affichée, puis garde la main
   sur la navigation pour que la radio ne s’arrête jamais.

   Chaque page charge son propre code, et seulement le sien (import()) :
   l’agenda n’attend pas la billetterie, l’accueil n’attend pas le bureau de
   la radio. Les modules de la page sont annoncés en tête de son HTML
   (npm run precharger), ils arrivent donc en même temps que main.js. */

import { initEntete } from "./entete.js";
import { initLecteur, rafraichirLecteur } from "./lecteur.js";
import { initNavigation } from "./navigation.js";

/** @typedef {() => (void | (() => void))} InitPage */

/** @type {Record<string, () => Promise<InitPage>>} */
const PAGES = {
  accueil: () => import("./accueil.js").then((m) => m.initAccueil),
  cinema: () => import("./pages/cinema.js").then((m) => m.initCinema),
  nuit: () => import("./pages/nuit.js").then((m) => m.initNuit),
  radio: () => import("./pages/radio.js").then((m) => m.initRadio),
  agenda: () => import("./pages/agenda.js").then((m) => m.initAgenda),
  film: () => import("./pages/film.js").then((m) => m.initFilm),
  soiree: () => import("./pages/soiree.js").then((m) => m.initSoiree),
  billet: () => import("./pages/billet.js").then((m) => m.initBillet),
  infos: () => import("./pages/infos.js").then((m) => m.initInfos),
};

/** @type {Array<() => void>} */
let demontages = [];

/** Le numéro de la dernière page demandée : une page arrivée trop tard ne se lance pas. */
let demande = 0;

/**
 * Démonte la page précédente et lance la nouvelle.
 * @param {string} page
 * @returns {Promise<void>}
 */
async function lancerPage(page) {
  for (const demonter of demontages) demonter();
  demontages = [initEntete()];
  rafraichirLecteur();
  /* Numéroté avant tout : même une page sans code propre rend caduque une
     page précédente dont le code arrive encore. */
  const numero = ++demande;
  const charger = PAGES[page];
  if (!charger) return;
  /** @type {InitPage} */
  let init;
  try {
    init = await charger();
  } catch (erreur) {
    /* Le code de la page n’a pas pu être chargé (réseau coupé) : on passe
       par un chargement classique, qui le redemandera. Une seule fois : une
       erreur dans le code de la page, elle, ne fait pas recharger. */
    console.warn("Minimum : le code de la page n’a pas pu être chargé.", erreur);
    if (numero === demande && !sessionStorageEssai()) location.reload();
    return;
  }
  if (numero !== demande) return;
  const demonter = init();
  if (demonter) demontages.push(demonter);
}

/**
 * Vrai si l’on vient déjà de recharger pour cette raison : on ne recharge pas
 * en boucle (réseau coupé pour de bon).
 * @returns {boolean}
 */
function sessionStorageEssai() {
  try {
    const deja = sessionStorage.getItem("minimum:rechargement") === location.href;
    sessionStorage.setItem("minimum:rechargement", location.href);
    return deja;
  } catch {
    return true;
  }
}

initLecteur();
void lancerPage(document.body.dataset.page ?? "");
initNavigation(lancerPage);
