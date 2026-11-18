// @ts-check
/* Minimum : le lecteur de la radio.

   Il vit dans la barre du bas, que la navigation ne remplace jamais :
   le son continue quand on change de page. Quand une émission n’a pas
   encore de son (exemples, flux pas encore fourni), le lecteur le dit
   au lieu de faire semblant de jouer. */

import { FLUX_RADIO } from "./config.js";

/** @typedef {import("./types.js").Piste} Piste */

export const EVENEMENT_PISTE = "minimum:piste";

const PANNE = "Le son ne répond pas, réessayez dans un instant";

/** @type {HTMLAudioElement | null} */
let audio = null;

/** @type {Piste} */
let pisteCourante = {
  id: "direct",
  titre: FLUX_RADIO ? "Radio Minimum" : "Pas encore à l’antenne",
  etat: "Radio",
  audio: FLUX_RADIO,
};

/**
 * @returns {{ bouton: HTMLButtonElement, etat: HTMLElement, titre: HTMLElement } | null}
 */
function elements() {
  const bouton = document.querySelector(".lecteur__bouton");
  const etat = document.querySelector(".lecteur__etat");
  const titre = document.querySelector(".lecteur__titre");
  if (!(bouton instanceof HTMLButtonElement) || !(etat instanceof HTMLElement) || !(titre instanceof HTMLElement)) {
    return null;
  }
  return { bouton, etat, titre };
}

/** @returns {boolean} */
function joue() {
  return audio !== null && !audio.paused;
}

/** Met la barre à jour d’après la piste et l’état du son. */
function afficher() {
  const el = elements();
  if (!el) return;
  el.etat.textContent = pisteCourante.etat;
  el.titre.textContent = pisteCourante.titre;
  el.bouton.disabled = pisteCourante.audio === null;
  el.bouton.setAttribute("aria-pressed", String(joue()));
  el.bouton.textContent = joue() ? "Pause" : "Écouter";
  document.dispatchEvent(
    new CustomEvent(EVENEMENT_PISTE, { detail: { id: joue() ? pisteCourante.id : null } })
  );
}

/** @param {string} message */
function signalerPanne(message) {
  pisteCourante = { ...pisteCourante, titre: message };
  afficher();
}

async function lancer() {
  if (!audio || !pisteCourante.audio) return;
  if (audio.src !== pisteCourante.audio) audio.src = pisteCourante.audio;
  try {
    await audio.play();
  } catch (erreur) {
    console.warn("Minimum : lecture impossible.", erreur);
    signalerPanne(PANNE);
  }
}

/**
 * Charge une piste dans la barre et la lance si elle a un son.
 * Un second clic sur la piste qui joue la met en pause.
 * @param {Piste} piste
 */
export function choisirPiste(piste) {
  if (!audio) return;
  if (piste.id === pisteCourante.id && joue()) {
    audio.pause();
    return;
  }
  audio.pause();
  pisteCourante = piste.audio ? piste : { ...piste, titre: `${piste.titre} : son à venir` };
  afficher();
  void lancer();
}

/** @returns {string | null} L’identifiant de la piste qui joue. */
export function pisteQuiJoue() {
  return joue() ? pisteCourante.id : null;
}

/** @returns {number} Le volume du lecteur, de 0 à 1. */
export function volumeDuLecteur() {
  return audio ? audio.volume : 1;
}

/**
 * Règle le volume du lecteur (sans effet sur les téléphones qui gardent
 * la main sur le volume, comme l’iPhone).
 * @param {number} volume  De 0 à 1.
 */
export function reglerVolume(volume) {
  if (audio) audio.volume = Math.min(1, Math.max(0, volume));
}

/** Coupe la radio, par exemple quand une bande-annonce démarre. */
export function mettreRadioEnPause() {
  audio?.pause();
}

/** Crée le son et branche le bouton de la barre. À appeler une seule fois. */
export function initLecteur() {
  const el = elements();
  if (!el || audio) return;
  const son = new Audio();
  son.preload = "none";
  audio = son;
  el.bouton.addEventListener("click", () => {
    if (son.paused) void lancer();
    else son.pause();
  });
  son.addEventListener("play", afficher);
  son.addEventListener("pause", afficher);
  son.addEventListener("error", () => {
    if (son.src) signalerPanne(PANNE);
  });
  afficher();
}
