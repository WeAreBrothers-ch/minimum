// @ts-check
/* Minimum Radio : la fenêtre du lecteur. Un affichage, un égaliseur, les
   trois touches, le volume en blocs, la playlist et la barre d'état,
   comme un lecteur de musique des années 90.

   Elle ne produit aucun son : elle pilote le lecteur de la barre du bas
   (lecteur.js), le seul à jouer, qui ne s'arrête pas quand on change de
   page. Tant qu'une plage n'a pas de son, le lecteur le dit au lieu de
   faire semblant de jouer. */

import { echapper } from "../format.js";
import { choisirPiste, EVENEMENT_PISTE, pisteQuiJoue, reglerVolume, volumeDuLecteur } from "../lecteur.js";
import { trouver } from "./dom.js";
import { sonDisponible } from "./plages.js";

/** @typedef {import("./plages.js").Plage} Plage */
/** @typedef {import("./fenetres.js").Definition} Definition */

const BARRES = 10;
const BLOCS = 10;

const PRECEDENT = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="2.5" height="10"/><path d="M13 3v10L6.5 8z"/></svg>';
const SUIVANT = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="10.5" y="3" width="2.5" height="10"/><path d="M3 3v10l6.5-5z"/></svg>';
const LECTURE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2v12l10-6z"/></svg>';
const PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3.5" height="11"/><rect x="9" y="2.5" width="3.5" height="11"/></svg>';

/**
 * @param {Plage[]} liste
 * @returns {string}
 */
function contenuHTML(liste) {
  const barres = Array.from({ length: BARRES }, () => "<i></i>").join("");
  const blocs = Array.from({ length: BLOCS }, () => "<i></i>").join("");
  const lignes = liste
    .map(
      (p, i) =>
        `<li><button type="button" class="playlist__ligne" data-rang="${i}" aria-current="false">` +
        `<span class="playlist__num">${i + 1}</span>` +
        `<span class="playlist__texte"><span>${echapper(p.ecran)}</span><span>${echapper(p.quand)}</span></span></button></li>`
    )
    .join("");
  return (
    `<div class="os-menu">` +
    `<button type="button" class="os-menu__item" data-ouvrir="ecrire">Écrire à la radio</button>` +
    `<button type="button" class="os-menu__item" data-ouvrir="apropos">À propos</button></div>` +
    `<div class="lecteur-os">` +
    `<div class="lcd"><div class="lcd__texte"><p class="lcd__rang"></p><p class="lcd__titre"></p><p class="lcd__sous"></p><span class="lcd__progres" aria-hidden="true"></span></div>` +
    `<div class="lcd__egaliseur" aria-hidden="true">${barres}</div></div>` +
    `<div class="commandes"><div class="commandes__touches">` +
    `<button type="button" class="os-bouton" data-sens="-1" aria-label="Plage précédente">${PRECEDENT}</button>` +
    `<button type="button" class="os-bouton os-bouton--lecture" data-lecture aria-label="Écouter">${LECTURE}</button>` +
    `<button type="button" class="os-bouton" data-sens="1" aria-label="Plage suivante">${SUIVANT}</button></div>` +
    `<div class="volume"><span class="volume__nom">Volume</span>` +
    `<button type="button" class="os-bouton os-bouton--petit" data-volume="-1" aria-label="Baisser le volume">-</button>` +
    `<span class="volume__blocs" role="img">${blocs}</span>` +
    `<button type="button" class="os-bouton os-bouton--petit" data-volume="1" aria-label="Monter le volume">+</button></div></div>` +
    `<section class="playlist" aria-label="Playlist"><h3 class="playlist__titre">Playlist</h3><ol class="playlist__liste">${lignes}</ol></section></div>` +
    `<p class="os-statut" role="status"><span class="os-statut__texte"></span><span class="tirets" aria-hidden="true"></span><span class="os-statut__fin"></span></p>`
  );
}

/**
 * La fenêtre du lecteur.
 * @param {Plage[]} liste
 * @param {(id: string) => void} ouvrir  Ouvre une autre fenêtre du bureau.
 * @returns {Definition}
 */
export function fenetreLecteur(liste, ouvrir) {
  return {
    id: "lecteur",
    titre: "Minimum radio",
    icone: "cassette",
    largeur: 520,
    contenu: contenuHTML(liste),
    monter: (corps) => brancher(corps, liste, ouvrir),
  };
}

/**
 * @param {HTMLElement} corps
 * @param {Plage[]} liste
 * @param {(id: string) => void} ouvrir
 * @returns {() => void}
 */
function brancher(corps, liste, ouvrir) {
  const lcdRang = trouver(corps, ".lcd__rang", HTMLElement);
  const lcdTitre = trouver(corps, ".lcd__titre", HTMLElement);
  const lcdSous = trouver(corps, ".lcd__sous", HTMLElement);
  const lecture = trouver(corps, "[data-lecture]", HTMLButtonElement);
  const statut = trouver(corps, ".os-statut__texte", HTMLElement);
  const statutFin = trouver(corps, ".os-statut__fin", HTMLElement);
  const volumeBlocs = trouver(corps, ".volume__blocs", HTMLElement);
  const lecteur = trouver(corps, ".lecteur-os", HTMLElement);

  /* La plage choisie : celle qui joue, sinon le direct. */
  let rang = Math.max(0, liste.findIndex((p) => p.piste.id === pisteQuiJoue()));
  let niveau = Math.round(volumeDuLecteur() * BLOCS);
  /** Un message passager dans la barre d'état. */
  let message = "";
  /** @type {number | undefined} */
  let minuteur;

  /** Redessine tout ce qui dépend de la plage ou de l'état du son. */
  const afficher = () => {
    const plage = liste[rang];
    if (!plage) return;
    const joue = pisteQuiJoue() === plage.piste.id;
    lcdRang.textContent = `${String(rang + 1).padStart(2, "0")} / ${String(liste.length).padStart(2, "0")}`;
    lcdTitre.textContent = plage.ecran;
    lcdSous.textContent = plage.quand;
    lecteur.dataset.joue = String(joue);
    lecture.setAttribute("aria-label", joue ? "Pause" : "Écouter");
    lecture.setAttribute("aria-pressed", String(joue));
    lecture.innerHTML = joue ? PAUSE : LECTURE;
    const etat = joue ? (plage.direct ? "En direct" : "Lecture") : sonDisponible(plage) ? "Pause" : "Son à venir";
    statut.textContent = message || etat;
    statutFin.textContent = message ? "" : `Plage ${rang + 1} sur ${liste.length}`;
    volumeBlocs.setAttribute("aria-label", `Volume ${niveau} sur ${BLOCS}`);
    [...volumeBlocs.children].forEach((bloc, i) => bloc instanceof HTMLElement && (bloc.dataset.plein = String(i < niveau)));
    for (const ligne of corps.querySelectorAll(".playlist__ligne")) {
      if (ligne instanceof HTMLElement) ligne.setAttribute("aria-current", String(Number(ligne.dataset.rang) === rang));
    }
  };

  /** @param {string} texte */
  const dire = (texte) => {
    message = texte;
    afficher();
    window.clearTimeout(minuteur);
    minuteur = window.setTimeout(() => {
      message = "";
      afficher();
    }, 3500);
  };

  /** Joue la plage choisie, ou dit pourquoi elle ne joue pas. */
  const jouer = () => {
    const plage = liste[rang];
    if (!plage) return;
    if (sonDisponible(plage)) choisirPiste(plage.piste);
    else dire("Son à venir : la radio n’est pas encore en ondes");
  };

  /** @param {number} sens */
  const aller = (sens) => {
    const jouaitDeja = pisteQuiJoue() !== null;
    rang = (rang + sens + liste.length) % liste.length;
    const plage = liste[rang];
    if (plage && jouaitDeja && sonDisponible(plage)) choisirPiste(plage.piste);
    else afficher();
  };

  /** @param {MouseEvent} e */
  const auClic = (e) => {
    const cible = e.target instanceof Element ? e.target : null;
    if (!cible) return;
    const sens = cible.closest("[data-sens]");
    if (sens instanceof HTMLElement) return aller(Number(sens.dataset.sens));
    if (cible.closest("[data-lecture]")) return jouer();
    const vol = cible.closest("[data-volume]");
    if (vol instanceof HTMLElement) {
      niveau = Math.max(0, Math.min(BLOCS, niveau + Number(vol.dataset.volume)));
      reglerVolume(niveau / BLOCS);
      return afficher();
    }
    const ligne = cible.closest(".playlist__ligne");
    if (ligne instanceof HTMLElement) {
      rang = Number(ligne.dataset.rang);
      return jouer();
    }
    const autre = cible.closest("[data-ouvrir]");
    if (autre instanceof HTMLElement && autre.dataset.ouvrir) ouvrir(autre.dataset.ouvrir);
  };

  /** @param {Event} e */
  const auChangementDePiste = (e) => {
    const id = e instanceof CustomEvent ? (e.detail?.id ?? null) : null;
    const trouve = liste.findIndex((p) => p.piste.id === id);
    if (trouve !== -1) rang = trouve;
    message = "";
    afficher();
  };

  corps.addEventListener("click", auClic);
  document.addEventListener(EVENEMENT_PISTE, auChangementDePiste);
  afficher();

  return () => {
    window.clearTimeout(minuteur);
    corps.removeEventListener("click", auClic);
    document.removeEventListener(EVENEMENT_PISTE, auChangementDePiste);
  };
}
