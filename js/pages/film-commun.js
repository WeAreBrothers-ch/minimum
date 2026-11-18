// @ts-check
/* Minimum : ce que la liste des films et la fiche d’un film partagent. */

import { duree, echapper } from "../format.js";
import { sourcesImage } from "../images.js";

/** @typedef {import("../types.js").Film} Film */
/** @typedef {import("../types.js").Image} Image */
/** @typedef {import("../types.js").Lien} Lien */

/**
 * Des faits courts en pastilles cadrées d’un trait : on les lit d’un coup d’œil.
 * @param {Array<string | null>} faits
 * @returns {string}
 */
function faitsHTML(faits) {
  const presents = faits.filter((f) => f);
  if (presents.length === 0) return "";
  return `<ul class="pastilles" aria-label="En bref">${presents.map((f) => `<li class="pastille">${echapper(f ?? "")}</li>`).join("")}</ul>`;
}

/**
 * Des repères nommés, comme sur un programme imprimé.
 * @param {Array<[string, string | null]>} lignes
 * @returns {string}
 */
function listeReperesHTML(lignes) {
  const presentes = lignes.filter(([, valeur]) => valeur);
  if (presentes.length === 0) return "";
  return `<dl class="fiche__reperes">${presentes
    .map(([terme, valeur]) => `<div><dt>${echapper(terme)}</dt><dd>${echapper(valeur ?? "")}</dd></div>`)
    .join("")}</dl>`;
}

/**
 * Les repères d’un film : genre, durée, version et âge en pastilles,
 * puis qui l’a fait et d’où il vient.
 * @param {Film} film
 * @param {string} [classe]
 * @returns {string}
 */
export function reperesHTML(film, classe = "") {
  return (
    `<div class="fiche__infos ${classe}">${faitsHTML([film.genre, duree(film.duree), film.version, film.age])}` +
    `${listeReperesHTML([
      ["Réalisation", film.realisation],
      ["Avec", film.avec],
      ["Pays", `${film.pays}, ${film.annee}`],
    ])}</div>`
  );
}

/**
 * Les liens vers la presse ou le distributeur : une case chacun, comme
 * « Ouvrir le plan » sur la page Infos. Le genre en capitales (Presse,
 * Distribution), la source, la flèche ↗ calée à droite. Ils s’ouvrent à
 * côté, pour que la radio continue sur Minimum.
 * @param {Lien[]} liens
 * @returns {string}
 */
export function liensHTML(liens) {
  if (liens.length === 0) return "";
  return `<ul class="detail__liens">${liens
    .map(
      (l) =>
        `<li><a class="lien-sortie" href="${echapper(l.url)}" target="_blank" rel="noopener">` +
        `<span class="lien-sortie__genre">${echapper(l.genre)}</span>` +
        `<span class="lien-sortie__source">${echapper(l.source)}</span>` +
        `<span class="fleche fleche--sortie" aria-hidden="true"></span><span class="visuellement-cache"> (nouvel onglet)</span></a></li>`
    )
    .join("")}</ul>`;
}

/**
 * Les images tirées du film, en bande sous la fiche : jointes d’un trait,
 * comme les affiches du mur. Sans image, pas de bande.
 * @param {Image[]} photos
 * @returns {string}
 */
export function photosHTML(photos) {
  if (photos.length === 0) return "";
  const racine = document.body.dataset.racine ?? "";
  const cases = photos
    .map((photo) => {
      const { src, srcset, sizes } = sourcesImage(photo, racine, [480, 720, 1080], "(min-width: 56rem) 33vw, 50vw");
      const variantes = srcset ? ` srcset="${echapper(srcset)}" sizes="${echapper(sizes)}"` : "";
      return (
        `<li class="photos__case"><img src="${echapper(src)}"${variantes} width="${photo.largeur ?? 1600}" ` +
        `height="${photo.hauteur ?? 900}" alt="${echapper(photo.alt)}" loading="lazy" decoding="async"></li>`
      );
    })
    .join("");
  return (
    `<section class="detail__photos" aria-labelledby="titre-photos">` +
    `<h2 class="page__sous-titre" id="titre-photos">Images du film</h2>` +
    `<span class="tirets" aria-hidden="true"></span><ul class="photos">${cases}</ul></section>`
  );
}

/**
 * L’adresse de la fiche d’un film, avec la séance choisie s’il y en a une.
 * @param {string} racine
 * @param {string} filmId
 * @param {string} [seanceId]
 * @returns {string}
 */
export function lienFilm(racine, filmId, seanceId) {
  const params = new URLSearchParams({ id: filmId });
  if (seanceId) params.set("seance", seanceId);
  return `${racine}film/?${params.toString()}${seanceId ? "#billets" : ""}`;
}
