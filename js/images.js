// @ts-check
/* Minimum : les attributs d’une image, qu’elle vienne de Sanity (redimensionnée
   à la demande) ou du site lui-même (les exemples, servis tels quels). */

import { imageALaLargeur } from "./sanity.js";

/** @typedef {import("./types.js").Image} Image */

/**
 * @param {string} url
 * @returns {boolean}
 */
function vientDeSanity(url) {
  return url.startsWith("https://cdn.sanity.io/");
}

/**
 * Les attributs src, srcset et sizes d’une image.
 * @param {Image} image
 * @param {string} racine       Chemin relatif vers la racine du site.
 * @param {number[]} largeurs   Largeurs proposées au navigateur (Sanity).
 * @param {string} sizes
 * @returns {{ src: string, srcset: string, sizes: string }}
 */
export function sourcesImage(image, racine, largeurs, sizes) {
  if (!vientDeSanity(image.url)) {
    return { src: racine + image.url, srcset: "", sizes: "" };
  }
  const moyenne = largeurs[Math.floor(largeurs.length / 2)] ?? 480;
  return {
    src: imageALaLargeur(image.url, moyenne),
    srcset: largeurs.map((l) => `${imageALaLargeur(image.url, l)} ${l}w`).join(", "),
    sizes,
  };
}
