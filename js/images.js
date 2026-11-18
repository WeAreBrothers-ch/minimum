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

/** Les largeurs enregistrées à côté des images du site, en WebP. */
const LARGEURS_LOCALES = [360, 720];

/**
 * Les affiches et visuels enregistrés avec le site ont des variantes WebP
 * à 360 et 720 px (« nom-360.webp », « nom-720.webp »). Le chemin sans
 * extension, ou null pour une autre image.
 * @param {string} url
 * @returns {string | null}
 */
function baseDesVariantes(url) {
  const m = url.match(/^(assets\/img\/(?:affiches|exemples)\/[^/]+?)\.(?:jpe?g|png|webp)$/);
  return m?.[1] ?? null;
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
    const base = baseDesVariantes(image.url);
    if (!base) return { src: racine + image.url, srcset: "", sizes: "" };
    return {
      src: `${racine}${base}-720.webp`,
      srcset: LARGEURS_LOCALES.map((l) => `${racine}${base}-${l}.webp ${l}w`).join(", "),
      sizes,
    };
  }
  const moyenne = largeurs[Math.floor(largeurs.length / 2)] ?? 480;
  return {
    src: imageALaLargeur(image.url, moyenne),
    srcset: largeurs.map((l) => `${imageALaLargeur(image.url, l)} ${l}w`).join(", "),
    sizes,
  };
}
