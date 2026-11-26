// @ts-check
/* Minimum : l’accueil, deux murs (Musique et Cinéma) dont chaque colonne défile seule. */

import { cartesCinema, cartesMusique } from "./carte.js";
import { chargerProgramme } from "./donnees.js";
import { decaler, monterMur } from "./mur.js";

/** @typedef {import("./types.js").Carte} Carte */

/**
 * Remplit une moitié et renvoie de quoi la démonter.
 * @param {HTMLElement | null} moitie
 * @param {(ordinateur: boolean) => import("./mur.js").Colonne[]} colonnesDe
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
 * Sur ordinateur, chacun en tête de sa colonne ; sur téléphone, Agenda puis
 * Musique dans le mur gauche, Cinéma puis Infos dans le droit, une affiche
 * entre les deux. Jamais alignés : chaque colonne part d’une hauteur
 * différente (DECALAGES). Ils reviennent à la même place à chaque tour.
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

/** Où arrive l’onglet de chaque colonne, en fraction d’affiche sous le haut
    de l’écran : des hauteurs différentes, jamais une rangée. Tous restent
    dans l’écran à l’arrivée. */
const DECALAGES = { ordinateur: [-0.1, -0.62, -0.3, -0.85], telephone: [-0.08, -0.5] };

/**
 * Un onglet, une affiche, puis l’autre onglet et le reste des affiches.
 * @param {Carte} premier
 * @param {Carte} second
 * @param {Carte[]} affiches
 * @returns {Carte[]}
 */
function deuxOnglets(premier, second, affiches) {
  return [premier, ...affiches.slice(0, 1), second, ...affiches.slice(1)];
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
    const [d1 = 0, d2 = 0, d3 = 0, d4 = 0] = DECALAGES.ordinateur;
    const [t1 = 0, t2 = 0] = DECALAGES.telephone;
    demontages.push(
      remplir(
        moitieMusique,
        (ordinateur) =>
          ordinateur
            ? [
                { cartes: [o.agenda, ...musique], depart: d1 },
                { cartes: [o.musique, ...decaler(musique)], depart: d2 },
              ]
            : [{ cartes: deuxOnglets(o.agenda, o.musique, musique), depart: t1 }],
        racine
      )
    );
    demontages.push(
      remplir(
        moitieCinema,
        (ordinateur) =>
          ordinateur
            ? [
                { cartes: [o.cinema, ...cinema], depart: d3 },
                { cartes: [o.infos, ...decaler(cinema)], depart: d4 },
              ]
            : [{ cartes: deuxOnglets(o.cinema, o.infos, cinema), depart: t2 }],
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
