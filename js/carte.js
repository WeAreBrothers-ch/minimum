// @ts-check
/* Minimum : ce qui monte sur chaque mur, et le dessin d’une case. */

import { filmsALAffiche, filmsAnnonces } from "./donnees.js";
import { echapper, heureCourte, jourLong, jourLongMajuscule } from "./format.js";
import { flyerHTML } from "./flyer.js";
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
 * Le mur Musique : les soirées à venir et les flyers des lives (celui en
 * cours, puis ceux à venir), mêlés un à un pour que la radio ne disparaisse
 * pas sous les affiches.
 * @param {Programme} programme
 * @returns {Carte[]}
 */
export function cartesMusique(programme) {
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
    }));

  /** @type {Carte[]} */
  const lives = programme.emissions
    .filter((e) => e.enDirect || e.date >= programme.aujourdhui)
    .sort((a, b) => Number(b.enDirect) - Number(a.enDirect) || (a.date + a.heure).localeCompare(b.date + b.heure))
    .map((e) => ({
      genre: "emission",
      id: e.id,
      titre: e.titre,
      lien: `radio/#${e.id}`,
      image: e.visuel,
      ligne: `${jourLongMajuscule(e.date)}, ${heureCourte(e.heure)}`,
      etat: e.enDirect ? "En direct" : "Live à venir",
      live: e,
    }));

  /** @type {Carte[]} */
  const melange = [];
  for (let i = 0; i < Math.max(soirees.length, lives.length); i++) {
    const soiree = soirees[i];
    const live = lives[i];
    if (soiree) melange.push(soiree);
    if (live) melange.push(live);
  }
  return melange;
}

/**
 * Le dessin d’une case, avec ou sans image.
 * @param {Carte} carte
 * @param {string} racine      Chemin relatif vers la racine du site.
 * @param {boolean} accessible Faux pour les copies du mur, cachées aux lecteurs d’écran.
 * @param {boolean} prioritaire Vrai pour les cases visibles à l’arrivée.
 * @param {number} [hauteur]   Une rubrique du mur : sa hauteur, en pixels.
 * @returns {string}
 */
export function carteHTML(carte, racine, accessible, prioritaire, hauteur) {
  const cache = accessible ? "" : ' aria-hidden="true" tabindex="-1"';
  if (carte.genre === "rubrique") return rubriqueHTML(carte, racine, hauteur ? `${cache} style="--hauteur-rubrique: ${hauteur}px"` : cache);
  if (carte.live) return flyerHTML(carte.live, racine, { lien: racine + carte.lien, attributs: cache, prioritaire });
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
 * @param {string} cache     Attributs en plus (copie cachée, hauteur dans le mur).
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
