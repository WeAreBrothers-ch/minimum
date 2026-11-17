// @ts-check
/* Minimum : la page Nuit, les soirées du club. Chaque soirée mène à sa
   fiche : affiche entière, line-up et billets. */

import { chargerProgramme } from "../donnees.js";
import { echapper, heureCourte, jourLongMajuscule } from "../format.js";
import { afficheHTML, afficherErreur, zoneAremplir } from "./commun.js";

/** @typedef {import("../types.js").Soiree} Soiree */

/**
 * @param {Soiree} soiree
 * @param {string} racine
 * @returns {string}
 */
function soireeHTML(soiree, racine) {
  const lien = `${racine}soiree/?id=${encodeURIComponent(soiree.id)}`;
  /* Insécable autour du tiret (et un liant invisible) : « 23 h – 4 h » ne se coupe pas. */
  const fin = soiree.fin ? `\u00a0–\u2060\u00a0${heureCourte(soiree.fin)}` : "";
  return (
    `<article class="fiche" id="${echapper(soiree.id)}">${afficheHTML(soiree.affiche, soiree.titre)}` +
    `<div class="fiche__texte"><h3 class="fiche__titre"><a href="${echapper(lien)}">${echapper(soiree.titre)}</a></h3>` +
    `<p>${echapper(jourLongMajuscule(soiree.date))}, ${heureCourte(soiree.heure)}${fin}</p>` +
    `<p class="fiche__actions"><a class="pastille pastille--nuit pastille--action" href="${echapper(lien)}">Line-up</a>` +
    (soiree.tarifs.length ? `<a class="pastille pastille--argent pastille--action" href="${echapper(lien)}#billets">Billets</a>` : "") +
    `</p></div></article>`
  );
}

/** Remplit la page Nuit. */
export function initNuit() {
  const zone = zoneAremplir();
  if (!zone) return;
  const racine = document.body.dataset.racine ?? "";
  chargerProgramme()
    .then((programme) => {
      const aVenir = programme.soirees
        .filter((s) => s.date >= programme.aujourdhui)
        .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
      zone.innerHTML =
        (aVenir.length
          ? `<section class="page__section"><h2 class="page__sous-titre">Soirées à venir</h2>` +
            `<span class="tirets" aria-hidden="true"></span>${aVenir.map((s) => soireeHTML(s, racine)).join("")}</section>`
          : '<p class="page__vide">Aucune soirée annoncée pour l’instant.</p>');
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
}
