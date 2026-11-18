// @ts-check
/* Minimum : la page Cinéma, films à l’affiche et prochaines sorties.
   Une grille d’affiches : sous chacune, le titre, les faits, et la case
   verte qui mène aux séances et aux billets. Deux onglets partagent la
   grille quand il y a des films annoncés. */

import { chargerProgramme, filmsALAffiche, filmsAnnonces, seancesAVenir } from "../donnees.js";
import { duree, echapper, heureCourte, jourCourt, jourLong } from "../format.js";
import { ajusterGrilles } from "../grille.js";
import { afficheHTML, afficherErreur, allerALAncre, zoneAremplir } from "./commun.js";
import { lienFilm } from "./film-commun.js";

/** @typedef {import("../types.js").Programme} Programme */
/** @typedef {import("../types.js").Film} Film */

/**
 * La case des faits : genre, durée, version, âge, puis la prochaine séance.
 * @param {Film} film
 * @param {string} prochaine  « Mercredi 11 novembre, 19 h », ou « ».
 * @returns {string}
 */
function faitsHTML(film, prochaine) {
  /* Chaque fait reste d’un seul tenant : « 16/16 ans » ne se coupe pas. */
  const faits = [film.genre, duree(film.duree), film.version, film.age]
    .filter(Boolean)
    .map((f) => f.replace(/ /g, "\u00a0"))
    .join("\u00a0/ ");
  return (
    `<p class="carreau__faits"><span class="carreau__infos">${echapper(faits)}</span>` +
    `${prochaine ? `<span class="carreau__quand">${echapper(prochaine)}</span>` : ""}</p>`
  );
}

/**
 * @param {Film} film
 * @param {Programme} programme
 * @param {string} racine
 * @param {boolean} prioritaire  Une des premières affiches, visible dès l’arrivée.
 * @returns {string}
 */
function carreauHTML(film, programme, racine, prioritaire) {
  const seances = seancesAVenir(programme, film.id);
  const premiere = seances[0];
  const lien = echapper(lienFilm(racine, film.id));
  const prochaine = premiere
    ? `${jourCourt(premiere.date)}, ${heureCourte(premiere.heure).replace(" ", "\u00a0")}`
    : film.sortie
      ? `Sortie le ${jourLong(film.sortie)}`
      : "";
  const action = seances.length
    ? `<a class="carreau__action carreau__action--argent" href="${echapper(lienFilm(racine, film.id))}#billets">Billets</a>`
    : `<a class="carreau__action" href="${lien}">Voir la fiche</a>`;
  return (
    `<li class="carreau" id="film-${echapper(film.id)}">` +
    `<a class="carreau__affiche" href="${lien}" tabindex="-1" aria-hidden="true">${afficheHTML(film.affiche, film.titre, { prioritaire })}</a>` +
    `<div class="carreau__texte"><h2 class="carreau__titre"><a href="${lien}">${echapper(film.titre)}</a></h2>` +
    `<p class="carreau__qui">${echapper(film.realisation)}</p>` +
    (film.mention ? `<p class="carreau__qui carreau__mention">${echapper(film.mention)}</p>` : "") +
    `</div>${faitsHTML(film, prochaine)}${action}</li>`
  );
}

/**
 * @param {string} id
 * @param {string} titre
 * @param {Film[]} films
 * @param {Programme} programme
 * @param {string} racine
 * @returns {string}
 */
function panneauHTML(id, titre, films, programme, racine) {
  return `<ul class="carreaux" id="${id}" aria-label="${echapper(titre)}">${films
    .map((f, i) => carreauHTML(f, programme, racine, id === "affiche" && i < 2))
    .join("")}</ul>`;
}

/**
 * Montre un panneau, cache les autres.
 * @param {HTMLElement} zone
 * @param {string} id
 */
function montrer(zone, id) {
  for (const panneau of zone.querySelectorAll(".carreaux")) {
    if (panneau instanceof HTMLElement) panneau.hidden = panneau.id !== id;
  }
  for (const onglet of zone.querySelectorAll(".onglet")) {
    if (onglet instanceof HTMLElement) onglet.setAttribute("aria-pressed", String(onglet.dataset.panneau === id));
  }
}

/** Les infos pratiques, sous les films : comment acheter son billet. */
const PRATIQUE =
  `<dl class="pratique">` +
  `<div class="pratique__ligne"><dt>Billets</dt><dd>En ligne, sur la fiche de chaque film. Ou à la buvette, 15 minutes avant la séance.</dd></div>` +
  `<div class="pratique__ligne"><dt>Paiement</dt><dd>Par carte en ligne. En espèces ou par TWINT à la buvette.</dd></div>` +
  `</dl>`;

/**
 * Remplit la page Cinéma. Renvoie de quoi la démonter.
 * @returns {() => void}
 */
export function initCinema() {
  const zone = zoneAremplir();
  if (!zone) return () => {};
  const racine = document.body.dataset.racine ?? "";
  /** @type {() => void} */
  let arreter = () => {};
  chargerProgramme()
    .then((programme) => {
      const aLAffiche = filmsALAffiche(programme);
      const annonces = filmsAnnonces(programme);
      if (aLAffiche.length === 0 && annonces.length === 0) {
        zone.innerHTML = '<p class="page__vide">Aucun film programmé pour l’instant.</p>';
        return;
      }
      /** @type {Array<{ id: string, titre: string, films: Film[] }>} */
      const groupes = [
        { id: "affiche", titre: "À l’affiche", films: aLAffiche },
        { id: "prochainement", titre: "Prochainement", films: annonces },
      ].filter((g) => g.films.length > 0);
      const onglets =
        groupes.length > 1
          ? `<div class="onglets" role="group" aria-label="Films">${groupes
              .map(
                (g) =>
                  `<button type="button" class="onglet onglet--cinema" id="onglet-${g.id}" data-panneau="${g.id}" aria-pressed="false">${echapper(g.titre)}</button>`
              )
              .join("")}</div>`
          : "";
      zone.innerHTML =
        onglets + groupes.map((g) => panneauHTML(g.id, g.titre, g.films, programme, racine)).join("") + PRATIQUE;
      arreter = ajusterGrilles(zone);

      /* L'adresse peut viser un film annoncé : on ouvre alors son onglet. */
      const viseAnnonce = location.hash && annonces.some((f) => `#film-${f.id}` === decodeURIComponent(location.hash));
      montrer(zone, viseAnnonce ? "prochainement" : (groupes[0]?.id ?? "affiche"));
      zone.addEventListener("click", (e) => {
        const onglet = e.target instanceof Element ? e.target.closest(".onglet") : null;
        if (onglet instanceof HTMLElement && onglet.dataset.panneau) montrer(zone, onglet.dataset.panneau);
      });
      allerALAncre();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
  return () => arreter();
}
