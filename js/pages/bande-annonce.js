// @ts-check
/* Minimum : la bande-annonce d’un film, affichée d’emblée sur sa fiche.

   Le lecteur est là tout de suite, avec l’image de la vidéo : un toucher
   la lance (le son ne démarre jamais tout seul). Il se charge en mode
   « sans cookie » (youtube-nocookie, Vimeo dnt=1). */

import { echapper } from "../format.js";

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
  /* youtu.be/ID, youtube.com/watch?v=ID, et l’adresse d’un live : youtube.com/live/ID. */
  const live = url.pathname.match(/^\/live\/([^/]+)/);
  const idYoutube =
    hote === "youtu.be" ? url.pathname.slice(1) : hote === "youtube.com" ? url.searchParams.get("v") ?? live?.[1] ?? null : null;
  if (idYoutube && ID_YOUTUBE.test(idYoutube)) {
    return { fournisseur: "YouTube", lecteur: `https://www.youtube-nocookie.com/embed/${idYoutube}?rel=0&playsinline=1` };
  }
  const idVimeo = hote === "vimeo.com" ? url.pathname.slice(1) : null;
  if (idVimeo && ID_VIMEO.test(idVimeo)) {
    return { fournisseur: "Vimeo", lecteur: `https://player.vimeo.com/video/${idVimeo}?dnt=1&playsinline=1` };
  }
  return null;
}

/**
 * Le lecteur, dans une case noire de format vidéo.
 * @param {string | null} adresse
 * @param {string} titre  Titre du film, pour nommer le lecteur.
 * @returns {string}
 */
export function bandeAnnonceHTML(adresse, titre) {
  const video = adresse ? lireVideo(adresse) : null;
  if (!video) return "";
  return (
    `<div class="bande-annonce"><iframe class="bande-annonce__lecteur" src="${echapper(video.lecteur)}" ` +
    `title="${echapper(`Bande-annonce : ${titre}`)}" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen ` +
    `referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe></div>`
  );
}
