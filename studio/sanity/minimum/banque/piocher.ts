/* La banque de films : lire le catalogue de l'autre cinéma, et y piocher.
   Ce fichier ne dépend pas du Studio (ni React, ni formulaire) : il se
   vérifie seul (verifications/banque.mjs). */

import { AUTRE, TYPE_IMAGE } from "./reglages";

/** Une image du catalogue de l'autre cinéma. */
export interface ImageDeLaBanque {
  url: string | null;
  nom: string | null;
  alt: string | null;
  hotspot: Record<string, unknown> | null;
  crop: Record<string, unknown> | null;
}

/** Un film du catalogue de l'autre cinéma, tel qu'on le lit. */
export interface FilmDeLaBanque {
  _id: string;
  title: string | null;
  director: string | null;
  duration: number | null;
  year: number | null;
  country: string | null;
  originalTitle: string | null;
  language: string | null;
  subtitles: string | null;
  ageRating: string | null;
  typeDeFilm: string | null;
  synopsis: string | null;
  trailerUrl: string | null;
  presseUrl: string | null;
  slug: string | null;
  affiche: ImageDeLaBanque | null;
  photos: ImageDeLaBanque[] | null;
}

/** Ce qu'il faut savoir d'un film d'ici pour reconnaître qu'il est déjà pioché. */
export interface FilmDIci {
  _id: string;
  title?: string | null;
  origineBanque?: string | null;
}

const IMAGE = '{"url": asset->url, "nom": asset->originalFilename, alt, hotspot, crop}';

/** Les films publiés de l'autre cinéma, du plus récemment ajouté au plus ancien. */
export const REQUETE_BANQUE = `*[_type == "film" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]
  | order(_createdAt desc){
    _id, title, director, duration, year, country, originalTitle, language, subtitles, ageRating,
    "typeDeFilm": coalesce(typeDeFilm, array::join(genres, " · ")),
    synopsis, trailerUrl, presseUrl, "slug": slug.current,
    "affiche": poster${IMAGE}, "photos": stillImages[defined(asset)]${IMAGE}
  }`;

/** Les films d'ici, pour savoir lesquels sont déjà là. */
export const REQUETE_ICI = `*[_type == "film" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{_id, title, origineBanque}`;

/** La marque laissée sur un film pioché : « zinema:<identifiant> ». */
export function origineDe(film: Pick<FilmDeLaBanque, "_id">): string {
  return `${AUTRE.cle}:${film._id}`;
}

/** Un titre ramené à l'essentiel, pour comparer « MR. NOBODY » et « Mr. Nobody ». */
function titreCompare(titre: string | null | undefined): string {
  return String(titre ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Le film d'ici qui correspond à ce film de la banque, s'il y en a un :
 * celui qui en a été pioché, ou celui qui porte le même identifiant (les
 * films recopiés le 26.11.2026), ou le même titre.
 */
export function dejaIci(film: FilmDeLaBanque, filmsDIci: readonly FilmDIci[]): FilmDIci | null {
  const origine = origineDe(film);
  const titre = titreCompare(film.title);
  return (
    filmsDIci.find((ici) => ici.origineBanque === origine) ??
    filmsDIci.find((ici) => ici._id === film._id) ??
    (titre ? filmsDIci.find((ici) => titreCompare(ici.title) === titre) : undefined) ??
    null
  );
}

const propre = (valeur: string | null | undefined): string | undefined => {
  const texte = typeof valeur === "string" ? valeur.trim() : "";
  return texte || undefined;
};

function image(lue: ImageDeLaBanque, assetId: string, cle?: string): Record<string, unknown> {
  return {
    _type: TYPE_IMAGE,
    ...(cle ? { _key: cle } : {}),
    asset: { _type: "reference", _ref: assetId },
    ...(propre(lue.alt) ? { alt: propre(lue.alt) } : {}),
    ...(lue.hotspot ? { hotspot: lue.hotspot } : {}),
    ...(lue.crop ? { crop: lue.crop } : {}),
  };
}

/**
 * La fiche à créer ici à partir d'un film de la banque.
 *
 * Ce qui décrit le FILM est repris : titre, réalisation, durée, année, pays,
 * version, âge, type, synopsis, bande-annonce, presse, affiche, photos.
 * Ce qui tient à un CINÉMA ne l'est pas : où en est le film chez l'autre,
 * ses séances, sa date de sortie là-bas, son invité. Ici, le film arrive
 * « À l'affiche », comme toute fiche qu'on vient de créer.
 */
export function ficheAPartirDe(
  film: FilmDeLaBanque,
  afficheId: string | null,
  photosIds: readonly (string | null)[] = []
): Record<string, unknown> {
  const photos = (film.photos ?? [])
    .map((photo, rang) => (photosIds[rang] ? image(photo, photosIds[rang] as string, `photo${rang}`) : null))
    .filter((photo): photo is Record<string, unknown> => photo !== null);
  const fiche: Record<string, unknown> = {
    _type: "film",
    title: propre(film.title),
    director: propre(film.director),
    duration: film.duration ?? undefined,
    year: film.year ?? undefined,
    country: propre(film.country),
    originalTitle: propre(film.originalTitle),
    language: propre(film.language),
    subtitles: propre(film.subtitles),
    ageRating: propre(film.ageRating),
    typeDeFilm: propre(film.typeDeFilm),
    synopsis: propre(film.synopsis),
    trailerUrl: propre(film.trailerUrl),
    presseUrl: propre(film.presseUrl),
    slug: propre(film.slug) ? { _type: "slug", current: propre(film.slug) } : undefined,
    poster: film.affiche && afficheId ? image(film.affiche, afficheId) : undefined,
    stillImages: photos.length ? photos : undefined,
    status: "a-laffiche",
    statuts: ["a-laffiche"],
    origineBanque: origineDe(film),
  };
  for (const champ of Object.keys(fiche)) if (fiche[champ] === undefined) delete fiche[champ];
  return fiche;
}

/** Ce qu'il faut pour écrire ici : le client Sanity du Studio le fournit. */
export interface Ecrivain {
  assets: {
    upload: (type: "image", corps: Blob, options: { filename?: string }) => Promise<{ _id: string }>;
  };
  create: (fiche: Record<string, unknown>) => Promise<{ _id: string }>;
}

/** Va chercher une image de la banque. Le navigateur (ou Node) la télécharge telle quelle. */
export type Telechargeur = (url: string) => Promise<Blob>;

const telechargerImage: Telechargeur = async (url) => {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`Image de la banque illisible (${reponse.status}).`);
  return reponse.blob();
};

/**
 * Pioche un film : copie son affiche et ses photos ici, puis crée sa fiche,
 * publiée. Rend l'identifiant de la nouvelle fiche.
 *
 * Une image qui ne se laisse pas copier n'empêche pas le reste : la fiche
 * est créée sans elle, et le dit (`imagesManquantes`).
 */
export async function piocher(
  client: Ecrivain,
  film: FilmDeLaBanque,
  telecharger: Telechargeur = telechargerImage
): Promise<{ id: string; imagesManquantes: number }> {
  let imagesManquantes = 0;
  const copier = async (lue: ImageDeLaBanque | null): Promise<string | null> => {
    if (!lue?.url) return null;
    try {
      const fichier = await telecharger(lue.url);
      const deposee = await client.assets.upload("image", fichier, { filename: lue.nom ?? undefined });
      return deposee._id;
    } catch (cause) {
      console.error("Banque de films : une image n'a pas pu être copiée.", cause);
      imagesManquantes += 1;
      return null;
    }
  };
  const afficheId = await copier(film.affiche);
  const photosIds: (string | null)[] = [];
  for (const photo of film.photos ?? []) photosIds.push(await copier(photo));
  const creee = await client.create(ficheAPartirDe(film, afficheId, photosIds));
  return { id: creee._id, imagesManquantes };
}
