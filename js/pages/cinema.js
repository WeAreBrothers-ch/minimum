// @ts-check
/* Minimum : la page Cinéma, en tableau de cases (même mécanique que la
   page Films de Zinéma, surface de Minimum).

   - Un interrupteur dans une barre : À l’affiche, Prochainement. Il ne
     s’aligne pas sur les colonnes de films, pour ne pas s’y lire comme
     une tête de colonne.
   - Chaque film est une colonne de cases : l’affiche, puis dessous une case
     avec sa prochaine séance (ou sa date de sortie), son titre et sa
     réalisation, puis une case avec ses faits. Toute la colonne mène à la
     fiche du film, où l’on prend son billet. Au survol, les cases de texte
     prennent le jaune du cinéma.
   - Une grande case « Toutes les séances » ferme le tableau : elle absorbe
     la place qui reste sur la dernière rangée, jamais de trou.
   - Les infos pratiques en lignes, dessous. */

import { chargerProgramme, filmsALAffiche, filmsAnnonces, seancesAVenir } from "../donnees.js";
import { duree, echapper, heureCourte, jourCourt } from "../format.js";
import { afficheHTML, afficherErreur, allerALAncre, zoneAremplir } from "./commun.js";
import { lienFilm } from "./film-commun.js";

/** @typedef {import("../types.js").Programme} Programme */
/** @typedef {import("../types.js").Film} Film */

/** @typedef {"affiche" | "prochainement"} Rubrique */

const INSECABLE = " ";

/**
 * @param {string} texte
 * @returns {string}
 */
function soude(texte) {
  return texte.replace(/ /g, INSECABLE);
}

/**
 * La ligne du haut de la case de titre : la prochaine séance, ou la sortie.
 * @param {Film} film
 * @param {Programme} programme
 * @returns {string}
 */
function statut(film, programme) {
  const prochaine = seancesAVenir(programme, film.id)[0];
  if (prochaine) return soude(`${jourCourt(prochaine.date)}, ${heureCourte(prochaine.heure)}`);
  if (film.sortie) return soude(`Dès le ${jourCourt(film.sortie).toLowerCase()}`);
  return "";
}

/**
 * Un film : une colonne de cases, entièrement cliquable.
 * @param {Film} film
 * @param {Programme} programme
 * @param {string} racine
 * @param {boolean} prioritaire  Une des premières affiches, visible dès l’arrivée.
 * @returns {string}
 */
function filmHTML(film, programme, racine, prioritaire) {
  const faits = [film.genre, duree(film.duree), film.version, film.age].filter(Boolean).map(soude).join(" · ");
  const ligne = statut(film, programme);
  return (
    `<a class="film" id="film-${echapper(film.id)}" href="${echapper(lienFilm(racine, film.id))}">` +
    `<span class="film__affiche">${afficheHTML(film.affiche, film.titre, { prioritaire })}</span>` +
    `<span class="film__case film__entete">` +
    (ligne ? `<span class="film__statut">${echapper(ligne)}</span>` : "") +
    `<span class="film__titre">${echapper(film.titre)}</span>` +
    `<span class="film__qui">${echapper(film.realisation)}</span></span>` +
    `<span class="film__case film__faits">${echapper(faits)}</span>` +
    `</a>`
  );
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
  /** @type {(e: MouseEvent) => void} */
  let auClic = () => {};

  chargerProgramme()
    .then((programme) => {
      /* À l’affiche : rangés par leur prochaine séance. */
      const prochaine = (/** @type {Film} */ f) => {
        const s = seancesAVenir(programme, f.id)[0];
        return s ? s.date + s.heure : "9999";
      };
      /** @type {Record<Rubrique, Film[]>} */
      const films = {
        affiche: [...filmsALAffiche(programme)].sort((a, b) => prochaine(a).localeCompare(prochaine(b))),
        prochainement: filmsAnnonces(programme),
      };
      /** @type {Array<{ id: Rubrique, nom: string }>} */
      const rubriques = [
        { id: "affiche", nom: "À l’affiche" },
        { id: "prochainement", nom: "Prochainement" },
      ];
      const presentes = rubriques.filter((r) => films[r.id].length > 0);
      if (presentes.length === 0) {
        zone.innerHTML = '<p class="page__vide">Aucun film programmé pour l’instant.</p>';
        return;
      }
      /* L’adresse peut viser un film annoncé : on ouvre alors sa rubrique. */
      const vise = decodeURIComponent(location.hash);
      /** @type {Rubrique} */
      let active =
        vise && films.prochainement.some((f) => `#film-${f.id}` === vise) ? "prochainement" : (presentes[0]?.id ?? "affiche");

      const dessiner = () => {
        const liste = films[active];
        zone.innerHTML =
          `<div class="cinema"><div class="filtres filtres--${presentes.length}" role="group" aria-label="Films">` +
          presentes
            .map(
              (r) =>
                `<button type="button" class="filtre filtre--cinema" data-rubrique="${r.id}" aria-pressed="${r.id === active}">` +
                `${echapper(r.nom)}</button>`
            )
            .join("") +
          `</div>` +
          `<div class="films">${liste.map((f, i) => filmHTML(f, programme, racine, i < 2)).join("")}` +
          `<a class="films__agenda" href="${racine}agenda/"><span>Toutes les séances</span><span class="fleche" aria-hidden="true"></span></a></div></div>` +
          PRATIQUE;
      };

      auClic = (e) => {
        const bouton = e.target instanceof Element ? e.target.closest("[data-rubrique]") : null;
        if (!(bouton instanceof HTMLElement) || !bouton.dataset.rubrique) return;
        active = /** @type {Rubrique} */ (bouton.dataset.rubrique);
        dessiner();
        const actif = zone.querySelector(`[data-rubrique="${active}"]`);
        if (actif instanceof HTMLElement) actif.focus({ preventScroll: true });
      };
      zone.addEventListener("click", auClic);
      dessiner();
      allerALAncre();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));

  return () => zone.removeEventListener("click", auClic);
}
