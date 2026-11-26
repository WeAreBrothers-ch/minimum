// @ts-check
/* Minimum : la fiche d’une soirée du club. C’est son flyer, ouvert : le
   nom en très grand sur le rose de la musique, l’affiche entière, les
   heures en rose, qui joue quand, et la caisse. Adresse : soiree/?id=…
   Des cases jointes d’un trait, comme la fiche d’un film ; leur
   disposition et leur échelle sont propres à la soirée (css/soiree.css). */

import { caisseHTML } from "../billetterie/panneau-html.js";
import { monterPanneau } from "../billetterie/panneau.js";
import { chargerProgramme, soireeParId } from "../donnees.js";
import { echapper, heureCourte, jourCourt, jourLongMajuscule } from "../format.js";
import { afficheHTML, afficherErreur, allerALAncre, nommerPage, zoneAremplir } from "./commun.js";
import { heureFlyer } from "../flyer.js";
import { caseBilletsHTML, retourHTML } from "./detail-cases.js";

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

/** Le plan : la même adresse que la page Infos. */
const PLAN = "https://www.openstreetmap.org/search?query=Quai%20Philippe-Godet%2020%2C%202000%20Neuch%C3%A2tel";

/**
 * La case du titre, sur le rose de la musique : le nom en très grand, et
 * le jour dessous, comme un flyer typographique (js/flyer.js).
 * @param {Soiree} soiree
 * @returns {string}
 */
function teteHTML(soiree) {
  return (
    `<header class="detail__tete">` +
    `<h1 class="page__titre"><span class="masque"><span>${echapper(soiree.titre)}</span></span></h1>` +
    `<p class="soiree__jour">${echapper(jourLongMajuscule(soiree.date))}</p></header>`
  );
}

/**
 * Les repères, en très grand et en rose, comme la date d’un flyer :
 * l’ouverture, la fermeture, l’âge. Puis l’adresse, qui ouvre le plan.
 * @param {Soiree} soiree
 * @returns {string}
 */
function reperesHTML(soiree) {
  /** @type {Array<[string, string | null]>} */
  const lignes = [
    ["Ouverture", heureFlyer(soiree.heure)],
    ["Fermeture", soiree.fin ? heureFlyer(soiree.fin) : null],
    ["Âge", soiree.age],
  ];
  const cases = lignes
    .filter(([, valeur]) => valeur)
    .map(([terme, valeur]) => `<div class="soiree__repere"><dt>${echapper(terme)}</dt><dd>${echapper(valeur ?? "")}</dd></div>`)
    .join("");
  return (
    `<div class="soiree__reperes"><dl class="soiree__faits">${cases}</dl>` +
    `<a class="soiree__lieu" href="${PLAN}" rel="noopener"><span class="soiree__lieu-terme">Adresse</span>` +
    `<span class="soiree__lieu-valeur">Quai Philippe&#8209;Godet&nbsp;20, 2000&nbsp;Neuchâtel</span>` +
    `<span class="fleche fleche--sortie" aria-hidden="true"></span></a></div>`
  );
}

/**
 * Qui joue, à quelle heure : une grande ligne par passage, l’heure en rose.
 * @param {Soiree} soiree
 * @returns {string}
 */
function lineUpHTML(soiree) {
  if (soiree.lineUp.length === 0) return "";
  return (
    `<h2 class="soiree__titre-suite">Line-up</h2><ul class="soiree__passages">${soiree.lineUp
      .map(
        (p) =>
          `<li class="soiree__passage"><span class="soiree__heure">${heureFlyer(p.debut)}</span>` +
          `<span class="soiree__nom">${echapper(p.nom)}</span>` +
          (p.precision ? `<span class="pastille pastille--musique">${echapper(p.precision)}</span>` : "") +
          `</li>`
      )
      .join("")}</ul>`
  );
}

/**
 * Le retour, le titre (rose) et la case Billets (verte) ; l’affiche en
 * grand ; les repères ; puis le texte et le line-up. La caisse s’ouvre en
 * fenêtre. La grille est dans css/soiree.css : elle se range selon que
 * l’affiche est en hauteur ou en largeur.
 * @param {Soiree} soiree
 * @param {OptionsPanneau} options
 * @returns {string}
 */
function ficheHTML(soiree, options) {
  const racine = document.body.dataset.racine ?? "";
  const suite = `${soiree.description ? `<p class="soiree__texte">${echapper(soiree.description)}</p>` : ""}${lineUpHTML(soiree)}`;
  const { affiche } = soiree;
  /* Sans dimensions connues, on la range comme une affiche, en hauteur. */
  const enLargeur = (affiche?.largeur ?? 0) > 0 && (affiche?.largeur ?? 0) >= (affiche?.hauteur ?? Infinity);
  return (
    `<article class="detail detail--soiree${enLargeur ? " detail--paysage" : ""}">` +
    `${retourHTML(`${racine}musique/`, "Toutes les soirées")}` +
    `${teteHTML(soiree)}${caseBilletsHTML(options, "Pas de vente en ligne")}` +
    `<div class="detail__affiche">${afficheHTML(affiche, soiree.titre, { detail: true, tailles: "(min-width: 56rem) 50vw, 100vw" })}</div>` +
    reperesHTML(soiree) +
    (suite ? `<section class="soiree__suite">${suite}</section>` : "") +
    `</article>${caisseHTML(options)}`
  );
}

/**
 * Le titre remplit sa case (css/soiree.css) ; si un mot est plus long
 * qu’elle (« ANNIVERSAIRE »), il rétrécit juste assez pour tenir, au lieu
 * d’être coupé au milieu. Refait quand la case change de largeur.
 * @param {HTMLElement} zone
 * @param {AbortSignal} signal
 */
function ajusterTitre(zone, signal) {
  const titre = zone.querySelector(".detail--soiree .page__titre");
  const tete = titre?.parentElement;
  if (!(titre instanceof HTMLElement) || !tete) return;
  let largeur = -1;
  const regler = () => {
    titre.style.fontSize = "";
    const place = titre.clientWidth;
    const besoin = titre.scrollWidth;
    if (place > 0 && besoin > place) {
      const taille = Number.parseFloat(getComputedStyle(titre).fontSize);
      titre.style.fontSize = `${Math.floor((taille * place) / besoin)}px`;
    }
  };
  regler();
  document.fonts?.ready.then(() => !signal.aborted && regler());
  if (!("ResizeObserver" in window)) return;
  const observateur = new ResizeObserver(() => {
    if (tete.clientWidth === largeur) return;
    largeur = tete.clientWidth;
    regler();
  });
  observateur.observe(tete);
  signal.addEventListener("abort", () => observateur.disconnect());
}

/**
 * @param {Soiree} soiree
 * @returns {OptionsPanneau}
 */
function optionsAchat(soiree) {
  return {
    genre: "soiree",
    titre: soiree.titre,
    choix: [
      {
        id: soiree.id,
        jour: jourLongMajuscule(soiree.date),
        court: jourCourt(soiree.date),
        heure: heureCourte(soiree.heure),
        indisponible: null,
        mention: null,
      },
    ],
    choisi: soiree.id,
    tarifs: soiree.tarifs,
  };
}

/** @param {HTMLElement} zone */
function introuvable(zone) {
  const racine = document.body.dataset.racine ?? "";
  nommerPage("Soirée introuvable, Minimum Neuchâtel", "Cette soirée n’est pas au programme du club Minimum.");
  zone.innerHTML =
    `<h1 class="page__titre">Soirée introuvable</h1><p class="page__intro">Cette soirée n’est pas, ou plus, au programme.</p>` +
    `<p class="page__intro"><a href="${racine}musique/">Voir les soirées à venir</a></p>`;
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
      ajusterTitre(zone, fin.signal);
      monterPanneau(zone, options, fin.signal);
      allerALAncre();
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
  return () => fin.abort();
}
