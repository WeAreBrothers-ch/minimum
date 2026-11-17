// @ts-check
/* Minimum : point d’entrée. Lance la page affichée, puis garde la main
   sur la navigation pour que la radio ne s’arrête jamais. */

import { initAccueil } from "./accueil.js";
import { initEntete } from "./entete.js";
import { initLecteur } from "./lecteur.js";
import { initNavigation } from "./navigation.js";
import { initAgenda } from "./pages/agenda.js";
import { initBillet } from "./pages/billet.js";
import { initCinema } from "./pages/cinema.js";
import { initFilm } from "./pages/film.js";
import { initNuit } from "./pages/nuit.js";
import { initRadio } from "./pages/radio.js";
import { initSoiree } from "./pages/soiree.js";

/** @type {Record<string, () => (void | (() => void))>} */
const PAGES = {
  accueil: initAccueil,
  cinema: initCinema,
  nuit: initNuit,
  radio: initRadio,
  agenda: initAgenda,
  film: initFilm,
  soiree: initSoiree,
  billet: initBillet,
};

/** @type {Array<() => void>} */
let demontages = [];

/**
 * Démonte la page précédente et lance la nouvelle.
 * @param {string} page
 */
function lancerPage(page) {
  for (const demonter of demontages) demonter();
  demontages = [initEntete()];
  const init = PAGES[page];
  if (!init) return;
  const demonter = init();
  if (demonter) demontages.push(demonter);
}

initLecteur();
lancerPage(document.body.dataset.page ?? "");
initNavigation(lancerPage);
