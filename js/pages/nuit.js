// @ts-check
/* Minimum : la page Nuit, les soirées du club. Une grille d’affiches :
   sous chacune, la date, la case rose du line-up et la case verte des
   billets. Chaque soirée mène à sa fiche. */

import { chargerProgramme } from "../donnees.js";
import { echapper, heureCourte, jourLongMajuscule } from "../format.js";
import { afficheHTML, afficherErreur, zoneAremplir } from "./commun.js";

/** @typedef {import("../types.js").Soiree} Soiree */

/**
 * @param {Soiree} soiree
 * @param {string} racine
 * @returns {string}
 */
function carreauHTML(soiree, racine) {
  const lien = echapper(`${racine}soiree/?id=${encodeURIComponent(soiree.id)}`);
  /* Insécable autour du tiret (et un liant invisible) : « 23 h – 4 h » ne se coupe pas. */
  const fin = soiree.fin ? ` –⁠ ${heureCourte(soiree.fin)}` : "";
  return (
    `<li class="carreau" id="${echapper(soiree.id)}">` +
    `<a class="carreau__affiche" href="${lien}" tabindex="-1" aria-hidden="true">${afficheHTML(soiree.affiche, soiree.titre)}</a>` +
    `<div class="carreau__texte"><h3 class="carreau__titre"><a href="${lien}">${echapper(soiree.titre)}</a></h3></div>` +
    `<p class="carreau__faits">${echapper(jourLongMajuscule(soiree.date))}<br />${heureCourte(soiree.heure)}${fin}</p>` +
    `<a class="carreau__action carreau__action--nuit" href="${lien}">Line-up</a>` +
    (soiree.tarifs.length ? `<a class="carreau__action carreau__action--argent" href="${lien}#billets">Billets</a>` : "") +
    `</li>`
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
      zone.innerHTML = aVenir.length
        ? `<ul class="carreaux">${aVenir.map((s) => carreauHTML(s, racine)).join("")}</ul>`
        : '<p class="page__vide">Aucune soirée annoncée pour l’instant.</p>';
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
}
