// @ts-check
/* Minimum : ce qui monte sur chaque mur, et le dessin d’une case. */

import { filmsALAffiche, filmsAnnonces } from "./donnees.js";
import { echapper, heureCourte, jourLong, jourLongMajuscule } from "./format.js";
import { sourcesImage } from "./images.js";

/** @typedef {import("./types.js").Programme} Programme */
/** @typedef {import("./types.js").Carte} Carte */

/** La couleur de chaque monde (code couleur, jetons.css). @type {Record<Carte["genre"], string>} */
const TEINTE = { film: "cinema", soiree: "nuit", emission: "radio" };

/**
 * Le mur Cinéma : les films à l’affiche, du plus proche au plus lointain,
 * puis les films annoncés par date de sortie.
 * @param {Programme} programme
 * @returns {Carte[]}
 */
export function cartesCinema(programme) {
  const prochaine = (/** @type {string} */ id) =>
    programme.seances
      .filter((s) => s.filmId === id && s.date >= programme.aujourdhui)
      .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure))[0];

  /** @type {Carte[]} */
  const aLAffiche = filmsALAffiche(programme)
    .map((film) => ({ film, seance: prochaine(film.id) }))
    .sort((a, b) =>
      ((a.seance?.date ?? "") + (a.seance?.heure ?? "")).localeCompare(
        (b.seance?.date ?? "") + (b.seance?.heure ?? "")
      )
    )
    .map(({ film, seance }) => ({
      genre: "film",
      id: film.id,
      titre: film.titre,
      lien: `film/?id=${encodeURIComponent(film.id)}`,
      image: film.affiche,
      ligne: seance ? `${jourLongMajuscule(seance.date)}, ${heureCourte(seance.heure)}` : film.realisation,
      etat: "À l’affiche",
      audio: null,
    }));

  /** @type {Carte[]} */
  const annonces = filmsAnnonces(programme).map((film) => ({
    genre: "film",
    id: film.id,
    titre: film.titre,
    lien: `film/?id=${encodeURIComponent(film.id)}`,
    image: film.affiche,
    ligne: film.sortie ? `Sortie le ${jourLong(film.sortie)}` : film.realisation,
    etat: "Prochainement",
    audio: null,
  }));

  return [...aLAffiche, ...annonces];
}

/**
 * Le mur Nuit : les soirées à venir et les émissions de la radio, mêlées
 * une à une pour que la radio ne disparaisse pas sous les affiches.
 * @param {Programme} programme
 * @returns {Carte[]}
 */
export function cartesNuit(programme) {
  /** @type {Carte[]} */
  const soirees = programme.soirees
    .filter((s) => s.date >= programme.aujourdhui)
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure))
    .map((s) => ({
      genre: "soiree",
      id: s.id,
      titre: s.titre,
      lien: `soiree/?id=${encodeURIComponent(s.id)}`,
      image: s.affiche,
      ligne: `${jourLongMajuscule(s.date)}, ${heureCourte(s.heure)}`,
      etat: "Soirée",
      audio: null,
    }));

  /** @type {Carte[]} */
  const emissions = [...programme.emissions]
    .sort((a, b) => Number(b.enDirect) - Number(a.enDirect) || b.date.localeCompare(a.date))
    .map((e) => ({
      genre: "emission",
      id: e.id,
      titre: e.titre,
      lien: `radio/#${e.id}`,
      image: e.visuel,
      ligne: `${jourLongMajuscule(e.date)}, ${heureCourte(e.heure)}`,
      etat: e.enDirect ? "En direct" : "À réécouter",
      audio: e.audio,
    }));

  /** @type {Carte[]} */
  const melange = [];
  const longueur = Math.max(soirees.length, emissions.length);
  for (let i = 0; i < longueur; i++) {
    const soiree = soirees[i];
    const emission = emissions[i];
    if (soiree) melange.push(soiree);
    if (emission) melange.push(emission);
  }
  return melange;
}

/**
 * Le dessin d’une case, avec ou sans image.
 * @param {Carte} carte
 * @param {string} racine      Chemin relatif vers la racine du site.
 * @param {boolean} accessible Faux pour les copies du mur, cachées aux lecteurs d’écran.
 * @param {boolean} prioritaire Vrai pour les cases visibles à l’arrivée.
 * @returns {string}
 */
export function carteHTML(carte, racine, accessible, prioritaire) {
  const cache = accessible ? "" : ' aria-hidden="true" tabindex="-1"';
  const typo = carte.image === null;
  const classes = `carte${typo ? " carte--typo" : ""}${carte.genre === "film" ? "" : ` carte--${carte.genre}`}`;
  const contenu = typo ? contenuTypographique(carte) : imageHTML(carte, racine, prioritaire);

  /* Une émission mène à la page Radio, où le lecteur se place sur elle. */
  const piste = carte.genre === "emission" ? ` data-piste="${echapper(carte.id)}"` : "";
  return `<a class="${classes}" href="${echapper(racine + carte.lien)}"${piste}${cache}>${contenu}</a>`;
}

/**
 * @param {Carte} carte
 * @returns {string}
 */
function contenuTypographique(carte) {
  return (
    `<span class="carte__haut"><span class="carte__titre">${echapper(carte.titre)}</span>` +
    `<span class="carte__etat pastille pastille--${TEINTE[carte.genre]}">${echapper(carte.etat)}</span></span>` +
    `<span class="carte__bas"><span class="carte__tirets tirets" aria-hidden="true"></span>` +
    `<span class="carte__ligne">${echapper(carte.ligne)}</span></span>`
  );
}

/**
 * @param {Carte} carte
 * @param {string} racine
 * @param {boolean} prioritaire
 * @returns {string}
 */
function imageHTML(carte, racine, prioritaire) {
  if (!carte.image) return "";
  const { src, srcset, sizes } = sourcesImage(carte.image, racine, [320, 480, 720, 960], "(min-width: 56rem) 25vw, 50vw");
  const chargement = prioritaire ? ' fetchpriority="high"' : ' loading="lazy"';
  const variantes = srcset ? ` srcset="${echapper(srcset)}" sizes="${echapper(sizes)}"` : "";
  return (
    `<img class="carte__image" src="${echapper(src)}"${variantes} width="480" height="720" ` +
    `alt="${echapper(carte.image.alt)}" decoding="async"${chargement}>`
  );
}
