// @ts-check
/* Minimum : la machine à flyers (croquis du client, 26.11.2026).

   Chaque live de la radio a son flyer, composé par le site à partir du
   portrait de l’artiste : la photo en plein, « LIVE YOUTUBE » en haut,
   puis, en bas, le nom en très grand, la date et l’heure, comme sur le
   croquis (« DJ … 24.12.26 19H00 »). Il suffit de saisir le nom, le jour,
   l’heure et le portrait : rien à dessiner à la main. Sans portrait, le
   flyer est typographique, sur le rose de la musique.

   Le même flyer sert sur le mur de l’accueil et sur la page Radio. */

import { echapper } from "./format.js";
import { sourcesImage } from "./images.js";

/** @typedef {import("./types.js").Emission} Emission */

/**
 * « 2026-12-24 » → « 24.12.26 ».
 * @param {string} iso
 * @returns {string}
 */
export function dateFlyer(iso) {
  const [annee = "", mois = "", jour = ""] = iso.split("-");
  return `${jour}.${mois}.${annee.slice(2)}`;
}

/**
 * « 19:00 » → « 19H00 ».
 * @param {string} heure
 * @returns {string}
 */
export function heureFlyer(heure) {
  return heure.replace(":", "H");
}

/**
 * @typedef {Object} ReglagesFlyer
 * @property {string} lien        Adresse du flyer, déjà relative à la page.
 * @property {string} [attributs] Attributs en plus (aria-hidden pour les copies du mur).
 * @property {boolean} [prioritaire]  Image à charger en priorité.
 * @property {string} [tailles]   Attribut sizes de l’image.
 */

/**
 * Le flyer d’un live, en lien.
 * @param {Emission} live
 * @param {string} racine
 * @param {ReglagesFlyer} reglages
 * @returns {string}
 */
export function flyerHTML(live, racine, reglages) {
  const portrait = live.visuel;
  let image = "";
  if (portrait) {
    const { src, srcset, sizes } = sourcesImage(portrait, racine, [320, 480, 720], reglages.tailles ?? "(min-width: 56rem) 25vw, 50vw");
    const variantes = srcset ? ` srcset="${echapper(srcset)}" sizes="${echapper(sizes)}"` : "";
    image =
      `<img class="flyer__portrait" src="${echapper(src)}"${variantes} width="480" height="720" alt="" decoding="async"` +
      `${reglages.prioritaire ? ' fetchpriority="high"' : ""}>`;
  }
  const direct = live.enDirect ? `<span class="flyer__direct en-direct">En direct</span>` : "";
  const quand = `${dateFlyer(live.date)}, ${heureFlyer(live.heure)}`;
  return (
    `<a class="flyer${portrait ? "" : " flyer--typo"}" href="${echapper(reglages.lien)}"` +
    ` aria-label="${echapper(`Live YouTube : ${live.titre}, ${quand}${live.enDirect ? ", en direct" : ""}`)}"${reglages.attributs ?? ""}>` +
    image +
    `<span class="flyer__haut" aria-hidden="true"><span class="flyer__live">Live YouTube</span>${direct}</span>` +
    `<span class="flyer__bas" aria-hidden="true"><span class="flyer__nom">${echapper(live.titre)}</span>` +
    `<span class="flyer__quand"><span>${dateFlyer(live.date)}</span><span>${heureFlyer(live.heure)}</span></span></span></a>`
  );
}
