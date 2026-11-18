// @ts-check
/* Minimum : la fiche d’une soirée du club. L’affiche entière, les
   horaires, qui joue quand, et la caisse. Adresse : soiree/?id=…
   Même grille de cases que la fiche d’un film (film.js, detail.css). */

import { panneauHTML } from "../billetterie/panneau-html.js";
import { monterPanneau } from "../billetterie/panneau.js";
import { chargerProgramme, soireeParId } from "../donnees.js";
import { echapper, heureCourte, jourLongMajuscule } from "../format.js";
import { afficheHTML, afficherErreur, allerALAncre, nommerPage, zoneAremplir } from "./commun.js";
import { caseBilletsHTML, faitsHTML } from "./detail-cases.js";

/** @typedef {import("../types.js").Soiree} Soiree */
/** @typedef {import("../billetterie/panneau-html.js").OptionsPanneau} OptionsPanneau */

/**
 * @param {Soiree} soiree
 * @returns {string}  « Vendredi 13 novembre, 23 h – 4 h »
 */
function horaire(soiree) {
  /* Insécable autour du tiret (et un liant invisible) : « 23 h – 4 h » ne se coupe pas. */
  const fin = soiree.fin ? `\u00a0–\u2060\u00a0${heureCourte(soiree.fin)}` : "";
  return `${jourLongMajuscule(soiree.date)}, ${heureCourte(soiree.heure)}${fin}`;
}

/**
 * La case du titre : la soirée et son horaire.
 * @param {Soiree} soiree
 * @returns {string}
 */
function teteHTML(soiree) {
  const racine = document.body.dataset.racine ?? "";
  return (
    `<header class="detail__tete"><p class="detail__retour"><a href="${racine}nuit/">Toutes les soirées</a></p>` +
    `<h1 class="page__titre"><span class="masque"><span>${echapper(soiree.titre)}</span></span></h1>` +
    `<p class="detail__ligne">${echapper(horaire(soiree))}</p></header>`
  );
}

/**
 * Qui joue, à quelle heure.
 * @param {Soiree} soiree
 * @returns {string}
 */
function lineUpHTML(soiree) {
  if (soiree.lineUp.length === 0) return "";
  return (
    `<div class="detail__bloc"><h2 class="detail__sous-titre">Line-up</h2><ul class="passages">${soiree.lineUp
      .map(
        (p) =>
          `<li class="passage"><span class="passage__heure">${heureCourte(p.debut)}</span>` +
          `<span class="passage__nom">${echapper(p.nom)}</span><span class="passage__precision pastille pastille--nuit">${echapper(p.precision)}</span></li>`
      )
      .join("")}</ul></div>`
  );
}

/**
 * Titre et billets, repères, puis l’affiche, le line-up et la caisse.
 * @param {Soiree} soiree
 * @param {OptionsPanneau} options
 * @returns {string}
 */
function ficheHTML(soiree, options) {
  return (
    `<article class="detail">${teteHTML(soiree)}${caseBilletsHTML(options, "Pas de vente en ligne")}` +
    faitsHTML([
      ["Ouverture", heureCourte(soiree.heure)],
      ["Fermeture", soiree.fin ? heureCourte(soiree.fin) : null],
      ["Âge", soiree.age],
    ]) +
    `<div class="detail__affiche">${afficheHTML(soiree.affiche, soiree.titre, { detail: true })}</div>` +
    `<div class="detail__texte"><div class="detail__colle">` +
    `${soiree.description ? `<p class="detail__bloc detail__resume">${echapper(soiree.description)}</p>` : ""}` +
    `${lineUpHTML(soiree)}</div></div>` +
    `<section class="detail__billets" id="billets" aria-labelledby="titre-billets">` +
    `<h2 class="page__sous-titre" id="titre-billets">Billets</h2><span class="tirets" aria-hidden="true"></span>` +
    `${panneauHTML(options)}</section></article>`
  );
}

/**
 * @param {Soiree} soiree
 * @returns {OptionsPanneau}
 */
function optionsAchat(soiree) {
  return {
    genre: "soiree",
    choix: [{ id: soiree.id, jour: jourLongMajuscule(soiree.date), heure: heureCourte(soiree.heure), indisponible: null, mention: null }],
    choisi: soiree.id,
    tarifs: soiree.tarifs,
    notes: [],
  };
}

/** @param {HTMLElement} zone */
function introuvable(zone) {
  const racine = document.body.dataset.racine ?? "";
  nommerPage("Soirée introuvable, Minimum Neuchâtel", "Cette soirée n’est pas au programme du club Minimum.");
  zone.innerHTML =
    `<h1 class="page__titre">Soirée introuvable</h1><p class="page__intro">Cette soirée n’est pas, ou plus, au programme.</p>` +
    `<p class="page__intro"><a href="${racine}nuit/">Voir les soirées à venir</a></p>`;
}

/**
 * Remplit la fiche de la soirée demandée dans l’adresse.
 * @returns {() => void} Débranche la page.
 */
export function initSoiree() {
  const fin = new AbortController();
  const zone = zoneAremplir();
  if (!zone) return () => fin.abort();
  const id = new URLSearchParams(location.search).get("id") ?? "";
  chargerProgramme()
    .then((programme) => {
      if (fin.signal.aborted) return;
      const soiree = soireeParId(programme, id);
      if (!soiree) return introuvable(zone);
      const options = optionsAchat(soiree);
      nommerPage(`${soiree.titre}, ${horaire(soiree)} : Minimum Neuchâtel`, `${soiree.titre} au club Minimum, ${horaire(soiree)}. Line-up, horaires et billets.`);
      zone.innerHTML = ficheHTML(soiree, options);
      monterPanneau(zone, options, fin.signal);
      allerALAncre();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
  return () => fin.abort();
}
