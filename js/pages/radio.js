// @ts-check
/* Minimum : la page Radio. Un bureau d'ordinateur des années 90, dans le
   style de soso radio : un fond d'écran que l'on change, des icônes, des
   fenêtres que l'on ouvre, déplace et réduit, un lecteur avec sa playlist,
   une barre des tâches avec « Start » et l'horloge.

   Le lecteur de la fenêtre pilote la barre du bas du site (lecteur.js), qui
   ne s'arrête pas quand on change de page. Sur cette page, la barre du bas
   est cachée : la barre des tâches du bureau la remplace. */

import { chargerProgramme } from "../donnees.js";
import { echapper } from "../format.js";
import { trouver } from "../bureau/dom.js";
import { fenetreApropos, fenetreEcrire, fenetrePhotos, fenetreReglages } from "../bureau/fenetres-annexes.js";
import { fenetreLecteur } from "../bureau/fenetre-lecteur.js";
import { creerFenetres } from "../bureau/fenetres.js";
import { appliquerCouleur, appliquerFond, couleurChoisie, fondChoisi } from "../bureau/fonds.js";
import { icone } from "../bureau/icones.js";
import { plages } from "../bureau/plages.js";
import { afficherErreur, zoneAremplir } from "./commun.js";

/** @typedef {import("../types.js").Programme} Programme */
/** @typedef {import("../bureau/fenetres.js").Definition} Definition */

/** Les icônes du bureau, dans l'ordre : fenêtre ouverte, icône, légende. */
const ICONES = [
  { id: "lecteur", dessin: "cassette", nom: "minimum radio", marque: true },
  { id: "photos", dessin: "photos", nom: "Photos", marque: false },
  { id: "ecrire", dessin: "lettre", nom: "Écrire", marque: false },
  { id: "apropos", dessin: "info", nom: "À propos", marque: false },
  { id: "reglages", dessin: "reglages", nom: "Réglages", marque: false },
];

/** Les pages du site, dans le menu Start. */
const PAGES = [
  { href: "cinema/", nom: "Cinéma" },
  { href: "nuit/", nom: "Nuit" },
  { href: "agenda/", nom: "Agenda" },
  { href: "infos/", nom: "Infos" },
  { href: "", nom: "Accueil" },
];

/**
 * @param {string} racine
 * @returns {string}
 */
function bureauHTML(racine) {
  const icones = ICONES.map(
    (i) =>
      `<li><button type="button" class="icone-bureau${i.marque ? " icone-bureau--marque" : ""}" data-fenetre="${i.id}">` +
      `${icone(i.dessin)}<span>${echapper(i.nom)}</span></button></li>`
  ).join("");
  const raccourcis = ICONES.map(
      (i) =>
        `<li><button type="button" class="demarrer__item" data-fenetre="${i.id}">${icone(i.dessin, "demarrer__icone")}${echapper(i.id === "lecteur" ? "Minimum radio" : i.nom)}</button></li>`
    )
    .join("");
  const pages = PAGES.map((p) => `<li><a class="demarrer__item" href="${racine}${p.href}">${echapper(p.nom)}</a></li>`).join("");
  return (
    `<div class="bureau__ecran"><ul class="bureau__icones">${icones}</ul>` +
    `<div class="bureau__fenetres"></div>` +
    `<nav class="demarrer" aria-label="Menu Start" hidden><ul>${raccourcis}</ul><div class="demarrer__trait"></div><ul>${pages}</ul></nav></div>` +
    `<div class="barre"><button type="button" class="barre__start" aria-expanded="false" aria-haspopup="true">Start</button>` +
    `<div class="barre__onglets"></div><time class="barre__heure"></time></div>`
  );
}

/** @returns {string} */
function heureLocale() {
  return new Date().toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Remplit la page Radio. Renvoie de quoi la démonter.
 * @returns {() => void}
 */
export function initRadio() {
  const zone = zoneAremplir();
  if (!zone) return () => {};
  const racine = document.body.dataset.racine ?? "";
  zone.innerHTML = bureauHTML(racine);

  const ecran = trouver(zone, ".bureau__ecran", HTMLElement);
  const calque = trouver(zone, ".bureau__fenetres", HTMLElement);
  const onglets = trouver(zone, ".barre__onglets", HTMLElement);
  const heure = trouver(zone, ".barre__heure", HTMLElement);
  const start = trouver(zone, ".barre__start", HTMLButtonElement);
  const demarrer = trouver(zone, ".demarrer", HTMLElement);

  appliquerFond(ecran, fondChoisi(), racine);
  appliquerCouleur(zone, couleurChoisie());

  const fenetres = creerFenetres({ fenetres: calque, onglets });
  /** @type {Map<string, Definition>} */
  const definitions = new Map();

  /** @param {string} id */
  const ouvrir = (id) => {
    const def = definitions.get(id);
    if (def) fenetres.ouvrir(def);
  };

  /** @param {boolean} ouvert */
  const basculerStart = (ouvert) => {
    demarrer.hidden = !ouvert;
    start.setAttribute("aria-expanded", String(ouvert));
  };

  /** @param {MouseEvent} e */
  const auClic = (e) => {
    const cible = e.target instanceof Element ? e.target : null;
    if (!cible) return;
    const ouvre = cible.closest("[data-fenetre]");
    if (ouvre instanceof HTMLElement && ouvre.dataset.fenetre) ouvrir(ouvre.dataset.fenetre);
    if (cible.closest(".barre__start")) return basculerStart(demarrer.hidden);
    /* Un clic ailleurs, ou sur un choix du menu, referme le menu Start. */
    if (!demarrer.hidden) basculerStart(false);
  };

  /** @param {KeyboardEvent} e */
  const auClavier = (e) => {
    if (e.key === "Escape" && !demarrer.hidden) {
      basculerStart(false);
      start.focus();
    }
  };

  zone.addEventListener("click", auClic);
  document.addEventListener("keydown", auClavier);
  heure.textContent = heureLocale();
  const horloge = window.setInterval(() => (heure.textContent = heureLocale()), 20_000);

  let actif = true;
  chargerProgramme()
    .catch((/** @type {unknown} */ erreur) => {
      console.warn("Minimum : programme indisponible, le bureau n’a que le direct.", erreur);
      return null;
    })
    .then((programme) => {
      if (!actif) return;
      /** @type {Programme | null} */
      const p = programme;
      const photos = (p?.soirees ?? [])
        .filter((s) => s.affiche)
        .map((s) => ({ image: /** @type {import("../types.js").Image} */ (s.affiche), nom: `${s.titre}, ${s.date}` }));
      /** @type {Definition[]} */
      const toutes = [
        fenetreLecteur(plages(p), ouvrir),
        fenetrePhotos(photos),
        fenetreEcrire(),
        fenetreApropos(racine),
        fenetreReglages({ ecran, bureau: zone, racine }),
      ];
      for (const def of toutes) definitions.set(def.id, def);
      ouvrir("lecteur");
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));

  return () => {
    actif = false;
    window.clearInterval(horloge);
    zone.removeEventListener("click", auClic);
    document.removeEventListener("keydown", auClavier);
    fenetres.detruire();
  };
}
