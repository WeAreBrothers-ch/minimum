// @ts-check
/* Minimum : les soirées et émissions d’exemple, en attendant les vraies.
   Les affiches sont des images choisies par Eliott (16.11.2026) pour montrer
   le mur Nuit : elles ne viennent pas de Minimum et doivent être remplacées
   avant toute mise en ligne (droits d’auteur). Les noms d’artistes restent
   « à annoncer » : on n’attribue pas une date à de vraies personnes. */

/** @typedef {import("../types.js").Soiree} Soiree */
/** @typedef {import("../types.js").Emission} Emission */
/** @typedef {import("../types.js").Passage} Passage */

/** [date, largeur, hauteur, description de l’image] */
/** @type {Array<[string, number, number, string]>} */
const AFFICHES = [
  ["2026-11-13", 960, 1200, "une femme à lunettes accroupie au-dessus des gratte-ciel d’une ville, un baladeur à la main"],
  ["2026-11-14", 1200, 1115, "un guitariste sous des néons verts et violets, un autocollant « Kill your data » sur sa guitare"],
  ["2026-11-20", 900, 1200, "portrait d’un homme à lunettes éclairé en vert dans la pénombre"],
  ["2026-11-21", 1200, 633, "une silhouette debout au milieu d’un amas de pneus, en noir et blanc"],
  ["2026-11-27", 1200, 1095, "un coquillage posé sur un ciel rempli de galaxies"],
  ["2026-11-28", 640, 360, "un DJ en sweat blanc aux platines, dans un studio couvert d’autocollants"],
  ["2026-12-04", 640, 360, "deux personnes discutent derrière des platines, dans un studio couvert d’autocollants"],
];

/**
 * Deux ou trois passages, selon la soirée.
 * @param {number} rang
 * @returns {Passage[]}
 */
function lineUp(rang) {
  const debuts = rang % 2 === 0 ? ["23:00", "01:00", "03:00"] : ["23:00", "01:30"];
  return debuts.map((debut) => ({ debut, nom: "Artiste à annoncer", precision: "DJ set" }));
}

/** @type {Soiree[]} */
export const SOIREES_DEMO = AFFICHES.map(([date, largeur, hauteur, description], i) => ({
  id: `soiree-${date}`,
  titre: "Soirée club",
  date,
  heure: "23:00",
  fin: "04:00",
  description: null,
  lineUp: lineUp(i),
  age: "Dès 18 ans",
  tarifs: [{ cle: "prevente", libelle: "Prévente", detail: null, prix: 15 }],
  affiche: {
    url: `assets/img/exemples/soiree-exemple-${i + 1}.webp`,
    alt: `Affiche de la soirée : ${description}`,
    largeur,
    hauteur,
  },
}));

/** Un portrait d’exemple pour les flyers des lives (à remplacer, comme les
    affiches de soirée).
    @param {number} n  Le numéro de l’image d’exemple.
    @param {number} largeur
    @param {number} hauteur
    @param {string} description
    @returns {import("../types.js").Image} */
function portrait(n, largeur, hauteur, description) {
  return { url: `assets/img/exemples/soiree-exemple-${n}.webp`, alt: `Portrait : ${description}`, largeur, hauteur };
}

/** Des lives d’essai : un en cours, deux à venir, deux passés. Le titre
    d’un live est le nom de l’artiste ; son visuel, le portrait dont le
    site tire le flyer (« machine à flyers », croquis du client, 26.11.2026).
    Pas encore de vidéo : la page Radio le dit. @type {Emission[]} */
export const EMISSIONS_DEMO = [
  { id: "live-2026-11-11", titre: "DJ à annoncer", date: "2026-11-11", heure: "18:00", enDirect: true, video: null, visuel: portrait(6, 640, 360, "un DJ en sweat blanc aux platines") },
  { id: "live-2026-11-19", titre: "DJ à annoncer", date: "2026-11-19", heure: "20:00", enDirect: false, video: null, visuel: portrait(3, 900, 1200, "un homme à lunettes éclairé en vert") },
  { id: "live-2026-12-24", titre: "DJ à annoncer", date: "2026-12-24", heure: "19:00", enDirect: false, video: null, visuel: portrait(7, 640, 360, "deux personnes derrière des platines") },
  { id: "live-2026-11-07", titre: "DJ à annoncer", date: "2026-11-07", heure: "20:00", enDirect: false, video: null, visuel: null },
  { id: "live-2026-11-04", titre: "DJ à annoncer", date: "2026-11-04", heure: "20:00", enDirect: false, video: null, visuel: null },
];
