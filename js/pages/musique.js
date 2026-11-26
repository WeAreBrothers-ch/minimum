// @ts-check
/* Minimum : la page Musique. Les soirées du club et les lives de la radio
   sur une seule page (revu le 26.11.2026 : « une seule page pour la
   musique, mais vraiment clean »).

   - En direct : quand un live passe, le lecteur YouTube tout en haut, en
     grand, et à côté ce qu’il montre et le lien vers la chaîne.
   - Au programme : soirées et lives ensemble, dans l’ordre des dates, au
     même format d’affiche (js/flyer.js). Une soirée mène à sa fiche
     (line-up, billets), un live à la chaîne YouTube.
   - À revoir : les lives passés dont la vidéo est en ligne ; un toucher sur
     la ligne la met dans le lecteur, en haut.

   Le lecteur YouTube est celui « sans cookie » ; le son ne part jamais
   tout seul. */

import { CHAINE_YOUTUBE } from "../config.js";
import { chargerProgramme } from "../donnees.js";
import { echapper, heureCourte, jourCourt, jourLongMajuscule } from "../format.js";
import { flyerHTML, flyerSoireeHTML } from "../flyer.js";
import { sourcesImage } from "../images.js";
import { lireVideo } from "./bande-annonce.js";
import { afficherErreur, zoneAremplir } from "./commun.js";

/** @typedef {import("../types.js").Emission} Emission */
/** @typedef {import("../types.js").Programme} Programme */
/** @typedef {import("../types.js").Soiree} Soiree */

/** L’identifiant d’une chaîne YouTube : « UC » et 22 caractères. */
const ID_CHAINE = /^UC[A-Za-z0-9_-]{22}$/;

/** @returns {string | null} */
function chaine() {
  return CHAINE_YOUTUBE && ID_CHAINE.test(CHAINE_YOUTUBE) ? CHAINE_YOUTUBE : null;
}

/** @returns {string | null} */
function lienChaine() {
  const id = chaine();
  return id ? `https://www.youtube.com/channel/${id}` : null;
}

/**
 * Le lecteur d’un live mis en ligne, ou null.
 * @param {Emission} e
 * @returns {string | null}
 */
function lecteurDe(e) {
  const video = e.video ? lireVideo(e.video) : null;
  return video && video.fournisseur === "YouTube" ? video.lecteur : null;
}

/**
 * Ce que montre le lecteur.
 * @typedef {Object} Ecran
 * @property {Emission} live
 * @property {boolean} direct    Le live en cours (sinon : un live à revoir).
 * @property {string | null} source  Adresse du lecteur YouTube, ou null.
 */

/**
 * Le lecteur du live en cours : la chaîne en direct, sinon sa vidéo.
 * @param {Emission} live
 * @returns {Ecran}
 */
function ecranDirect(live) {
  const id = chaine();
  const source = id ? `https://www.youtube.com/embed/live_stream?channel=${id}&playsinline=1` : lecteurDe(live);
  return { live, direct: true, source };
}

/**
 * La vidéo, ou, tant qu’elle n’est pas là, le portrait de l’artiste.
 * @param {Ecran} ecran
 * @returns {string}
 */
function videoHTML(ecran) {
  const { live } = ecran;
  if (ecran.source) {
    const titre = `${ecran.direct ? "En direct" : "À revoir"} : ${live.titre}`;
    return (
      `<iframe class="live__video" src="${echapper(ecran.source)}" title="${echapper(titre)}" ` +
      `allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen ` +
      `referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    );
  }
  const racine = document.body.dataset.racine ?? "";
  let portrait = "";
  if (live.visuel) {
    const { src, srcset, sizes } = sourcesImage(live.visuel, racine, [480, 720, 960], "(min-width: 56rem) 75vw, 100vw");
    const variantes = srcset ? ` srcset="${echapper(srcset)}" sizes="${echapper(sizes)}"` : "";
    portrait = `<img class="live__portrait" src="${echapper(src)}"${variantes} alt="" fetchpriority="high" decoding="async">`;
  }
  return portrait;
}

/**
 * La case à côté du lecteur : en direct ou à revoir, l’artiste, le jour,
 * et le lien vers la chaîne.
 * @param {Ecran} ecran
 * @returns {string}
 */
function infosHTML(ecran) {
  const { live } = ecran;
  const lien = lienChaine();
  return (
    `<span class="live__etat${ecran.direct ? " en-direct" : ""}">${ecran.direct ? "En direct" : "À revoir"}</span>` +
    `<p class="live__titre">${echapper(live.titre)}</p>` +
    `<p class="live__quand">${echapper(jourLongMajuscule(live.date))}, ${heureCourte(live.heure)}</p>` +
    (lien
      ? `<a class="live__chaine" href="${echapper(lien)}" rel="noopener">La chaîne YouTube ` +
        `<span class="fleche fleche--sortie" aria-hidden="true"></span></a>`
      : "")
  );
}

/**
 * Le lecteur, en haut de la page.
 * @param {Ecran} ecran
 * @returns {string}
 */
function lecteurHTML(ecran) {
  return (
    `<section class="live" id="direct" aria-label="${ecran.direct ? "En direct" : "À revoir"}">` +
    `<div class="live__ecran">${videoHTML(ecran)}</div>` +
    `<div class="live__infos">${infosHTML(ecran)}</div></section>`
  );
}

/**
 * Au programme : soirées et lives, dans l’ordre des dates, au même format.
 * @param {Soiree[]} soirees
 * @param {Emission[]} lives
 * @param {string} racine
 * @returns {string}
 */
function programmeHTML(soirees, lives, racine) {
  /** @type {Array<{ cle: string, id: string, html: (prioritaire: boolean) => string }>} */
  const cases = [];
  const chaineYT = lienChaine();
  for (const s of soirees) {
    const lien = `${racine}soiree/?id=${encodeURIComponent(s.id)}`;
    cases.push({ cle: s.date + s.heure, id: s.id, html: (prioritaire) => flyerSoireeHTML(s, racine, { lien, prioritaire }) });
  }
  for (const e of lives) {
    const lien = chaineYT ?? `#${e.id}`;
    cases.push({ cle: e.date + e.heure, id: e.id, html: (prioritaire) => flyerHTML(e, racine, { lien, prioritaire }) });
  }
  if (cases.length === 0) return `<p class="page__vide">Aucune date annoncée pour l’instant.</p>`;
  cases.sort((a, b) => a.cle.localeCompare(b.cle));
  return (
    `<section aria-labelledby="au-programme"><h2 class="rubrique" id="au-programme">Au programme</h2>` +
    `<ul class="flyers">${cases
      .map((c, i) => `<li id="${echapper(c.id)}">${c.html(i < 4)}</li>`)
      .join("")}</ul></section>`
  );
}

/**
 * À revoir : une ligne par live passé dont la vidéo est en ligne.
 * @param {Emission[]} liste
 * @returns {string}
 */
function revoirHTML(liste) {
  if (liste.length === 0) return "";
  const lignes = liste
    .map(
      (e) =>
        `<li id="${echapper(e.id)}"><button type="button" class="ligne-live" data-live="${echapper(e.id)}">` +
        `<span class="ligne-live__quand">${echapper(jourCourt(e.date))}</span>` +
        `<span class="ligne-live__titre">${echapper(e.titre)}</span>` +
        `<span class="fleche" aria-hidden="true"></span></button></li>`
    )
    .join("");
  return (
    `<section aria-labelledby="a-revoir"><h2 class="rubrique" id="a-revoir">À revoir</h2>` +
    `<ul class="lives__liste">${lignes}</ul></section>`
  );
}

/**
 * Remplit la page Musique. Renvoie de quoi la démonter.
 * @returns {() => void}
 */
export function initMusique() {
  const fin = new AbortController();
  const zone = zoneAremplir();
  if (!zone) return () => fin.abort();
  const racine = document.body.dataset.racine ?? "";

  chargerProgramme()
    .then((programme) => {
      if (fin.signal.aborted) return;
      const auj = programme.aujourdhui;
      const enCours = programme.emissions.find((e) => e.enDirect) ?? null;
      const soirees = programme.soirees.filter((s) => s.date >= auj);
      const aVenir = programme.emissions.filter((e) => !e.enDirect && e.date >= auj);
      const aRevoir = programme.emissions
        .filter((e) => !e.enDirect && e.date < auj && lecteurDe(e))
        .sort((a, b) => (b.date + b.heure).localeCompare(a.date + a.heure));

      zone.innerHTML =
        `<div data-lecteur>${enCours ? lecteurHTML(ecranDirect(enCours)) : ""}</div>` +
        programmeHTML(soirees, aVenir, racine) +
        revoirHTML(aRevoir);

      /** @param {Emission} e */
      const revoir = (e) => {
        const cadre = zone.querySelector("[data-lecteur]");
        if (!(cadre instanceof HTMLElement)) return;
        cadre.innerHTML = lecteurHTML({ live: e, direct: false, source: lecteurDe(e) });
        for (const b of zone.querySelectorAll("[data-live]")) {
          if (b instanceof HTMLElement) b.setAttribute("aria-current", String(b.dataset.live === e.id));
        }
        cadre.scrollIntoView({ block: "start", behavior: "smooth" });
      };

      zone.addEventListener(
        "click",
        (ev) => {
          const bouton = ev.target instanceof Element ? ev.target.closest("[data-live]") : null;
          if (!(bouton instanceof HTMLElement)) return;
          const live = aRevoir.find((e) => e.id === bouton.dataset.live);
          if (live) revoir(live);
        },
        { signal: fin.signal }
      );

      /* Arrivé sur un live (musique/#live-…, depuis l’accueil ou l’agenda) :
         le live en cours est déjà en haut ; un live passé se met dans le
         lecteur ; un live à venir est montré dans le programme. */
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id || id === enCours?.id) return;
      const passe = aRevoir.find((e) => e.id === id);
      if (passe) revoir(passe);
      else document.getElementById(id)?.scrollIntoView({ block: "center" });
    })
    .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
  return () => fin.abort();
}
