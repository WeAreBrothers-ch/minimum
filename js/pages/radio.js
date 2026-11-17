// @ts-check
/* Minimum : la page Radio, le direct et les émissions à réécouter. */

import { FLUX_RADIO } from "../config.js";
import { chargerProgramme } from "../donnees.js";
import { echapper, heureCourte, jourLong, jourLongMajuscule } from "../format.js";
import { choisirPiste, EVENEMENT_PISTE, pisteQuiJoue } from "../lecteur.js";
import { afficherErreur, zoneAremplir } from "./commun.js";

/** @typedef {import("../types.js").Emission} Emission */
/** @typedef {import("../types.js").Programme} Programme */
/** @typedef {import("../types.js").Piste} Piste */

/**
 * @param {Emission} e
 * @returns {Piste}
 */
function piste(e) {
  return { id: e.id, titre: e.titre, etat: e.enDirect ? "En direct" : "À réécouter", audio: e.audio };
}

/** @type {Piste} */
const DIRECT = { id: "direct", titre: "Radio Minimum", etat: "Radio", audio: FLUX_RADIO };

/**
 * @param {Emission} e
 * @returns {string}
 */
function emissionHTML(e) {
  return (
    `<li class="emission" id="${echapper(e.id)}">` +
    `<button type="button" class="emission__bouton pastille pastille--radio pastille--action" data-piste="${echapper(e.id)}" aria-pressed="false"${e.audio ? "" : " disabled"}>Écouter</button>` +
    `<div class="emission__texte"><h3 class="emission__titre">${echapper(e.titre)}</h3>` +
    `<p>${echapper(e.enDirect ? `En direct, ${jourLong(e.date)}` : jourLongMajuscule(e.date))}, ${heureCourte(e.heure)}` +
    `${e.audio ? "" : ". Son à venir."}</p></div></li>`
  );
}

/** @param {string | null} id */
function marquer(id) {
  for (const bouton of document.querySelectorAll(".emission__bouton, .direct__bouton")) {
    if (bouton instanceof HTMLElement) {
      const actif = bouton.dataset.piste === id;
      bouton.setAttribute("aria-pressed", String(actif));
      bouton.textContent = actif ? "Pause" : "Écouter";
    }
  }
}

/** @param {Event} e */
function auChangementDePiste(e) {
  if (e instanceof CustomEvent) marquer(e.detail?.id ?? null);
}

/**
 * @param {Programme} programme
 * @returns {string}
 */
function pageHTML(programme) {
  const enDirect = programme.emissions.filter((e) => e.enDirect);
  const archives = programme.emissions
    .filter((e) => !e.enDirect)
    .sort((a, b) => b.date.localeCompare(a.date));
  const direct =
    `<section class="page__section direct"><h2 class="page__sous-titre">Le direct</h2>` +
    `<span class="tirets" aria-hidden="true"></span>` +
    `<div class="direct__ligne"><button type="button" class="direct__bouton emission__bouton pastille pastille--radio pastille--action" data-piste="direct" aria-pressed="false"${FLUX_RADIO ? "" : " disabled"}>Écouter</button>` +
    `<p>${FLUX_RADIO ? "Radio Minimum, en continu." : "Le flux de la radio n’est pas encore branché."}</p></div>` +
    (enDirect.length ? `<ul class="emissions">${enDirect.map(emissionHTML).join("")}</ul>` : "") +
    `</section>`;
  const reecouter = archives.length
    ? `<section class="page__section"><h2 class="page__sous-titre">À réécouter</h2>` +
      `<span class="tirets" aria-hidden="true"></span><ul class="emissions">${archives.map(emissionHTML).join("")}</ul></section>`
    : "";
  return direct + reecouter;
}

/**
 * Remplit la page Radio. Renvoie de quoi la démonter.
 * @returns {() => void}
 */
export function initRadio() {
  const zone = zoneAremplir();
  if (!zone) return () => {};
  /** @type {(e: MouseEvent) => void} */
  let clic = () => {};

  chargerProgramme()
    .then((programme) => {
      zone.innerHTML = pageHTML(programme);
      clic = (e) => {
        const cible = e.target instanceof Element ? e.target.closest("[data-piste]") : null;
        if (!(cible instanceof HTMLElement)) return;
        if (cible.dataset.piste === "direct") return choisirPiste(DIRECT);
        const emission = programme.emissions.find((em) => em.id === cible.dataset.piste);
        if (emission) choisirPiste(piste(emission));
      };
      zone.addEventListener("click", clic);
      marquer(pisteQuiJoue());
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));

  document.addEventListener(EVENEMENT_PISTE, auChangementDePiste);
  return () => {
    zone.removeEventListener("click", clic);
    document.removeEventListener(EVENEMENT_PISTE, auChangementDePiste);
  };
}
