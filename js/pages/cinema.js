// @ts-check
/* Minimum : la page Cinéma, films à l’affiche et prochaines sorties.
   Chaque film mène à sa fiche, où l’on prend son billet. */

import { chargerProgramme, filmsALAffiche, filmsAnnonces, seancesAVenir } from "../donnees.js";
import { echapper, heureCourte, jourLong, jourLongMajuscule } from "../format.js";
import { afficheHTML, afficherErreur, allerALAncre, zoneAremplir } from "./commun.js";
import { lienFilm, reperesHTML } from "./film-commun.js";

/** @typedef {import("../types.js").Programme} Programme */
/** @typedef {import("../types.js").Film} Film */

/**
 * @param {Film} film
 * @param {Programme} programme
 * @param {string} racine
 * @returns {string}
 */
function ficheHTML(film, programme, racine) {
  const seances = seancesAVenir(programme, film.id);
  const quand = seances.length
    ? `<ul class="fiche__seances">${seances
        .map((s) => `<li><a href="${echapper(lienFilm(racine, film.id, s.id))}">${echapper(jourLongMajuscule(s.date))}, ${heureCourte(s.heure)}</a></li>`)
        .join("")}</ul>`
    : film.sortie
      ? `<p class="fiche__sortie">Sortie le ${echapper(jourLong(film.sortie))}</p>`
      : "";
  const action = seances.length
    ? `<a class="pastille pastille--argent pastille--action" href="${echapper(lienFilm(racine, film.id))}#billets">Séances et billets</a>`
    : `<a class="fiche__action" href="${echapper(lienFilm(racine, film.id))}">Voir la fiche</a>`;
  return (
    `<article class="fiche" id="film-${echapper(film.id)}">${afficheHTML(film.affiche, film.titre)}` +
    `<div class="fiche__texte"><h3 class="fiche__titre"><a href="${echapper(lienFilm(racine, film.id))}">${echapper(film.titre)}</a></h3>` +
    (film.mention ? `<p class="fiche__mention">${echapper(film.mention)}</p>` : "") +
    `${reperesHTML(film)}<p class="fiche__resume">${echapper(film.resume)}</p>${quand}` +
    `<p class="fiche__actions">${action}</p></div></article>`
  );
}

/**
 * @param {string} titre
 * @param {Film[]} films
 * @param {Programme} programme
 * @param {string} racine
 * @returns {string}
 */
function sectionHTML(titre, films, programme, racine) {
  if (films.length === 0) return "";
  return (
    `<section class="page__section"><h2 class="page__sous-titre">${echapper(titre)}</h2>` +
    `<span class="tirets" aria-hidden="true"></span>${films.map((f) => ficheHTML(f, programme, racine)).join("")}</section>`
  );
}

/** Remplit la page Cinéma. */
export function initCinema() {
  const zone = zoneAremplir();
  if (!zone) return;
  const racine = document.body.dataset.racine ?? "";
  chargerProgramme()
    .then((programme) => {
      const aLAffiche = filmsALAffiche(programme);
      const annonces = filmsAnnonces(programme);
      zone.innerHTML =
        (aLAffiche.length || annonces.length
          ? sectionHTML("À l’affiche", aLAffiche, programme, racine) + sectionHTML("Prochainement", annonces, programme, racine)
          : '<p class="page__vide">Aucun film programmé pour l’instant.</p>');
      allerALAncre();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
}
