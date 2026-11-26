// @ts-check
/* Minimum : la machine à flyers (croquis du client, 26.11.2026).

   Chaque live de la radio a son flyer, composé par le site à partir du
   portrait de l’artiste : la photo en plein, « LIVE YOUTUBE » en haut
   (« EN DIRECT » pendant le live), puis, en bas, le nom en très grand, la
   date et l’heure, comme sur le croquis (« DJ … 24.12.26 19H00 »). Il
   suffit de saisir le nom, le jour, l’heure et le portrait : rien à
   dessiner à la main. Sans portrait, le flyer est typographique, sur le
   rose de la musique.

   Les soirées du club ont le même format sur la page Musique : leur
   affiche en couleur, sans étiquette, le nom et la date en bas. Toute la
   musique se lit d’un coup d’œil, soirées et lives ensemble.

   Le même flyer sert sur le mur de l’accueil et sur la page Musique. */

import { echapper } from "./format.js";
import { sourcesImage } from "./images.js";

/** @typedef {import("./types.js").Emission} Emission */
/** @typedef {import("./types.js").Image} Image */

/**
 * « 2026-12-24 » → « 24.12.26 ».
 * @param {string} iso
 * @returns {string}
 */
export function dateFlyer(iso) {
  const [annee = "", mois = "", jour = ""] = iso.split("-");
  return `${jour}.${mois}.${annee.slice(2)}`;
}

/**
 * « 19:00 » → « 19H00 ».
 * @param {string} heure
 * @returns {string}
 */
export function heureFlyer(heure) {
  return heure.replace(":", "H");
}

/**
 * @typedef {Object} ReglagesFlyer
 * @property {string} lien        Adresse du flyer, déjà relative à la page.
 * @property {string} [attributs] Attributs en plus (aria-hidden pour les copies du mur).
 * @property {boolean} [prioritaire]  Image à charger en priorité.
 * @property {string} [tailles]   Attribut sizes de l’image.
 */

/**
 * Ce qu’un flyer montre.
 * @typedef {Object} Contenu
 * @property {Image | null} image
 * @property {boolean} noirEtBlanc   Le portrait d’un live : en noir et blanc.
 * @property {string} etiquette      En haut : « Live YouTube », « En direct », ou rien.
 * @property {boolean} direct        L’étiquette clignote (le point du direct).
 * @property {string} nom
 * @property {string} date           AAAA-MM-JJ
 * @property {string} heure          HH:MM
 * @property {string} description    Pour les lecteurs d’écran.
 */

/**
 * Un flyer, en lien.
 * @param {Contenu} contenu
 * @param {string} racine
 * @param {ReglagesFlyer} reglages
 * @returns {string}
 */
function composer(contenu, racine, reglages) {
  let image = "";
  if (contenu.image) {
    const { src, srcset, sizes } = sourcesImage(
      contenu.image,
      racine,
      [320, 480, 720],
      reglages.tailles ?? "(min-width: 56rem) 25vw, 50vw"
    );
    const variantes = srcset ? ` srcset="${echapper(srcset)}" sizes="${echapper(sizes)}"` : "";
    image =
      `<img class="flyer__portrait" src="${echapper(src)}"${variantes} width="480" height="720" alt="" decoding="async"` +
      `${reglages.prioritaire ? ' fetchpriority="high"' : ""}>`;
  }
  const classes = ["flyer"];
  if (!contenu.image) classes.push("flyer--typo");
  if (contenu.image && !contenu.noirEtBlanc) classes.push("flyer--couleur");
  const etiquette = contenu.etiquette
    ? `<span class="flyer__haut" aria-hidden="true"><span class="flyer__live${contenu.direct ? " en-direct" : ""}">` +
      `${echapper(contenu.etiquette)}</span></span>`
    : "";
  return (
    `<a class="${classes.join(" ")}" href="${echapper(reglages.lien)}"` +
    ` aria-label="${echapper(contenu.description)}"${reglages.attributs ?? ""}>` +
    image +
    etiquette +
    `<span class="flyer__bas" aria-hidden="true"><span class="flyer__nom">${echapper(contenu.nom)}</span>` +
    `<span class="flyer__quand"><span>${dateFlyer(contenu.date)}</span><span>${heureFlyer(contenu.heure)}</span></span></span></a>`
  );
}

/**
 * Le flyer d’un live, en lien.
 * @param {Emission} live
 * @param {string} racine
 * @param {ReglagesFlyer} reglages
 * @returns {string}
 */
export function flyerHTML(live, racine, reglages) {
  const quand = `${dateFlyer(live.date)}, ${heureFlyer(live.heure)}`;
  return composer(
    {
      image: live.visuel,
      noirEtBlanc: true,
      etiquette: live.enDirect ? "En direct" : "Live YouTube",
      direct: live.enDirect,
      nom: live.titre,
      date: live.date,
      heure: live.heure,
      description: `Live YouTube : ${live.titre}, ${quand}${live.enDirect ? ", en direct" : ""}`,
    },
    racine,
    reglages
  );
}

/**
 * Le flyer d’une soirée du club : son affiche en couleur, sans étiquette.
 * @param {import("./types.js").Soiree} soiree
 * @param {string} racine
 * @param {ReglagesFlyer} reglages
 * @returns {string}
 */
export function flyerSoireeHTML(soiree, racine, reglages) {
  return composer(
    {
      image: soiree.affiche,
      noirEtBlanc: false,
      etiquette: "",
      direct: false,
      nom: soiree.titre,
      date: soiree.date,
      heure: soiree.heure,
      description: `${soiree.titre}, ${dateFlyer(soiree.date)}, ${heureFlyer(soiree.heure)}`,
    },
    racine,
    reglages
  );
}
