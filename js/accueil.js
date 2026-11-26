// @ts-check
/* Minimum : l’accueil, deux murs (Musique et Cinéma) dont chaque colonne défile seule. */

import { cartesCinema, cartesMusique } from "./carte.js";
import { chargerProgramme } from "./donnees.js";
import { decaler, monterMur } from "./mur.js";

/** @typedef {import("./types.js").Carte} Carte */

/**
 * Remplit une moitié et renvoie de quoi la démonter.
 * @param {HTMLElement | null} moitie
 * @param {(ordinateur: boolean) => Carte[][]} colonnesDe
 * @param {string} racine
 * @returns {() => void}
 */
function remplir(moitie, colonnesDe, racine) {
  const colonnes = moitie?.querySelector(".moitie__colonnes");
  if (!(colonnes instanceof HTMLElement)) return () => {};
  return monterMur(colonnes, colonnesDe, racine);
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
 * Les quatre onglets de l’accueil (croquis du client, 26.11.2026), de gauche
 * à droite : Agenda (jaune), Musique (rose), Cinéma (rouge), Infos (grenat).
 * Sur ordinateur, chacun est en tête de sa colonne ; sur téléphone, Agenda
 * puis Musique en tête du mur gauche, Cinéma puis Infos en tête du droit.
 * Ils reviennent à la même place à chaque tour de la colonne.
 * @param {Carte[]} musique
 * @param {Carte[]} cinema
 */
function onglets(musique, cinema) {
  return {
    agenda: rubrique("agenda", "Agenda", "agenda/", "Jour par jour"),
    musique: rubrique(
      "musique",
      "Musique",
      "musique/",
      compter(musique, [["soiree", "soirée", "soirées"], ["emission", "live", "lives"]], "Soirées et lives")
    ),
    cinema: rubrique("cinema", "Cinéma", "cinema/", compter(cinema, [["film", "film", "films"]], "À l’affiche et prochainement")),
    infos: rubrique("infos", "Infos", "infos/", "Tarifs, adresse, contact"),
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

  /** @param {Carte[]} musique @param {Carte[]} cinema */
  const monter = (musique, cinema) => {
    const o = onglets(musique, cinema);
    demontages.push(
      remplir(
        moitieMusique,
        (ordinateur) => (ordinateur ? [[o.agenda, ...musique], [o.musique, ...decaler(musique)]] : [[o.agenda, o.musique, ...musique]]),
        racine
      )
    );
    demontages.push(
      remplir(
        moitieCinema,
        (ordinateur) => (ordinateur ? [[o.cinema, ...cinema], [o.infos, ...decaler(cinema)]] : [[o.cinema, o.infos, ...cinema]]),
        racine
      )
    );
  };

  chargerProgramme()
    .then((programme) => {
      if (actif) monter(cartesMusique(programme), cartesCinema(programme));
    })
    .catch((/** @type {unknown} */ erreur) => {
      /* Sans programme, les onglets restent : on peut toujours aller ailleurs. */
      console.warn("Minimum : programme indisponible.", erreur);
      if (actif) monter([], []);
    });

  return () => {
    actif = false;
    for (const demonter of demontages) demonter();
  };
}
