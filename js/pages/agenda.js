// @ts-check
/* Minimum : l’agenda, tout ce qui se passe à Minimum.

   - Des filtres par monde : Tout, Cinéma, Nuit, Radio, chacun de sa couleur.
   - Téléphone : un jour à la fois. Les sept jours en cases, avec un repère
     de couleur par monde ce jour-là ; dessous, les rendez-vous du jour, et
     de quoi passer au jour suivant.
   - Grand écran : la semaine en tableau, sept colonnes, chaque rendez-vous
     dans une case de la couleur de son monde.
   - Plus tard : ce qui est annoncé au-delà de la semaine. */

import { chargerProgramme, filmParId } from "../donnees.js";
import { decalerDate, echapper, heureCourte, jourCourt, jourLongMajuscule, lireDate } from "../format.js";
import { afficherErreur, zoneAremplir } from "./commun.js";
import { lienFilm } from "./film-commun.js";

/** @typedef {import("../types.js").Programme} Programme */

/** @typedef {"cinema" | "nuit" | "radio"} Monde */
/** @typedef {"tout" | Monde} Filtre */

/**
 * @typedef {Object} Rendez
 * @property {string} date
 * @property {string} heure
 * @property {string} titre
 * @property {string} sous     Une ligne de plus : réalisation, horaires, état.
 * @property {string} lien
 * @property {Monde} monde
 * @property {string} action   « Billets », « Écouter »…
 */

/** @type {Record<Monde, string>} */
const NOMS = { cinema: "Cinéma", nuit: "Nuit", radio: "Radio" };

const SEMAINE = 7;
const ABREGES = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];

/**
 * Tous les rendez-vous à partir d’aujourd’hui, dans l’ordre.
 * @param {Programme} programme
 * @returns {Rendez[]}
 */
function rendezVous(programme) {
  /** @type {Rendez[]} */
  const liste = [];
  for (const s of programme.seances) {
    const film = filmParId(programme, s.filmId);
    if (!film) continue;
    const etat = s.etat === "complet" ? "Complet" : s.etat === "annule" ? "Annulée" : "";
    liste.push({
      date: s.date,
      heure: s.heure,
      titre: film.titre,
      sous: etat || `${film.realisation}, ${film.version}`,
      lien: lienFilm("", film.id, s.id),
      monde: "cinema",
      action: etat ? "La fiche" : "Billets",
    });
  }
  for (const s of programme.soirees) {
    const fin = s.fin ? ` – ${heureCourte(s.fin)}` : "";
    liste.push({
      date: s.date,
      heure: s.heure,
      titre: s.titre,
      sous: `${heureCourte(s.heure)}${fin}${s.lineUp.length ? `, ${s.lineUp.length} passages` : ""}`,
      lien: `soiree/?id=${encodeURIComponent(s.id)}`,
      monde: "nuit",
      action: s.tarifs.length ? "Billets" : "Line-up",
    });
  }
  for (const e of programme.emissions) {
    liste.push({
      date: e.date,
      heure: e.heure,
      titre: e.titre,
      sous: e.enDirect ? "En direct sur Minimum radio" : "À réécouter",
      lien: `radio/#${e.id}`,
      monde: "radio",
      action: "Écouter",
    });
  }
  return liste
    .filter((r) => r.date >= programme.aujourdhui)
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
}

/**
 * Une ligne : l’heure dans la couleur du monde, le titre, l’action.
 * @param {Rendez} r
 * @param {string} racine
 * @param {boolean} avecDate  Plus tard : la date au-dessus de l’heure.
 * @returns {string}
 */
function ligneHTML(r, racine, avecDate) {
  const heure = heureCourte(r.heure).replace(" ", " ");
  return (
    `<li><a class="rdv rdv--${r.monde}" href="${echapper(racine + r.lien)}">` +
    `<span class="rdv__heure">${avecDate ? `<span class="rdv__date">${echapper(jourCourt(r.date).replace(/\u00a0/g, " "))}</span>` : ""}${heure}</span>` +
    `<span class="rdv__texte"><span class="rdv__monde">${NOMS[r.monde]}</span>` +
    `<span class="rdv__titre">${echapper(r.titre)}</span><span class="rdv__sous">${echapper(r.sous)}</span></span>` +
    `<span class="rdv__action">${echapper(r.action)}</span></a></li>`
  );
}

/**
 * @param {Filtre} filtre
 * @param {Rendez[]} liste
 * @returns {string}
 */
function filtresHTML(filtre, liste) {
  /** @type {Filtre[]} */
  const filtres = ["tout", "cinema", "nuit", "radio"];
  return (
    `<div class="filtres filtres--4" role="group" aria-label="Afficher">` +
    filtres
      .map((f) => {
        const n = f === "tout" ? liste.length : liste.filter((r) => r.monde === f).length;
        return (
          `<button type="button" class="filtre filtre--${f}" data-filtre="${f}" aria-pressed="${f === filtre}">` +
          `${f === "tout" ? "Tout" : NOMS[f]}<span class="filtre__n">${n}</span></button>`
        );
      })
      .join("") +
    `</div>`
  );
}

/**
 * Téléphone : les sept jours en cases, avec un repère par monde.
 * @param {string[]} jours
 * @param {string} jour
 * @param {Rendez[]} liste
 * @param {string} aujourdhui
 * @returns {string}
 */
function joursHTML(jours, jour, liste, aujourdhui) {
  return (
    `<div class="jours" role="group" aria-label="Jour">` +
    jours
      .map((j) => {
        const d = lireDate(j);
        const mondes = [...new Set(liste.filter((r) => r.date === j).map((r) => r.monde))];
        const reperes = mondes.map((m) => `<i class="repere repere--${m}"></i>`).join("");
        const nom = j === aujourdhui ? "Auj." : ABREGES[d.getDay()];
        return (
          `<button type="button" class="jour" data-jour="${j}" aria-pressed="${j === jour}" ` +
          `aria-label="${echapper(`${jourLongMajuscule(j)}, ${mondes.length ? `${liste.filter((r) => r.date === j).length} rendez-vous` : "rien"}`)}">` +
          `<span class="jour__nom">${nom}</span><b class="jour__num">${d.getDate()}</b>` +
          `<span class="jour__reperes" aria-hidden="true">${reperes}</span></button>`
        );
      })
      .join("") +
    `</div>`
  );
}

/**
 * Téléphone : les rendez-vous du jour choisi, et le jour d’avant et d’après.
 * @param {string[]} jours
 * @param {string} jour
 * @param {Rendez[]} liste
 * @param {string} aujourdhui
 * @param {string} racine
 * @returns {string}
 */
function jourHTML(jours, jour, liste, aujourdhui, racine) {
  const duJour = liste.filter((r) => r.date === jour);
  const rang = jours.indexOf(jour);
  const avant = jours[rang - 1];
  const apres = jours[rang + 1];
  const nom = (/** @type {string} */ j) => (j === aujourdhui ? "Aujourd’hui" : jourCourt(j));
  return (
    `<section class="jour-vue" aria-labelledby="jour-titre">` +
    `<h2 class="jour-titre" id="jour-titre"><span>${echapper(jour === aujourdhui ? "Aujourd’hui" : jourLongMajuscule(jour))}</span>` +
    `<span class="jour-titre__n">${duJour.length ? `${duJour.length} rendez-vous` : "Relâche"}</span></h2>` +
    (duJour.length
      ? `<ul class="rdvs">${duJour.map((r) => ligneHTML(r, racine, false)).join("")}</ul>`
      : `<p class="agenda__vide">Rien ce jour-là. Le jour suivant, peut-être ?</p>`) +
    `<div class="jour-nav">` +
    (avant ? `<button type="button" class="jour-nav__pas" data-jour="${avant}">← ${echapper(nom(avant))}</button>` : "") +
    (apres ? `<button type="button" class="jour-nav__pas jour-nav__pas--apres" data-jour="${apres}">${echapper(nom(apres))} →</button>` : "") +
    `</div></section>`
  );
}

/**
 * Grand écran : la semaine en tableau.
 * @param {string[]} jours
 * @param {Rendez[]} liste
 * @param {string} aujourdhui
 * @param {string} racine
 * @returns {string}
 */
function semaineHTML(jours, liste, aujourdhui, racine) {
  return (
    `<div class="semaine">` +
    jours
      .map((j) => {
        const d = lireDate(j);
        const duJour = liste.filter((r) => r.date === j);
        const blocs = duJour
          .map(
            (r) =>
              `<li><a class="bloc-rdv bloc-rdv--${r.monde}" href="${echapper(racine + r.lien)}">` +
              `<span class="bloc-rdv__haut"><b>${heureCourte(r.heure).replace(" ", " ")}</b><span>${NOMS[r.monde]}</span></span>` +
              `<span class="bloc-rdv__titre">${echapper(r.titre)}</span>` +
              `<span class="bloc-rdv__sous">${echapper(r.sous)}</span></a></li>`
          )
          .join("");
        return (
          `<section class="semaine__jour${j === aujourdhui ? " semaine__jour--auj" : ""}" aria-label="${echapper(jourLongMajuscule(j))}">` +
          `<h2 class="semaine__tete"><span>${j === aujourdhui ? "Aujourd’hui" : ABREGES[d.getDay()]}</span><b>${d.getDate()}</b></h2>` +
          (blocs ? `<ul class="semaine__liste">${blocs}</ul>` : `<p class="semaine__vide">Relâche</p>`) +
          `</section>`
        );
      })
      .join("") +
    `</div>`
  );
}

/**
 * Remplit la page Agenda.
 * @returns {() => void}
 */
export function initAgenda() {
  const zone = zoneAremplir();
  if (!zone) return () => {};
  const racine = document.body.dataset.racine ?? "";
  /** @type {(e: MouseEvent) => void} */
  let auClic = () => {};

  chargerProgramme()
    .then((programme) => {
      const tous = rendezVous(programme);
      if (tous.length === 0) {
        zone.innerHTML = '<p class="page__vide">Rien d’annoncé pour l’instant.</p>';
        return;
      }
      const aujourdhui = programme.aujourdhui;
      const jours = Array.from({ length: SEMAINE }, (_, i) => decalerDate(aujourdhui, i));
      /** @type {Filtre} */
      let filtre = "tout";
      let jour = jours.find((j) => tous.some((r) => r.date === j)) ?? aujourdhui;

      const dessiner = () => {
        const liste = filtre === "tout" ? tous : tous.filter((r) => r.monde === filtre);
        const semaine = liste.filter((r) => jours.includes(r.date));
        const plusTard = liste.filter((r) => !jours.includes(r.date));
        zone.innerHTML =
          `<div class="agenda" data-filtre="${filtre}">` +
          filtresHTML(filtre, tous) +
          joursHTML(jours, jour, semaine, aujourdhui) +
          jourHTML(jours, jour, semaine, aujourdhui, racine) +
          semaineHTML(jours, semaine, aujourdhui, racine) +
          (plusTard.length
            ? `<section class="plus-tard" aria-labelledby="plus-tard"><h2 class="rubrique" id="plus-tard"><span>Plus tard</span>` +
              `<span class="rubrique__nombre">${plusTard.length} rendez-vous</span></h2>` +
              `<ul class="rdvs">${plusTard.map((r) => ligneHTML(r, racine, true)).join("")}</ul></section>`
            : "") +
          `</div>`;
      };

      auClic = (e) => {
        const cible = e.target instanceof Element ? e.target : null;
        const bouton = cible?.closest("[data-filtre], [data-jour]");
        if (!(bouton instanceof HTMLElement)) return;
        let selecteur = "";
        if (bouton.dataset.filtre) {
          filtre = /** @type {Filtre} */ (bouton.dataset.filtre);
          selecteur = `.filtre[data-filtre="${filtre}"]`;
        } else if (bouton.dataset.jour) {
          jour = bouton.dataset.jour;
          selecteur = `.jour[data-jour="${jour}"]`;
        }
        dessiner();
        const actif = zone.querySelector(selecteur);
        if (actif instanceof HTMLElement) actif.focus({ preventScroll: true });
      };
      zone.addEventListener("click", auClic);
      dessiner();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));

  return () => zone.removeEventListener("click", auClic);
}
