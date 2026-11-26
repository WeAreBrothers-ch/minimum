// @ts-check
/* Minimum : ce qui monte sur chaque mur, et le dessin d’une case. */

import { filmsALAffiche, filmsAnnonces } from "./donnees.js";
import { echapper, heureCourte, jourLong, jourLongMajuscule } from "./format.js";
import { sourcesImage } from "./images.js";

/** @typedef {import("./types.js").Programme} Programme */
/** @typedef {import("./types.js").Carte} Carte */

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
  }));

  return [...aLAffiche, ...annonces];
}

/**
 * Le mur Musique : les soirées à venir. La radio n’y a qu’une case, celle
 * de sa rubrique, qui dit le live en cours ou le prochain (accueil.js).
 * @param {Programme} programme
 * @returns {Carte[]}
 */
export function cartesMusique(programme) {
  return programme.soirees
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
    }));
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
  if (carte.genre === "rubrique") return rubriqueHTML(carte, racine, cache);
  const typo = carte.image === null;
  const classes = `carte${typo ? " carte--typo" : ""}${carte.genre === "film" ? "" : ` carte--${carte.genre}`}`;
  const contenu = typo ? contenuTypographique(carte) : imageHTML(carte, racine, prioritaire);

  /* Un live mène à la page Radio, sur sa ligne. */
  return `<a class="${classes}" href="${echapper(racine + carte.lien)}"${cache}>${contenu}</a>`;
}

/**
 * Une rubrique dans le mur : une case de sa couleur, moins haute qu’une
 * affiche, son nom en grand.
 * @param {Carte} carte
 * @param {string} racine
 * @param {string} cache
 * @returns {string}
 */
function rubriqueHTML(carte, racine, cache) {
  const classes = `carte carte--rubrique carte--${carte.teinte ?? "cinema"}`;
  const nom = `<span class="carte__rubrique">${echapper(carte.titre)}</span>`;
  const ligne = carte.ligne ? `<span class="carte__ligne">${echapper(carte.ligne)}</span>` : "";
  return (
    `<a class="${classes}" href="${echapper(racine + carte.lien)}"${cache}>${nom}` +
    `<span class="carte__suite">${ligne}<span class="fleche" aria-hidden="true"></span></span></a>`
  );
}

/**
 * Les rubriques glissées entre les affiches, à intervalles réguliers : la
 * première tout en haut, les autres réparties dans le cycle.
 * @param {Carte[]} affiches
 * @param {Carte[]} rubriques
 * @returns {Carte[]}
 */
export function intercaler(affiches, rubriques) {
  const total = affiches.length + rubriques.length;
  /** @type {Map<number, Carte>} */
  const places = new Map();
  rubriques.forEach((r, i) => places.set(Math.floor((i * total) / rubriques.length), r));
  /** @type {Carte[]} */
  const liste = [];
  let a = 0;
  for (let i = 0; i < total; i++) {
    const rubrique = places.get(i);
    const affiche = affiches[a];
    if (rubrique) liste.push(rubrique);
    else if (affiche) {
      liste.push(affiche);
      a++;
    }
  }
  return liste;
}

/**
 * @param {Carte} carte
 * @returns {string}
 */
function contenuTypographique(carte) {
  return (
    `<span class="carte__haut"><span class="carte__titre">${echapper(carte.titre)}</span>` +
    `<span class="carte__etat pastille pastille--etat">${echapper(carte.etat)}</span></span>` +
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
  /* Pas de chargement différé : le mur répète les mêmes affiches de copie en
     copie, et une affiche qui n'arrive qu'au moment de passer à l'écran
     laisserait une case vide (noire côté Musique) quand on défile vite. Le
     navigateur ne télécharge chaque image qu'une fois. */
  const chargement = prioritaire ? ' fetchpriority="high"' : "";
  const variantes = srcset ? ` srcset="${echapper(srcset)}" sizes="${echapper(sizes)}"` : "";
  return (
    `<img class="carte__image" src="${echapper(src)}"${variantes} width="480" height="720" ` +
    `alt="${echapper(carte.image.alt)}" decoding="async"${chargement}>`
  );
}
