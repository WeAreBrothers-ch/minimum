// @ts-check
/* Minimum : l’accueil, deux murs (Musique et Cinéma) dont chaque colonne défile seule. */

import { cartesCinema, cartesMusique, intercaler } from "./carte.js";
import { chargerProgramme } from "./donnees.js";
import { heureCourte, jourCourt } from "./format.js";
import { monterMur } from "./mur.js";

/** @typedef {import("./types.js").Programme} Programme */
/** @typedef {import("./types.js").Carte} Carte */

/**
 * Remplit une moitié et renvoie de quoi la démonter.
 * @param {HTMLElement | null} moitie
 * @param {Carte[]} cartes
 * @param {string} racine
 * @returns {() => void}
 */
function remplir(moitie, cartes, racine) {
  const colonnes = moitie?.querySelector(".moitie__colonnes");
  if (!(colonnes instanceof HTMLElement)) return () => {};
  return monterMur(colonnes, cartes, racine);
}

/**
 * Ce que contient un mur : « 7 soirées · 3 lives ».
 * @param {Carte[]} cartes
 * @param {Array<[Carte["genre"], string, string]>} genres  Genre, singulier, pluriel.
 * @param {string} sinon  Quand il n’y a rien.
 * @returns {string}
 */
function compter(cartes, genres, sinon) {
  const parties = genres
    .map(([genre, un, plusieurs]) => {
      const n = cartes.filter((c) => c.genre === genre).length;
      return n ? `${n}\u00a0${n > 1 ? plusieurs : un}` : "";
    })
    .filter(Boolean);
  return parties.length ? parties.join(" · ") : sinon;
}

/**
 * Une rubrique du site, comme case du mur.
 * @param {NonNullable<Carte["teinte"]>} teinte
 * @param {string} titre
 * @param {string} lien
 * @param {string} ligne
 * @returns {Carte}
 */
function rubrique(teinte, titre, lien, ligne) {
  return { genre: "rubrique", id: `rubrique-${teinte}`, titre, lien, image: null, ligne, etat: "", teinte };
}

/**
 * Ce que dit la case Radio : le live en cours, sinon le prochain.
 * @param {Programme} programme
 * @returns {string}
 */
function etatRadio(programme) {
  const enCours = programme.emissions.find((e) => e.enDirect);
  if (enCours) return `En direct : ${enCours.titre}`;
  const prochain = programme.emissions
    .filter((e) => e.date >= programme.aujourdhui)
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure))[0];
  if (prochain) return `Prochain live : ${jourCourt(prochain.date)}, ${heureCourte(prochain.heure)}`;
  return "Les lives, sur YouTube";
}

/**
 * Les rubriques de chaque mur (demande du client, 26.11.2026 : pas de
 * menu, les rubriques dans le défilement). Musique et Radio à gauche,
 * Cinéma à droite ; l’Agenda et les Infos des deux côtés.
 * @param {Carte[]} musique
 * @param {Carte[]} cinema
 * @param {string} radio  Ce que dit la case Radio.
 */
function rubriques(musique, cinema, radio) {
  const agenda = rubrique("agenda", "Agenda", "agenda/", "Jour par jour");
  const infos = rubrique("infos", "Infos", "infos/", "Tarifs, adresse, contact");
  return {
    musique: [
      rubrique("musique", "Musique", "musique/", compter(musique, [["soiree", "soirée", "soirées"]], "Les soirées du club")),
      rubrique("radio", "Radio", "radio/", radio),
      agenda,
      infos,
    ],
    cinema: [
      rubrique("cinema", "Cinéma", "cinema/", compter(cinema, [["film", "film", "films"]], "À l’affiche et prochainement")),
      infos,
      agenda,
    ],
  };
}

/**
 * Lance l’accueil. Renvoie de quoi le démonter avant de changer de page.
 * @returns {() => void}
 */
export function initAccueil() {
  const racine = document.body.dataset.racine ?? "";
  const musique = document.querySelector('[data-monde="musique"]');
  const cinema = document.querySelector('[data-monde="cinema"]');
  const moitieMusique = musique instanceof HTMLElement ? musique : null;
  const moitieCinema = cinema instanceof HTMLElement ? cinema : null;

  /** @type {Array<() => void>} */
  const demontages = [];
  let actif = true;

  /** @param {Carte[]} musique @param {Carte[]} cinema @param {string} radio */
  const monter = (musique, cinema, radio) => {
    const r = rubriques(musique, cinema, radio);
    demontages.push(remplir(moitieMusique, intercaler(musique, r.musique), racine));
    demontages.push(remplir(moitieCinema, intercaler(cinema, r.cinema), racine));
  };

  chargerProgramme()
    .then((programme) => {
      if (actif) monter(cartesMusique(programme), cartesCinema(programme), etatRadio(programme));
    })
    .catch((/** @type {unknown} */ erreur) => {
      /* Sans programme, les rubriques restent : on peut toujours aller ailleurs. */
      console.warn("Minimum : programme indisponible.", erreur);
      if (actif) monter([], [], "Les lives, sur YouTube");
    });

  return () => {
    actif = false;
    for (const demonter of demontages) demonter();
  };
}
