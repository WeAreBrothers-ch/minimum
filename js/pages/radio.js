// @ts-check
/* Minimum : la page Radio. La radio, ce sont des lives filmés et diffusés
   en direct sur YouTube (demande du client, 26.11.2026) : une page simple,
   en cases comme le reste du site.

   - Le lecteur, en grand : le live en cours de la chaîne, sinon le dernier
     live mis en ligne. À côté, ce qu’il montre (« En direct », le titre, le
     jour) et le lien vers la chaîne.
   - Les prochains lives, une ligne chacun.
   - Les lives à revoir : un toucher sur la ligne le met dans le lecteur.

   Le lecteur YouTube est celui « sans cookie » ; le son ne part jamais
   tout seul. */

import { CHAINE_YOUTUBE } from "../config.js";
import { chargerProgramme } from "../donnees.js";
import { echapper, heureCourte, jourCourt, jourLongMajuscule } from "../format.js";
import { lireVideo } from "./bande-annonce.js";
import { afficherErreur, zoneAremplir } from "./commun.js";

/** @typedef {import("../types.js").Emission} Emission */
/** @typedef {import("../types.js").Programme} Programme */

/** L’identifiant d’une chaîne YouTube : « UC » et 22 caractères. */
const ID_CHAINE = /^UC[A-Za-z0-9_-]{22}$/;

/** @returns {string | null} */
function chaine() {
  return CHAINE_YOUTUBE && ID_CHAINE.test(CHAINE_YOUTUBE) ? CHAINE_YOUTUBE : null;
}

/**
 * Ce que montre le lecteur.
 * @typedef {Object} Ecran
 * @property {string | null} source   Adresse du lecteur à intégrer, ou null.
 * @property {string} etat            « En direct », « Dernier live », « À revoir »…
 * @property {boolean} direct
 * @property {Emission | null} live
 */

/**
 * Les lives rangés : celui en cours, ceux à venir (le plus proche
 * d’abord), ceux passés (le plus récent d’abord).
 * @param {Programme} programme
 */
function ranger(programme) {
  const enCours = programme.emissions.find((e) => e.enDirect) ?? null;
  const aVenir = programme.emissions
    .filter((e) => !e.enDirect && e.date >= programme.aujourdhui)
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  const passes = programme.emissions
    .filter((e) => !e.enDirect && e.date < programme.aujourdhui)
    .sort((a, b) => (b.date + b.heure).localeCompare(a.date + a.heure));
  return { enCours, aVenir, passes };
}

/**
 * Le lecteur d’un live mis en ligne, ou null.
 * @param {Emission} e
 * @returns {string | null}
 */
function lecteurDe(e) {
  const video = e.video ? lireVideo(e.video) : null;
  return video && video.fournisseur === "YouTube" ? video.lecteur : null;
}

/**
 * Ce que le lecteur montre en arrivant sur la page.
 * @param {ReturnType<typeof ranger>} lives
 * @returns {Ecran}
 */
function ecranDeDepart(lives) {
  const id = chaine();
  const direct = id ? `https://www.youtube.com/embed/live_stream?channel=${id}&playsinline=1` : null;
  if (lives.enCours) {
    return { source: direct ?? lecteurDe(lives.enCours), etat: "En direct", direct: true, live: lives.enCours };
  }
  const dernier = lives.passes.find((e) => lecteurDe(e));
  if (dernier) return { source: lecteurDe(dernier), etat: "Dernier live", direct: false, live: dernier };
  return { source: direct, etat: "Prochain live", direct: false, live: lives.aVenir[0] ?? null };
}

/**
 * La phrase de la case noire, quand il n’y a pas encore de vidéo à montrer.
 * @param {Ecran} ecran
 * @returns {string}
 */
function vide(ecran) {
  if (!ecran.live) return "Dès le prochain rendez-vous de la radio.";
  if (ecran.direct) return `En direct depuis ${heureCourte(ecran.live.heure)}.`;
  return `Prochain rendez-vous : ${echapper(jourLongMajuscule(ecran.live.date))}, ${heureCourte(ecran.live.heure)}.`;
}

/**
 * Le lecteur : la vidéo, ou une case noire qui dit quand revenir.
 * @param {Ecran} ecran
 * @returns {string}
 */
function lecteurHTML(ecran) {
  if (ecran.source) {
    const titre = ecran.live ? `${ecran.etat} : ${ecran.live.titre}` : "Le live de la radio";
    return (
      `<iframe class="live__video" src="${echapper(ecran.source)}" title="${echapper(titre)}" ` +
      `allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen ` +
      `referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    );
  }
  return (
    `<div class="live__vide"><p class="live__vide-titre">Le live s’affiche ici</p>` +
    `<p>${vide(ecran)}</p></div>`
  );
}

/**
 * La case à côté du lecteur : ce qu’il montre, et le lien vers la chaîne.
 * @param {Ecran} ecran
 * @returns {string}
 */
function infosHTML(ecran) {
  const id = chaine();
  const etat = ecran.direct
    ? `<span class="pastille pastille--etat en-direct">En direct</span>`
    : `<span class="pastille pastille--etat">${echapper(ecran.etat)}</span>`;
  const live = ecran.live
    ? `<p class="live__titre">${echapper(ecran.live.titre)}</p>` +
      `<p class="live__quand">${echapper(jourLongMajuscule(ecran.live.date))}, ${heureCourte(ecran.live.heure)}</p>`
    : `<p class="live__titre">Aucun live annoncé</p>`;
  const lien = id
    ? `<a class="live__chaine" href="https://www.youtube.com/channel/${echapper(id)}" rel="noopener">` +
      `La chaîne YouTube <span class="fleche fleche--sortie" aria-hidden="true"></span></a>`
    : "";
  return `<div class="live__etat">${etat}</div>${live}${lien}`;
}

/**
 * Une ligne de live : le jour et l’heure dans la couleur de la radio, le
 * titre ; « Revoir » quand la vidéo est en ligne.
 * @param {Emission} e
 * @param {boolean} passe
 * @returns {string}
 */
function ligneHTML(e, passe) {
  const quand =
    `<span class="ligne-live__quand"><span>${echapper(jourCourt(e.date).replace(/ /g, " "))}</span>` +
    `<span>${heureCourte(e.heure)}</span></span>`;
  const titre = `<span class="ligne-live__titre">${echapper(e.titre)}</span>`;
  if (!passe) {
    return `<li id="${echapper(e.id)}"><div class="ligne-live">${quand}${titre}<span class="ligne-live__action">Sur YouTube</span></div></li>`;
  }
  if (!lecteurDe(e)) {
    return `<li id="${echapper(e.id)}"><div class="ligne-live">${quand}${titre}<span class="ligne-live__action">Bientôt en ligne</span></div></li>`;
  }
  return (
    `<li id="${echapper(e.id)}"><button type="button" class="ligne-live ligne-live--revoir" data-live="${echapper(e.id)}">` +
    `${quand}${titre}<span class="ligne-live__action">Revoir <span class="fleche" aria-hidden="true"></span></span></button></li>`
  );
}

/**
 * @param {string} titre
 * @param {Emission[]} liste
 * @param {boolean} passe
 * @returns {string}
 */
function sectionHTML(titre, liste, passe) {
  if (liste.length === 0) return "";
  return (
    `<section class="lives" aria-label="${echapper(titre)}"><h2 class="rubrique">${echapper(titre)}</h2>` +
    `<ul class="lives__liste">${liste.map((e) => ligneHTML(e, passe)).join("")}</ul></section>`
  );
}

/**
 * @param {Programme} programme
 * @returns {{ html: string, lives: ReturnType<typeof ranger> }}
 */
function pageHTML(programme) {
  const lives = ranger(programme);
  const ecran = ecranDeDepart(lives);
  const html =
    `<section class="live" aria-label="Le lecteur">` +
    `<div class="live__ecran">${lecteurHTML(ecran)}</div>` +
    `<div class="live__infos" aria-live="polite">${infosHTML(ecran)}</div></section>` +
    sectionHTML("Prochains lives", lives.aVenir, false) +
    sectionHTML("À revoir", lives.passes, true);
  return { html, lives };
}

/**
 * Met un live passé dans le lecteur.
 * @param {HTMLElement} zone
 * @param {Emission} e
 */
function revoir(zone, e) {
  const source = lecteurDe(e);
  const cadre = zone.querySelector(".live__ecran");
  const infos = zone.querySelector(".live__infos");
  if (!source || !(cadre instanceof HTMLElement) || !(infos instanceof HTMLElement)) return;
  /** @type {Ecran} */
  const ecran = { source, etat: "À revoir", direct: false, live: e };
  cadre.innerHTML = lecteurHTML(ecran);
  infos.innerHTML = infosHTML(ecran);
  for (const b of zone.querySelectorAll("[data-live]")) {
    if (b instanceof HTMLElement) b.setAttribute("aria-current", String(b.dataset.live === e.id));
  }
  cadre.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

/**
 * Remplit la page Radio. Renvoie de quoi la démonter.
 * @returns {() => void}
 */
export function initRadio() {
  const fin = new AbortController();
  const zone = zoneAremplir();
  if (!zone) return () => fin.abort();
  chargerProgramme()
    .then((programme) => {
      if (fin.signal.aborted) return;
      const { html, lives } = pageHTML(programme);
      zone.innerHTML = html;
      zone.addEventListener(
        "click",
        (ev) => {
          const bouton = ev.target instanceof Element ? ev.target.closest("[data-live]") : null;
          if (!(bouton instanceof HTMLElement)) return;
          const live = lives.passes.find((e) => e.id === bouton.dataset.live);
          if (live) revoir(zone, live);
        },
        { signal: fin.signal }
      );
      /* Arrivé depuis l’accueil ou l’agenda sur un live (radio/#live-…) :
         un live passé se met dans le lecteur, les autres sont montrés. */
      const id = decodeURIComponent(location.hash.slice(1));
      const passe = lives.passes.find((e) => e.id === id && lecteurDe(e));
      if (passe) revoir(zone, passe);
      else if (id && id !== lives.enCours?.id) document.getElementById(id)?.scrollIntoView();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
  return () => fin.abort();
}
