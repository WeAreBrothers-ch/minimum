// @ts-check
/* Minimum : le lecteur de la radio.

   Le son vit ici, dans un seul élément audio créé une fois pour toutes :
   il continue quand on change de page. Sa commande est une case de la
   barre du haut (.lecteur__bouton) ; la navigation remplace cette barre à
   chaque page, d’où le clic écouté sur tout le document et
   rafraichirLecteur(), appelé après chaque changement de page. Quand une
   émission n’a pas encore de son (flux pas encore fourni), la case le dit
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

/** Met la case à jour d’après la piste et l’état du son. */
function afficher() {
  const el = elements();
  if (el) {
    el.etat.textContent = pisteCourante.etat;
    el.titre.textContent = pisteCourante.titre;
    el.bouton.disabled = pisteCourante.audio === null;
    el.bouton.setAttribute("aria-pressed", String(joue()));
    el.bouton.dataset.joue = String(joue());
    el.bouton.dataset.direct = String(pisteCourante.id === "direct" || pisteCourante.etat === "En direct");
    const action = pisteCourante.audio === null ? "" : joue() ? "Mettre en pause, " : "Écouter, ";
    el.bouton.setAttribute("aria-label", `${action}${pisteCourante.etat} : ${pisteCourante.titre}`);
  }
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

/** Remet la case de la barre du haut à jour, après un changement de page. */
export function rafraichirLecteur() {
  afficher();
}

/** Crée le son et écoute la case de la barre. À appeler une seule fois. */
export function initLecteur() {
  if (audio) return;
  const son = new Audio();
  son.preload = "none";
  audio = son;
  document.addEventListener("click", (e) => {
    const bouton = e.target instanceof Element ? e.target.closest(".lecteur__bouton") : null;
    if (!(bouton instanceof HTMLButtonElement) || bouton.disabled) return;
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
