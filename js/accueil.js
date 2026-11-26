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
 * entre les deux. Jamais alignés ni de même taille (ORDINATEUR, TELEPHONE).
 * Ils reviennent à la même place à chaque tour.
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

/** Chaque colonne : où arrive son onglet (en fraction d’affiche sous le
    haut de l’écran) et sa hauteur (en largeurs de colonne). Ni rangée, ni
    zigzag, ni deux onglets de la même taille : le mur reste irrégulier
    (revu le 26.11.2026 : « pas symétrique »). Tous dans l’écran à
    l’arrivée sur ordinateur. Ordre : Agenda, Musique, Cinéma, Infos. */
const ORDINATEUR = [
  { depart: -0.45, rubrique: 0.6 },
  { depart: -0.05, rubrique: 0.95 },
  { depart: -0.75, rubrique: 0.7 },
  { depart: -0.25, rubrique: 0.85 },
];
/** Téléphone : mur gauche (Agenda, Musique), mur droit (Cinéma, Infos). */
const TELEPHONE = [
  { depart: -0.3, rubrique: 0.75 },
  { depart: -0.95, rubrique: 0.6 },
];

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
    const [c1, c2, c3, c4] = ORDINATEUR;
    const [t1, t2] = TELEPHONE;
    demontages.push(
      remplir(
        moitieMusique,
        (ordinateur) =>
          ordinateur
            ? [
                { cartes: [o.agenda, ...musique], depart: c1?.depart ?? 0, rubrique: c1?.rubrique ?? 0 },
                { cartes: [o.musique, ...decaler(musique)], depart: c2?.depart ?? 0, rubrique: c2?.rubrique ?? 0 },
              ]
            : [{ cartes: deuxOnglets(o.agenda, o.musique, musique), depart: t1?.depart ?? 0, rubrique: t1?.rubrique ?? 0 }],
        racine
      )
    );
    demontages.push(
      remplir(
        moitieCinema,
        (ordinateur) =>
          ordinateur
            ? [
                { cartes: [o.cinema, ...cinema], depart: c3?.depart ?? 0, rubrique: c3?.rubrique ?? 0 },
                { cartes: [o.infos, ...decaler(cinema)], depart: c4?.depart ?? 0, rubrique: c4?.rubrique ?? 0 },
              ]
            : [{ cartes: deuxOnglets(o.cinema, o.infos, cinema), depart: t2?.depart ?? 0, rubrique: t2?.rubrique ?? 0 }],
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
