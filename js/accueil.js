// @ts-check
/* Minimum : l’accueil, deux murs (Nuit et Cinéma) dont chaque colonne défile seule. */

import { cartesCinema, cartesNuit } from "./carte.js";
import { chargerProgramme } from "./donnees.js";
import { echapper } from "./format.js";
import { choisirPiste, EVENEMENT_PISTE, pisteQuiJoue } from "./lecteur.js";
import { monterMur } from "./mur.js";

/** @typedef {import("./types.js").Programme} Programme */
/** @typedef {import("./types.js").Carte} Carte */

/**
 * @param {HTMLElement} moitie
 * @param {string} message
 */
function afficherMessage(moitie, message) {
  const colonnes = moitie.querySelector(".moitie__colonnes");
  if (colonnes) colonnes.innerHTML = `<p class="moitie__message">${echapper(message)}</p>`;
}

/**
 * Remplit une moitié et renvoie de quoi la démonter.
 * @param {HTMLElement | null} moitie
 * @param {Carte[]} cartes
 * @param {string} vide   La phrase quand il n’y a rien.
 * @param {string} racine
 * @returns {() => void}
 */
function remplir(moitie, cartes, vide, racine) {
  if (!moitie) return () => {};
  const colonnes = moitie.querySelector(".moitie__colonnes");
  if (!(colonnes instanceof HTMLElement)) return () => {};
  if (cartes.length === 0) {
    afficherMessage(moitie, vide);
    return () => {};
  }
  return monterMur(colonnes, cartes, racine);
}

/**
 * Marque les cases de l’émission qui joue.
 * @param {string | null} id
 */
function marquerPiste(id) {
  for (const carte of document.querySelectorAll("[data-piste]")) {
    if (carte instanceof HTMLElement) carte.dataset.joue = String(carte.dataset.piste === id);
  }
}

/**
 * Un clic sur une émission la charge dans le lecteur.
 * @param {Programme} programme
 * @returns {(e: MouseEvent) => void}
 */
function auClicEmission(programme) {
  return (e) => {
    const cible = e.target instanceof Element ? e.target.closest("[data-piste]") : null;
    if (!(cible instanceof HTMLElement)) return;
    const emission = programme.emissions.find((em) => em.id === cible.dataset.piste);
    if (!emission) return;
    choisirPiste({
      id: emission.id,
      titre: emission.titre,
      etat: emission.enDirect ? "En direct" : "À réécouter",
      audio: emission.audio,
    });
  };
}

/** @param {Event} e */
function auChangementDePiste(e) {
  if (e instanceof CustomEvent) marquerPiste(e.detail?.id ?? null);
}

/**
 * Lance l’accueil. Renvoie de quoi le démonter avant de changer de page.
 * @returns {() => void}
 */
export function initAccueil() {
  const racine = document.body.dataset.racine ?? "";
  const nuit = document.querySelector('[data-monde="nuit"]');
  const cinema = document.querySelector('[data-monde="cinema"]');
  const moitieNuit = nuit instanceof HTMLElement ? nuit : null;
  const moitieCinema = cinema instanceof HTMLElement ? cinema : null;

  /** @type {Array<() => void>} */
  const demontages = [];
  let actif = true;

  chargerProgramme()
    .then((programme) => {
      if (!actif) return;
      demontages.push(remplir(moitieNuit, cartesNuit(programme), "Aucune soirée ni émission annoncée pour l’instant.", racine));
      demontages.push(remplir(moitieCinema, cartesCinema(programme), "Aucun film programmé pour l’instant.", racine));
      const clic = auClicEmission(programme);
      moitieNuit?.addEventListener("click", clic);
      demontages.push(() => moitieNuit?.removeEventListener("click", clic));
      marquerPiste(pisteQuiJoue());
    })
    .catch((/** @type {unknown} */ erreur) => {
      console.warn("Minimum : programme indisponible.", erreur);
      const message = "Le programme n’a pas pu être chargé. Rechargez la page dans un instant.";
      if (moitieNuit) afficherMessage(moitieNuit, message);
      if (moitieCinema) afficherMessage(moitieCinema, message);
    });

  document.addEventListener(EVENEMENT_PISTE, auChangementDePiste);

  return () => {
    actif = false;
    document.removeEventListener(EVENEMENT_PISTE, auChangementDePiste);
    for (const demonter of demontages) demonter();
  };
}
