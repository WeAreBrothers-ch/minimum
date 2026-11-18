// @ts-check
/* Minimum : la page Radio. Un poste à l’ancienne, dans le style de
   soso radio : un écran à pixels, un cadran, des touches, un volume.

   Le poste ne joue rien lui-même : il pilote le lecteur de la barre du
   bas (lecteur.js), le seul à produire du son, qui ne s’arrête pas quand
   on change de page. Sous le poste, la liste des émissions reste lisible
   et utilisable sans lui. */

import { FLUX_RADIO } from "../config.js";
import { chargerProgramme } from "../donnees.js";
import { echapper, heureCourte, jourLong, jourLongMajuscule } from "../format.js";
import { choisirPiste, EVENEMENT_PISTE, pisteQuiJoue, reglerVolume, volumeDuLecteur } from "../lecteur.js";
import { afficherErreur, zoneAremplir } from "./commun.js";

/** @typedef {import("../types.js").Emission} Emission */
/** @typedef {import("../types.js").Programme} Programme */
/** @typedef {import("../types.js").Piste} Piste */

/** Le nombre de barres de l’égaliseur de l’écran. */
const BARRES = 14;

/**
 * Une émission, ou le direct, telle que le poste la montre.
 * @typedef {Object} Plage
 * @property {Piste} piste
 * @property {string} ecran    Le nom, en capitales, sur l’écran du poste.
 * @property {string} quand    La ligne de date, sur l’écran et dans la liste.
 * @property {boolean} direct
 */

/** @type {Piste} */
const DIRECT = { id: "direct", titre: "Radio Minimum", etat: "Radio", audio: FLUX_RADIO };

/**
 * @param {Emission} e
 * @returns {Plage}
 */
function plageDeLEmission(e) {
  const quand = `${e.enDirect ? `En direct, ${jourLong(e.date)}` : jourLongMajuscule(e.date)}, ${heureCourte(e.heure)}`;
  return {
    piste: { id: e.id, titre: e.titre, etat: e.enDirect ? "En direct" : "À réécouter", audio: e.audio },
    ecran: e.titre,
    quand,
    direct: e.enDirect,
  };
}

/**
 * Le direct d’abord, puis les émissions en direct, puis les archives
 * de la plus récente à la plus ancienne.
 * @param {Programme} programme
 * @returns {Plage[]}
 */
function plages(programme) {
  const enDirect = programme.emissions.filter((e) => e.enDirect);
  const archives = programme.emissions.filter((e) => !e.enDirect).sort((a, b) => b.date.localeCompare(a.date));
  /** @type {Plage} */
  const direct = {
    piste: DIRECT,
    ecran: "Radio Minimum",
    quand: FLUX_RADIO ? "En continu" : "Pas encore à l’antenne",
    direct: true,
  };
  return [direct, ...enDirect.map(plageDeLEmission), ...archives.map(plageDeLEmission)];
}

/** @param {Plage} plage */
function sonDisponible(plage) {
  return plage.piste.audio !== null;
}

/**
 * Le poste : écran, cadran, touches, volume.
 * @param {Plage[]} liste
 * @returns {string}
 */
function posteHTML(liste) {
  const barres = Array.from({ length: BARRES }, () => "<i></i>").join("");
  const touches = liste
    .map(
      (plage, i) =>
        `<li><button type="button" class="poste__preselection" data-rang="${i}" aria-pressed="false" ` +
        `aria-label="${echapper(`Plage ${i + 1} : ${plage.piste.titre}`)}">${i + 1}</button></li>`
    )
    .join("");
  return (
    `<section class="poste" aria-label="Poste de radio">` +
    `<div class="poste__haut"><p class="poste__marque">Minimum</p>` +
    `<p class="poste__voyant" data-allume="false"><span aria-hidden="true"></span>On air</p></div>` +
    `<div class="poste__corps">` +
    `<div class="poste__grille" aria-hidden="true"></div>` +
    `<div class="poste__ecran" role="status" aria-live="polite">` +
    `<p class="poste__rang"></p>` +
    `<p class="poste__nom"></p>` +
    `<p class="poste__etat"></p>` +
    `<div class="poste__egaliseur" aria-hidden="true">${barres}</div>` +
    `</div>` +
    `<div class="poste__grille" aria-hidden="true"></div>` +
    `</div>` +
    `<div class="poste__cadran" aria-hidden="true"><span class="poste__aiguille"></span></div>` +
    `<div class="poste__commandes">` +
    `<button type="button" class="poste__touche" data-sens="-1" aria-label="Plage précédente">◀</button>` +
    `<button type="button" class="poste__touche poste__touche--lecture" data-lecture aria-pressed="false" aria-label="Écouter">▶</button>` +
    `<button type="button" class="poste__touche" data-sens="1" aria-label="Plage suivante">▶▶</button>` +
    `</div>` +
    `<label class="poste__volume"><span>Vol</span>` +
    `<input type="range" min="0" max="100" step="5" value="100" aria-label="Volume"></label>` +
    `<ol class="poste__preselections" aria-label="Plages">${touches}</ol>` +
    `</section>`
  );
}

/**
 * @param {Plage} plage
 * @param {number} rang
 * @returns {string}
 */
function ligneHTML(plage, rang) {
  const id = echapper(plage.piste.id);
  const son = sonDisponible(plage);
  return (
    `<li class="emission" id="${id}">` +
    `<button type="button" class="emission__bouton pastille pastille--radio pastille--action" data-rang="${rang}" data-piste="${id}" aria-pressed="false"${son ? "" : " disabled"}>Écouter</button>` +
    `<div class="emission__texte"><h3 class="emission__titre">${echapper(plage.piste.titre)}</h3>` +
    `<p>${echapper(plage.quand)}${son ? "" : ". Son à venir."}</p></div></li>`
  );
}

/**
 * @param {Plage[]} liste
 * @returns {string}
 */
function listesHTML(liste) {
  const direct = liste.filter((p) => p.direct);
  const archives = liste.filter((p) => !p.direct);
  /** @param {Plage[]} plagesDuGroupe */
  const lignes = (plagesDuGroupe) => plagesDuGroupe.map((p) => ligneHTML(p, liste.indexOf(p))).join("");
  return (
    `<section class="page__section"><h2 class="page__sous-titre">Le direct</h2>` +
    `<span class="tirets" aria-hidden="true"></span><ul class="emissions">${lignes(direct)}</ul></section>` +
    (archives.length
      ? `<section class="page__section"><h2 class="page__sous-titre">À réécouter</h2>` +
        `<span class="tirets" aria-hidden="true"></span><ul class="emissions">${lignes(archives)}</ul></section>`
      : "")
  );
}

/**
 * Branche le poste et la liste au lecteur. Renvoie de quoi les débrancher.
 * @param {HTMLElement} zone
 * @param {Plage[]} liste
 * @returns {() => void}
 */
function brancher(zone, liste) {
  const poste = zone.querySelector(".poste");
  if (!(poste instanceof HTMLElement)) return () => {};
  const rangEcran = poste.querySelector(".poste__rang");
  const nomEcran = poste.querySelector(".poste__nom");
  const etatEcran = poste.querySelector(".poste__etat");
  const voyant = poste.querySelector(".poste__voyant");
  const lecture = poste.querySelector("[data-lecture]");
  const aiguille = poste.querySelector(".poste__aiguille");
  const volume = poste.querySelector('input[type="range"]');
  if (
    !(rangEcran instanceof HTMLElement) ||
    !(nomEcran instanceof HTMLElement) ||
    !(etatEcran instanceof HTMLElement) ||
    !(voyant instanceof HTMLElement) ||
    !(lecture instanceof HTMLButtonElement) ||
    !(aiguille instanceof HTMLElement) ||
    !(volume instanceof HTMLInputElement)
  ) {
    return () => {};
  }

  /* La plage choisie sur le poste : celle qui joue si une plage joue,
     sinon le direct. */
  let rang = Math.max(0, liste.findIndex((p) => p.piste.id === pisteQuiJoue()));

  /** Redessine l’écran, le cadran et les touches. */
  const afficher = () => {
    const plage = liste[rang];
    if (!plage) return;
    const joue = pisteQuiJoue() === plage.piste.id;
    const son = sonDisponible(plage);
    rangEcran.textContent = `${String(rang + 1).padStart(2, "0")}/${String(liste.length).padStart(2, "0")}`;
    nomEcran.textContent = plage.ecran;
    etatEcran.textContent = joue
      ? plage.direct
        ? "En direct"
        : "En lecture"
      : son
        ? "Appuyer sur lecture"
        : plage.direct
          ? "Hors antenne"
          : "Son à venir";
    poste.dataset.joue = String(joue);
    voyant.dataset.allume = String(joue && plage.direct);
    lecture.disabled = !son;
    lecture.setAttribute("aria-pressed", String(joue));
    lecture.setAttribute("aria-label", joue ? "Pause" : "Écouter");
    lecture.textContent = joue ? "❚❚" : "▶";
    aiguille.style.left = `${liste.length > 1 ? (rang / (liste.length - 1)) * 100 : 0}%`;
    for (const touche of poste.querySelectorAll(".poste__preselection")) {
      if (touche instanceof HTMLElement) touche.setAttribute("aria-pressed", String(Number(touche.dataset.rang) === rang));
    }
  };

  /** @param {number} sens */
  const aller = (sens) => {
    const joueDeja = pisteQuiJoue() !== null;
    rang = (rang + sens + liste.length) % liste.length;
    const plage = liste[rang];
    /* Si la radio jouait, la nouvelle plage prend le relais ; sinon on
       ne fait que se placer dessus. */
    if (plage && joueDeja && sonDisponible(plage)) choisirPiste(plage.piste);
    else afficher();
  };

  /** @param {MouseEvent} e */
  const auClic = (e) => {
    const cible = e.target instanceof Element ? e.target : null;
    if (!cible) return;
    const sens = cible.closest("[data-sens]");
    if (sens instanceof HTMLElement) return aller(Number(sens.dataset.sens));
    if (cible.closest("[data-lecture]")) {
      const plage = liste[rang];
      if (plage) choisirPiste(plage.piste);
      return;
    }
    const preselection = cible.closest(".poste__preselection");
    if (preselection instanceof HTMLElement) {
      rang = Number(preselection.dataset.rang);
      const plage = liste[rang];
      if (plage && sonDisponible(plage)) choisirPiste(plage.piste);
      else afficher();
      return;
    }
    const ligne = cible.closest(".emission__bouton");
    if (ligne instanceof HTMLElement) {
      rang = Number(ligne.dataset.rang);
      const plage = liste[rang];
      if (plage) choisirPiste(plage.piste);
    }
  };

  /** Les boutons de la liste suivent ce qui joue. */
  const marquerListe = () => {
    const enCours = pisteQuiJoue();
    for (const bouton of zone.querySelectorAll(".emission__bouton")) {
      if (!(bouton instanceof HTMLElement)) continue;
      const actif = bouton.dataset.piste === enCours;
      bouton.setAttribute("aria-pressed", String(actif));
      bouton.textContent = actif ? "Pause" : "Écouter";
    }
  };

  /** @param {Event} e */
  const auChangementDePiste = (e) => {
    const id = e instanceof CustomEvent ? (e.detail?.id ?? null) : null;
    const trouve = liste.findIndex((p) => p.piste.id === id);
    if (trouve !== -1) rang = trouve;
    afficher();
    marquerListe();
  };

  const auVolume = () => {
    reglerVolume(Number(volume.value) / 100);
  };

  volume.value = String(Math.round(volumeDuLecteur() * 100));
  zone.addEventListener("click", auClic);
  volume.addEventListener("input", auVolume);
  document.addEventListener(EVENEMENT_PISTE, auChangementDePiste);
  afficher();
  marquerListe();

  return () => {
    zone.removeEventListener("click", auClic);
    volume.removeEventListener("input", auVolume);
    document.removeEventListener(EVENEMENT_PISTE, auChangementDePiste);
  };
}

/**
 * Remplit la page Radio. Renvoie de quoi la démonter.
 * @returns {() => void}
 */
export function initRadio() {
  const zone = zoneAremplir();
  if (!zone) return () => {};
  let actif = true;
  /** @type {() => void} */
  let debrancher = () => {};

  chargerProgramme()
    .then((programme) => {
      if (!actif) return;
      const liste = plages(programme);
      zone.innerHTML = posteHTML(liste) + listesHTML(liste);
      debrancher = brancher(zone, liste);
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));

  return () => {
    actif = false;
    debrancher();
  };
}
