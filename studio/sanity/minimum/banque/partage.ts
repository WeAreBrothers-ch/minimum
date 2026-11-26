/* Les films partagés : lire les films de l'autre cinéma, et faire venir ici
   ceux qui n'y sont pas encore. Ce fichier ne dépend pas du Studio (ni
   React, ni formulaire) : il se vérifie seul (verifications/banque.mjs).

   Rien n'est jamais modifié ni supprimé, ni ici ni chez l'autre : on ne
   fait que CRÉER ici les fiches qui manquent. */

import { AUTRE, ETAT_A_L_ARRIVEE, ID_JOURNAL, TYPE_IMAGE, TYPE_JOURNAL } from "./reglages";

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

/** Ce qu'il faut savoir d'un film d'ici pour reconnaître qu'il est déjà là. */
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

/** La marque laissée sur un film venu de l'autre cinéma : « zinema:<identifiant> ». */
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
 * Le film d'ici qui correspond à ce film de l'autre cinéma, s'il y en a un :
 * celui qui porte sa marque, ou le même identifiant (un film arrive avec
 * l'identifiant qu'il a chez l'autre), ou le même titre (saisi à la main
 * des deux côtés).
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
 * La fiche à créer ici à partir d'un film de l'autre cinéma.
 *
 * Ce qui décrit le FILM est repris : titre, réalisation, durée, année, pays,
 * version, âge, type, synopsis, bande-annonce, presse, affiche, photos.
 * Ce qui tient à un CINÉMA ne l'est pas : où en est le film chez l'autre,
 * ses séances, sa date de sortie là-bas, son invité.
 *
 * La fiche garde l'identifiant du film chez l'autre : le même film a le
 * même identifiant des deux côtés, et le créer deux fois est impossible.
 * Elle arrive PAS à l'affiche (ETAT_A_L_ARRIVEE) : c'est ici qu'on décide
 * de le montrer.
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
    _id: film._id,
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
    status: ETAT_A_L_ARRIVEE,
    statuts: [ETAT_A_L_ARRIVEE],
    origineBanque: origineDe(film),
  };
  for (const champ of Object.keys(fiche)) if (fiche[champ] === undefined) delete fiche[champ];
  return fiche;
}

/** Ce qu'il faut pour lire : le client Sanity du Studio, ou celui de l'autre projet. */
export interface Lecteur {
  fetch: <T>(requete: string, parametres?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<T>;
}

interface Retouche {
  setIfMissing: (valeurs: Record<string, unknown>) => Retouche;
  insert: (ou: "after", chemin: string, elements: unknown[]) => Retouche;
  commit: () => Promise<unknown>;
}

/** Ce qu'il faut pour écrire ici : le client Sanity du Studio le fournit. */
export interface Ecrivain extends Lecteur {
  assets: {
    upload: (type: "image", corps: Blob, options: { filename?: string }) => Promise<{ _id: string }>;
  };
  createIfNotExists: (fiche: Record<string, unknown>) => Promise<{ _id: string }>;
  patch: (id: string) => Retouche;
}

/** Va chercher une image de l'autre cinéma. Le navigateur la télécharge telle quelle. */
export type Telechargeur = (url: string) => Promise<Blob>;

const telechargerImage: Telechargeur = async (url) => {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`Image illisible (${reponse.status}).`);
  return reponse.blob();
};

/**
 * Fait venir un film : copie son affiche et ses photos ici, puis crée sa
 * fiche, publiée, si elle n'existe pas déjà. Rend l'identifiant de la fiche.
 *
 * Une image qui ne se laisse pas copier n'empêche pas le reste : la fiche
 * est créée sans elle, et le dit (`imagesManquantes`).
 */
export async function faireVenir(
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
      console.error("Films partagés : une image n'a pas pu être copiée.", cause);
      imagesManquantes += 1;
      return null;
    }
  };
  const afficheId = await copier(film.affiche);
  const photosIds: (string | null)[] = [];
  for (const photo of film.photos ?? []) photosIds.push(await copier(photo));
  const creee = await client.createIfNotExists(ficheAPartirDe(film, afficheId, photosIds));
  return { id: creee._id, imagesManquantes };
}

/* ---------------- Le carnet ----------------
   La liste des films de l'autre cinéma déjà venus ici (ou déjà là). Il ne
   sert qu'à une chose : un film qu'on SUPPRIME ici ne doit pas revenir tout
   seul cinq minutes plus tard. Un film noté au carnet et absent d'ici a
   donc été retiré exprès : on ne le fait plus venir d'office. */

/** Les identifiants notés au carnet. */
export const REQUETE_JOURNAL = `*[_id == $id][0].films`;

/** Note au carnet des films de l'autre cinéma. */
export async function noterAuJournal(client: Ecrivain, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  await client.createIfNotExists({ _id: ID_JOURNAL, _type: TYPE_JOURNAL, films: [] });
  await client
    .patch(ID_JOURNAL)
    .setIfMissing({ films: [] })
    .insert("after", "films[-1]", [...new Set(ids)])
    .commit();
}

/** Ce qu'il y a à faire de chaque film de l'autre cinéma. */
export interface Tri {
  /** Pas ici, jamais venus : à faire venir. */
  aFaireVenir: FilmDeLaBanque[];
  /** Déjà ici, mais pas encore au carnet : à noter. */
  aNoter: string[];
  /** Au carnet mais plus ici : retirés exprès, on n'y touche pas. */
  retires: FilmDeLaBanque[];
}

export function trier(
  films: readonly FilmDeLaBanque[],
  filmsDIci: readonly FilmDIci[],
  journal: readonly string[] | null | undefined
): Tri {
  const notes = new Set(journal ?? []);
  const tri: Tri = { aFaireVenir: [], aNoter: [], retires: [] };
  for (const film of films) {
    if (dejaIci(film, filmsDIci)) {
      if (!notes.has(film._id)) tri.aNoter.push(film._id);
    } else if (notes.has(film._id)) tri.retires.push(film);
    else tri.aFaireVenir.push(film);
  }
  return tri;
}

/** Ce qu'une arrivée a donné. */
export interface Bilan {
  /** Les films arrivés à l'instant. */
  arrives: { id: string; titre: string }[];
  /** Les films qui n'ont pas pu être créés (connexion, droits). */
  rates: number;
  /** Les images qui n'ont pas suivi. */
  imagesManquantes: number;
}

/**
 * L'arrivée des films : lit les films publiés de l'autre cinéma, et crée
 * ici ceux qui manquent. Ne modifie et ne supprime rien, nulle part.
 *
 * Un film qui rate (connexion coupée) n'est pas noté au carnet : il sera
 * retenté la fois suivante.
 */
export async function arriveeDesFilms(
  client: Ecrivain,
  autre: Lecteur,
  telecharger: Telechargeur = telechargerImage
): Promise<Bilan> {
  const [films, filmsDIci, journal] = await Promise.all([
    autre.fetch<FilmDeLaBanque[]>(REQUETE_BANQUE),
    client.fetch<FilmDIci[]>(REQUETE_ICI, {}, { perspective: "published" }),
    client.fetch<string[] | null>(REQUETE_JOURNAL, { id: ID_JOURNAL }, { perspective: "raw" }),
  ]);
  const { aFaireVenir, aNoter } = trier(films ?? [], filmsDIci ?? [], journal);
  const bilan: Bilan = { arrives: [], rates: 0, imagesManquantes: 0 };
  for (const film of aFaireVenir) {
    try {
      const { id, imagesManquantes } = await faireVenir(client, film, telecharger);
      bilan.arrives.push({ id, titre: film.title?.trim() || "Film sans titre" });
      bilan.imagesManquantes += imagesManquantes;
    } catch (cause) {
      console.error(`Films partagés : « ${film.title ?? film._id} » n'a pas pu arriver.`, cause);
      bilan.rates += 1;
    }
  }
  /* Le carnet qui ne se laisse pas écrire ne fait pas perdre l'arrivée : les
     films sont là, ils seront notés la fois suivante. */
  try {
    await noterAuJournal(client, [...aNoter, ...bilan.arrives.map((film) => film.id)]);
  } catch (cause) {
    console.error("Films partagés : le carnet n'a pas pu être tenu à jour.", cause);
  }
  return bilan;
}
