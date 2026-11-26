// @ts-check
/* Minimum : l’agenda, tout ce qui se passe à Minimum (simplifié le
   26.11.2026 : « le client aime les choses simples »).

   Une semaine à la fois (une semaine chargée ferait sinon une page sans
   fin) : « Cette semaine », puis les flèches pour la suivante et la
   précédente ; les semaines vides sont sautées. Dans la semaine, une liste
   jour par jour : le jour en titre, puis une ligne par rendez-vous (l’heure,
   le titre, un petit carré de la couleur de son monde). Toute la ligne mène
   à la fiche. Sur téléphone, un jour à la fois : les sept jours de la
   semaine en cases, le jour choisi dessous, et le jour suivant en bas ;
   sur ordinateur, toute la semaine. Au-dessus, trois filtres : Tout, Cinéma, Musique (les lives de la
   radio font partie de la musique). */

import { chargerProgramme, filmParId } from "../donnees.js";
import { decalerDate, echapper, heureCourte, jourCourt, jourLongMajuscule, lireDate } from "../format.js";
import { afficherErreur, zoneAremplir } from "./commun.js";
import { lienFilm } from "./film-commun.js";

/** @typedef {import("../types.js").Programme} Programme */

/** @typedef {"cinema" | "musique"} Monde */
/** @typedef {"tout" | Monde} Filtre */

/**
 * @typedef {Object} Rendez
 * @property {string} date
 * @property {string} heure
 * @property {string} titre
 * @property {string} sous     Une ligne de plus : réalisation, horaires, live.
 * @property {string} lien
 * @property {Monde} monde
 */

/** @type {Record<Monde, string>} */
const NOMS = { cinema: "Cinéma", musique: "Musique" };

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
      monde: "musique",
    });
  }
  for (const e of programme.emissions) {
    liste.push({
      date: e.date,
      heure: e.heure,
      titre: e.titre,
      sous: e.enDirect ? "En direct sur YouTube" : "Live sur YouTube",
      lien: `musique/#${e.id}`,
      monde: "musique",
    });
  }
  return liste
    .filter((r) => r.date >= programme.aujourdhui)
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
}

/**
 * Une ligne : l’heure, le titre et sa ligne, le carré du monde.
 * @param {Rendez} r
 * @param {string} racine
 * @returns {string}
 */
function ligneHTML(r, racine) {
  return (
    `<li><a class="rdv rdv--${r.monde}" href="${echapper(racine + r.lien)}">` +
    `<span class="rdv__heure">${heureCourte(r.heure).replace(" ", "\u00a0")}</span>` +
    `<span class="rdv__texte"><span class="rdv__titre">${echapper(r.titre)}</span>` +
    `<span class="rdv__sous">${echapper(r.sous)}</span></span>` +
    `<span class="rdv__monde" title="${NOMS[r.monde]}"><span class="visuellement-cache">${NOMS[r.monde]}</span></span>` +
    `<span class="fleche" aria-hidden="true"></span></a></li>`
  );
}

/**
 * @param {Filtre} filtre
 * @returns {string}
 */
function filtresHTML(filtre) {
  /** @type {Filtre[]} */
  const filtres = ["tout", "cinema", "musique"];
  return (
    `<div class="filtres filtres--3" role="group" aria-label="Afficher">` +
    filtres
      .map(
        (f) =>
          `<button type="button" class="filtre filtre--${f}" data-filtre="${f}" aria-pressed="${f === filtre}">` +
          `${f === "tout" ? "Tout" : NOMS[f]}</button>`
      )
      .join("") +
    `</div>`
  );
}

/**
 * Le rang de la semaine d’une date : 0 pour les sept jours à partir
 * d’aujourd’hui, 1 pour les sept suivants…
 * @param {string} date
 * @param {string} aujourdhui
 */
function semaineDe(date, aujourdhui) {
  const jours = Math.round((lireDate(date).getTime() - lireDate(aujourdhui).getTime()) / 86_400_000);
  return Math.floor(jours / 7);
}

/**
 * « 11 nov. » : le jour et le mois, sans le nom du jour.
 * @param {string} date
 */
function jourMois(date) {
  return jourCourt(date).replace(/^\S+\u00a0/, "");
}

/**
 * La semaine affichée, et de quoi passer à la précédente et à la suivante.
 * @param {number} rang
 * @param {number | undefined} avant
 * @param {number | undefined} apres
 * @param {string} aujourdhui
 * @returns {string}
 */
function semaineHTML(rang, avant, apres, aujourdhui) {
  const debut = decalerDate(aujourdhui, rang * 7);
  const fin = decalerDate(debut, 6);
  const nom = rang === 0 ? "Cette semaine" : rang === 1 ? "Semaine prochaine" : `Dans ${rang} semaines`;
  /** @param {number | undefined} cible @param {string} sens @param {string} etiquette */
  const bouton = (cible, sens, etiquette) =>
    `<button type="button" class="semaine__pas" data-semaine="${cible ?? ""}" aria-label="${etiquette}"${cible === undefined ? " disabled" : ""}>` +
    `<span class="fleche${sens === "avant" ? " fleche--retour" : ""}" aria-hidden="true"></span></button>`;
  return (
    `<div class="semaine">` +
    bouton(avant, "avant", "Semaine précédente") +
    `<p class="semaine__nom" aria-live="polite"><b>${nom}</b><span>${echapper(`${jourMois(debut)} – ${jourMois(fin)}`)}</span></p>` +
    bouton(apres, "apres", "Semaine suivante") +
    `</div>`
  );
}

const ABREGES = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];

/**
 * Téléphone : les sept jours de la semaine en cases. Un jour sans
 * rendez-vous reste visible, en gris, sans qu’on puisse le choisir.
 * @param {number} rang
 * @param {string} jour        Le jour choisi.
 * @param {string[]} pleins    Les jours qui ont des rendez-vous.
 * @param {string} aujourdhui
 * @returns {string}
 */
function joursHTML(rang, jour, pleins, aujourdhui) {
  const debut = decalerDate(aujourdhui, rang * 7);
  const cases = Array.from({ length: 7 }, (_, i) => {
    const j = decalerDate(debut, i);
    const d = lireDate(j);
    const plein = pleins.includes(j);
    return (
      `<button type="button" class="jour" data-jour="${j}" aria-pressed="${j === jour}"` +
      ` aria-label="${echapper(jourLongMajuscule(j))}${plein ? "" : ", rien"}"${plein ? "" : " disabled"}>` +
      `<span class="jour__nom">${j === aujourdhui ? "Auj." : ABREGES[d.getDay()]}</span>` +
      `<b class="jour__num">${d.getDate()}</b></button>`
    );
  });
  return `<div class="jours" role="group" aria-label="Jour">${cases.join("")}</div>`;
}

/**
 * Téléphone : en bas du jour, le jour suivant de la semaine.
 * @param {string | undefined} suivant
 * @param {string} aujourdhui
 * @returns {string}
 */
function suivantHTML(suivant, aujourdhui) {
  if (!suivant) return "";
  const nom = suivant === aujourdhui ? "Aujourd’hui" : jourLongMajuscule(suivant);
  return (
    `<button type="button" class="jour-suivant" data-jour="${suivant}">${echapper(nom)}` +
    ` <span class="fleche" aria-hidden="true"></span></button>`
  );
}

/**
 * Un jour : son nom en titre, puis ses rendez-vous.
 * @param {string} jour
 * @param {Rendez[]} liste
 * @param {string} aujourdhui
 * @param {string} racine
 * @param {boolean} choisi  Le jour montré sur téléphone.
 * @returns {string}
 */
function jourHTML(jour, liste, aujourdhui, racine, choisi) {
  const [nom = "", ...date] = jourLongMajuscule(jour).split(" ");
  const auj = jour === aujourdhui;
  return (
    `<section class="journee${auj ? " journee--auj" : ""}${choisi ? " journee--choisie" : ""}" aria-label="${echapper(jourLongMajuscule(jour))}">` +
    `<h2 class="journee__tete"><span class="journee__nom">${auj ? "Aujourd’hui" : echapper(nom)}</span>` +
    `<span class="journee__date">${echapper(date.join("\u00a0"))}</span></h2>` +
    `<ul class="rdvs">${liste.map((r) => ligneHTML(r, racine)).join("")}</ul></section>`
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
      /** @type {Filtre} */
      let filtre = "tout";
      let semaine = 0;
      let jour = "";

      const dessiner = () => {
        const liste = filtre === "tout" ? tous : tous.filter((r) => r.monde === filtre);
        /* Les semaines qui ont quelque chose ; on reste sur la sienne si elle en a. */
        const semaines = [...new Set(liste.map((r) => semaineDe(r.date, aujourdhui)))].sort((a, b) => a - b);
        if (!semaines.includes(semaine)) semaine = semaines.find((n) => n > semaine) ?? semaines.at(-1) ?? 0;
        const rang = semaines.indexOf(semaine);
        const cette = liste.filter((r) => semaineDe(r.date, aujourdhui) === semaine);
        const jours = [...new Set(cette.map((r) => r.date))];
        if (!jours.includes(jour)) jour = jours[0] ?? "";
        zone.innerHTML =
          `<div class="agenda" data-filtre="${filtre}">` +
          filtresHTML(filtre) +
          semaineHTML(semaine, semaines[rang - 1], semaines[rang + 1], aujourdhui) +
          joursHTML(semaine, jour, jours, aujourdhui) +
          jours.map((j) => jourHTML(j, cette.filter((r) => r.date === j), aujourdhui, racine, j === jour)).join("") +
          suivantHTML(jours[jours.indexOf(jour) + 1], aujourdhui) +
          `</div>`;
      };

      auClic = (e) => {
        const cible = e.target instanceof Element ? e.target : null;
        const bouton = cible?.closest("[data-filtre], [data-semaine], [data-jour]");
        if (!(bouton instanceof HTMLElement)) return;
        let selecteur = "";
        if (bouton.dataset.filtre) {
          filtre = /** @type {Filtre} */ (bouton.dataset.filtre);
          selecteur = `.filtre[data-filtre="${filtre}"]`;
        } else if (bouton.dataset.semaine) {
          semaine = Number(bouton.dataset.semaine);
          selecteur = bouton.classList.contains("semaine__pas") ? `.semaine__pas[aria-label="${bouton.getAttribute("aria-label")}"]` : "";
        } else if (bouton.dataset.jour) {
          jour = bouton.dataset.jour;
          selecteur = `.jour[data-jour="${jour}"]`;
        } else return;
        dessiner();
        const actif = selecteur ? zone.querySelector(selecteur) : null;
        /* Le bouton n’existe plus (première ou dernière semaine) : on garde la
           main sur l’autre flèche. */
        const repli = zone.querySelector(".semaine__pas:not([disabled])");
        if (actif instanceof HTMLButtonElement && !actif.disabled) actif.focus({ preventScroll: true });
        else if (repli instanceof HTMLElement && bouton.dataset.semaine) repli.focus({ preventScroll: true });
        /* Semaine ou jour suivant : on remonte voir le début de la liste. */
        if (bouton.dataset.semaine || bouton.classList.contains("jour-suivant")) {
          zone.querySelector(".semaine")?.scrollIntoView({ block: "nearest" });
        }
      };
      zone.addEventListener("click", auClic);
      dessiner();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));

  return () => zone.removeEventListener("click", auClic);
}
