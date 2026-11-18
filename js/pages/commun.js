// @ts-check
/* Minimum : petits morceaux partagés par les pages de contenu. */

import { echapper } from "../format.js";
import { sourcesImage } from "../images.js";

/** @typedef {import("../types.js").Image} Image */

/**
 * La zone de la page que le script remplit, ou null.
 * @returns {HTMLElement | null}
 */
export function zoneAremplir() {
  const zone = document.querySelector("[data-remplir]");
  return zone instanceof HTMLElement ? zone : null;
}

/**
 * Une affiche hors du mur : image, ou affiche typographique.
 * Sur une fiche détaillée, l’affiche garde ses proportions réelles
 * (une affiche de soirée n’est pas recadrée) et se charge en priorité.
 * @param {Image | null} image
 * @param {string} titre
 * @param {{ detail?: boolean, prioritaire?: boolean }} [reglages]
 *   `prioritaire` : une affiche visible dès l’arrivée, chargée tout de suite.
 * @returns {string}
 */
export function afficheHTML(image, titre, reglages = {}) {
  const detail = reglages.detail === true;
  if (!image) {
    return `<div class="fiche__affiche fiche__affiche--typo" aria-hidden="true"><span>${echapper(titre)}</span></div>`;
  }
  const racine = document.body.dataset.racine ?? "";
  const tailles = detail
    ? "(min-width: 56rem) 25vw, 50vw"
    : "(min-width: 75rem) 25vw, (min-width: 40rem) 33vw, 38vw";
  const { src, srcset, sizes } = sourcesImage(image, racine, [240, 360, 480, 720], tailles);
  const variantes = srcset ? ` srcset="${echapper(srcset)}" sizes="${echapper(sizes)}"` : "";
  const naturelle = detail && image.largeur && image.hauteur;
  const dimensions = naturelle ? `width="${image.largeur}" height="${image.hauteur}"` : 'width="360" height="540"';
  const chargement = detail || reglages.prioritaire === true ? 'fetchpriority="high"' : 'loading="lazy"';
  return (
    `<div class="fiche__affiche${naturelle ? ` fiche__affiche--naturelle" style="--proportion: ${image.largeur} / ${image.hauteur}` : ""}">` +
    `<img src="${echapper(src)}"${variantes} ` +
    `${dimensions} alt="${echapper(image.alt)}" ${chargement} decoding="async"></div>`
  );
}

/**
 * Le titre et la description de l’onglet, pour une page remplie par script.
 * @param {string} titre
 * @param {string} description
 */
export function nommerPage(titre, description) {
  document.title = titre;
  document.querySelector('meta[name="description"]')?.setAttribute("content", description);
}

/**
 * Fait défiler jusqu’à l’ancre de l’adresse, une fois la page remplie.
 */
export function allerALAncre() {
  const ancre = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  ancre?.scrollIntoView();
}

/**
 * Message quand le programme ne se charge pas.
 * @param {HTMLElement} zone
 * @param {unknown} erreur
 */
export function afficherErreur(zone, erreur) {
  console.warn("Minimum : programme indisponible.", erreur);
  zone.innerHTML =
    '<p class="avis message-probleme">Le programme n’a pas pu être chargé. Rechargez la page dans un instant.</p>';
}
