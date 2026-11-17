// @ts-check
/* Minimum : la bande-annonce d’un film, chargée seulement au clic.

   Tant qu’on n’a pas cliqué, rien ne part chez YouTube ou Vimeo : ni
   requête, ni cookie. Au clic, le lecteur se charge en mode « sans
   cookie » (youtube-nocookie, Vimeo dnt=1) et la radio se met en pause
   pour que les deux sons ne se chevauchent pas. */

import { echapper } from "../format.js";
import { mettreRadioEnPause } from "../lecteur.js";

/**
 * @typedef {Object} Video
 * @property {"YouTube" | "Vimeo"} fournisseur
 * @property {string} lecteur   Adresse du lecteur à intégrer.
 */

const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
const ID_VIMEO = /^\d{5,12}$/;

/**
 * Reconnaît une adresse YouTube ou Vimeo. Toute autre adresse est refusée.
 * @param {string} adresse
 * @returns {Video | null}
 */
export function lireVideo(adresse) {
  let url;
  try {
    url = new URL(adresse);
  } catch {
    return null;
  }
  const hote = url.hostname.replace(/^(www|m)\./, "");
  const idYoutube = hote === "youtu.be" ? url.pathname.slice(1) : hote === "youtube.com" ? url.searchParams.get("v") : null;
  if (idYoutube && ID_YOUTUBE.test(idYoutube)) {
    return { fournisseur: "YouTube", lecteur: `https://www.youtube-nocookie.com/embed/${idYoutube}?autoplay=1&rel=0` };
  }
  const idVimeo = hote === "vimeo.com" ? url.pathname.slice(1) : null;
  if (idVimeo && ID_VIMEO.test(idVimeo)) {
    return { fournisseur: "Vimeo", lecteur: `https://player.vimeo.com/video/${idVimeo}?autoplay=1&dnt=1` };
  }
  return null;
}

/**
 * Le bouton qui tient la place du lecteur : une barre, comme celle de la
 * radio. Elle ne prend la hauteur d’une vidéo qu’une fois lancée.
 * @param {string | null} adresse
 * @param {string} titre  Titre du film, pour nommer le lecteur.
 * @returns {string}
 */
export function bandeAnnonceHTML(adresse, titre) {
  const video = adresse ? lireVideo(adresse) : null;
  if (!video) return "";
  return (
    `<div class="bande-annonce" data-lecteur="${echapper(video.lecteur)}" data-titre="${echapper(titre)}">` +
    `<button class="bande-annonce__lancer" type="button">` +
    `<span class="bande-annonce__titre">Bande-annonce</span>` +
    `<span class="bande-annonce__tirets tirets" aria-hidden="true"></span>` +
    `<span class="bande-annonce__note">Lire ici, depuis ${video.fournisseur}</span>` +
    `</button></div>`
  );
}

/**
 * Remplace le bouton par le lecteur au premier clic.
 * @param {HTMLElement} zone
 * @param {AbortSignal} signal
 */
export function monterBandesAnnonces(zone, signal) {
  zone.addEventListener("click", (e) => {
    const bouton = e.target instanceof Element ? e.target.closest(".bande-annonce__lancer") : null;
    const cadre = bouton?.closest(".bande-annonce");
    if (!(cadre instanceof HTMLElement) || !cadre.dataset.lecteur) return;
    const lecteur = document.createElement("iframe");
    lecteur.className = "bande-annonce__lecteur";
    lecteur.src = cadre.dataset.lecteur;
    lecteur.title = `Bande-annonce : ${cadre.dataset.titre ?? ""}`;
    lecteur.allow = "autoplay; fullscreen; picture-in-picture";
    lecteur.allowFullscreen = true;
    lecteur.referrerPolicy = "strict-origin-when-cross-origin";
    mettreRadioEnPause();
    cadre.classList.add("bande-annonce--ouverte");
    cadre.replaceChildren(lecteur);
    lecteur.focus();
  }, { signal });
}
