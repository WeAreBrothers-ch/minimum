/* Les films partagés : lire les films de l'autre cinéma, faire venir ici
   ceux qui n'y sont pas encore, et reprendre ici les corrections faites
   là-bas. Ce fichier ne dépend pas du Studio (ni React, ni formulaire) : il
   se vérifie seul (verifications/banque.mjs).

   Trois règles :
   - rien n'est jamais écrit chez l'autre : on ne fait que le lire ;
   - rien n'est jamais supprimé ici ;
   - une fiche modifiée ICI n'est jamais écrasée toute seule. Une correction
     de l'autre cinéma n'est reprise d'office que si la fiche d'ici n'a pas
     bougé depuis la dernière fois ; sinon l'écran « Films partagés » le dit,
     et c'est une personne qui décide. */

import { AUTRE, ETAT_A_L_ARRIVEE, ID_JOURNAL, TYPE_IMAGE, TYPE_JOURNAL } from "./reglages";

/** Une image d'un film, telle qu'on la lit (ici ou chez l'autre). */
export interface ImageDeLaBanque {
  /** L'identifiant du fichier : « image-<empreinte>-<largeur>x<hauteur>-<format> ». */
  id?: string | null;
  url: string | null;
  nom: string | null;
  alt: string | null;
  hotspot: Record<string, unknown> | null;
  crop: Record<string, unknown> | null;
}

/** Un film tel qu'on le lit, ici ou chez l'autre : ce qui le DÉCRIT. */
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

/** Un film d'ici : sa description, et ce que le partage y a noté. */
export interface FilmDIci extends Partial<Omit<FilmDeLaBanque, "_id">> {
  _id: string;
  /** « zinema:<identifiant> » : le film vient de l'autre cinéma. */
  origineBanque?: string | null;
  /** Où en étaient les deux fiches la dernière fois (voir lireRepere). */
  banqueEmpreinte?: string | null;
}

/** Les champs qui décrivent un film : ceux qui se partagent. */
const CHAMPS_TEXTE = [
  "title",
  "director",
  "duration",
  "year",
  "country",
  "originalTitle",
  "language",
  "subtitles",
  "ageRating",
  "typeDeFilm",
  "synopsis",
  "trailerUrl",
  "presseUrl",
] as const;

const IMAGE = '{"id": asset._ref, "url": asset->url, "nom": asset->originalFilename, alt, hotspot, crop}';

const DESCRIPTION = `_id, title, director, duration, year, country, originalTitle, language, subtitles, ageRating,
    "typeDeFilm": coalesce(typeDeFilm, array::join(genres, " · ")),
    synopsis, trailerUrl, presseUrl, "slug": slug.current,
    "affiche": poster${IMAGE}, "photos": stillImages[defined(asset)]${IMAGE}`;

const PUBLIES = `_type == "film" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))`;

/** Les films publiés de l'autre cinéma, du plus récemment ajouté au plus ancien. */
export const REQUETE_BANQUE = `*[${PUBLIES}] | order(_createdAt desc){
    ${DESCRIPTION}
  }`;

/** Les films d'ici, lus de la même façon, avec ce que le partage y a noté. */
export const REQUETE_ICI = `*[${PUBLIES}]{
    ${DESCRIPTION}, origineBanque, banqueEmpreinte
  }`;

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
 * Le film d'ici LIÉ à ce film de l'autre cinéma : celui qui porte sa marque,
 * ou le même identifiant (un film arrive avec l'identifiant qu'il a chez
 * l'autre). Seule une fiche liée reçoit les corrections de l'autre cinéma.
 */
export function ficheLiee(film: FilmDeLaBanque, filmsDIci: readonly FilmDIci[]): FilmDIci | null {
  const origine = origineDe(film);
  return (
    filmsDIci.find((ici) => ici.origineBanque === origine) ?? filmsDIci.find((ici) => ici._id === film._id) ?? null
  );
}

/**
 * Le film d'ici qui correspond à ce film de l'autre cinéma, s'il y en a un :
 * la fiche liée, ou une fiche du même titre (saisie à la main des deux
 * côtés : elle empêche un doublon, mais reste indépendante).
 */
export function dejaIci(film: FilmDeLaBanque, filmsDIci: readonly FilmDIci[]): FilmDIci | null {
  const titre = titreCompare(film.title);
  return (
    ficheLiee(film, filmsDIci) ??
    (titre ? filmsDIci.find((ici) => titreCompare(ici.title) === titre) : undefined) ??
    null
  );
}

const propre = (valeur: string | null | undefined): string | undefined => {
  const texte = typeof valeur === "string" ? valeur.trim() : "";
  return texte || undefined;
};

/* ---------------- Comparer deux fiches ----------------
   Chaque fiche liée garde un repère : l'empreinte de la fiche de l'autre
   cinéma et celle de la fiche d'ici, telles qu'elles étaient la dernière
   fois qu'on les a accordées. On sait ainsi QUI a changé depuis, sans
   comparer les deux fiches entre elles (un même fichier d'image n'a pas
   toujours le même identifiant dans les deux projets). */

type Decrit = Partial<Omit<FilmDeLaBanque, "_id">>;

/** Ce qu'une fiche dit du film, mis à plat pour être comparé. */
function texteDe(film: Decrit): unknown[] {
  return CHAMPS_TEXTE.map((champ) => {
    const valeur = film[champ];
    return typeof valeur === "string" ? (propre(valeur) ?? null) : (valeur ?? null);
  });
}

/** Un code court pour un texte (cyrb53) : assez pour voir qu'une fiche a changé. */
function code(texte: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texte.length; i += 1) {
    const c = texte.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** L'empreinte d'une fiche : elle change dès qu'un champ partagé ou une image change. */
export function empreinte(film: Decrit): string {
  const images = [film.affiche ?? null, ...(film.photos ?? [])].map((image) =>
    image ? [image.id ?? null, propre(image.alt) ?? null] : null
  );
  return code(JSON.stringify([texteDe(film), images, (film.photos ?? []).length]));
}

/** « image-<empreinte>-400x570-jpg » → « 400x570-jpg ». */
function format(image: ImageDeLaBanque | null | undefined): string | null {
  if (!image?.id) return null;
  return image.id.match(/-(\d+x\d+-[a-z0-9]+)$/i)?.[1] ?? image.id;
}

/**
 * Les deux fiches disent-elles la même chose ? Mêmes textes, mêmes images.
 * « souple » : pour les films recopiés avant le partage, une image de mêmes
 * dimensions compte pour la même (elle avait été réenregistrée, son
 * identifiant diffère).
 */
export function memeFiche(autre: Decrit, ici: Decrit, souple: boolean): boolean {
  if (JSON.stringify(texteDe(autre)) !== JSON.stringify(texteDe(ici))) return false;
  const a = [autre.affiche ?? null, ...(autre.photos ?? [])];
  const b = [ici.affiche ?? null, ...(ici.photos ?? [])];
  if (a.length !== b.length) return false;
  return a.every((image, rang) => {
    const voisine = b[rang] ?? null;
    if (!image || !voisine) return !image && !voisine;
    if (image.id && image.id === voisine.id) return true;
    return souple && format(image) !== null && format(image) === format(voisine);
  });
}

/** Le repère d'une fiche liée : « <empreinte de l'autre>:<empreinte d'ici> ». */
function lireRepere(valeur: string | null | undefined): { autre: string; ici: string } | null {
  const [autre, ici, reste] = String(valeur ?? "").split(":");
  return ici !== undefined && reste === undefined ? { autre: autre ?? "", ici } : null;
}

function repere(autre: string, ici: string): string {
  return `${autre}:${ici}`;
}

/** Où en sont deux fiches liées. */
export type Etat =
  /** Rien n'a changé depuis la dernière fois. */
  | "a-jour"
  /** Elles disent la même chose, mais ce n'est pas encore noté. */
  | "a-noter"
  /** L'autre cinéma a corrigé sa fiche, celle d'ici n'a pas bougé : on reprend. */
  | "a-reprendre"
  /** La fiche d'ici a été modifiée, pas l'autre : on n'y touche pas. */
  | "modifiee-ici"
  /** Les deux ont changé (ou on ne sait pas laquelle) : une personne décide. */
  | "differente";

export function comparer(autre: FilmDeLaBanque, ici: FilmDIci): Etat {
  const note = lireRepere(ici.banqueEmpreinte);
  if (!note) return memeFiche(autre, ici, true) ? "a-noter" : "differente";
  const autreAChange = empreinte(autre) !== note.autre;
  const iciAChange = empreinte(ici) !== note.ici;
  if (!autreAChange && !iciAChange) return "a-jour";
  if (autreAChange && !iciAChange) return "a-reprendre";
  if (!autreAChange) return "modifiee-ici";
  /* Les deux ont changé… pour dire la même chose (l'autre cinéma a repris
     notre correction) : c'est accordé. */
  return memeFiche(autre, ici, false) ? "a-noter" : "differente";
}

/* ---------------- Écrire ici ---------------- */

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

/** Les champs qui décrivent le film, tels qu'on les écrit ici (les vides : undefined). */
function description(
  film: FilmDeLaBanque,
  afficheId: string | null,
  photosIds: readonly (string | null)[]
): Record<string, unknown> {
  const photos = (film.photos ?? [])
    .map((photo, rang) => (photosIds[rang] ? image(photo, photosIds[rang] as string, `photo${rang}`) : null))
    .filter((photo): photo is Record<string, unknown> => photo !== null);
  return {
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
    poster: film.affiche && afficheId ? image(film.affiche, afficheId) : undefined,
    stillImages: photos.length ? photos : undefined,
  };
}

/** La fiche de l'autre cinéma telle qu'elle est ICI une fois écrite : avec les images qui ont suivi. */
function telQuIci(film: FilmDeLaBanque, afficheId: string | null, photosIds: readonly (string | null)[]): Decrit {
  return {
    ...film,
    affiche: film.affiche && afficheId ? { ...film.affiche, id: afficheId } : null,
    photos: (film.photos ?? []).flatMap((photo, rang): ImageDeLaBanque[] => {
      const id = photosIds[rang];
      return id ? [{ ...photo, id }] : [];
    }),
  };
}

/**
 * Le repère à noter après une écriture : la fiche de l'autre cinéma telle
 * qu'on vient de la lire, et celle d'ici telle qu'on vient de l'écrire. Une
 * image qui n'a pas suivi n'est pas retentée toute seule : l'annonce le dit,
 * et on l'ajoute à la main.
 */
function repereApresEcriture(
  film: FilmDeLaBanque,
  afficheId: string | null,
  photosIds: readonly (string | null)[]
): string {
  return repere(empreinte(film), empreinte(telQuIci(film, afficheId, photosIds)));
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
  const fiche: Record<string, unknown> = {
    _id: film._id,
    _type: "film",
    ...description(film, afficheId, photosIds),
    slug: propre(film.slug) ? { _type: "slug", current: propre(film.slug) } : undefined,
    status: ETAT_A_L_ARRIVEE,
    statuts: [ETAT_A_L_ARRIVEE],
    origineBanque: origineDe(film),
    banqueEmpreinte: repereApresEcriture(film, afficheId, photosIds),
  };
  for (const champ of Object.keys(fiche)) if (fiche[champ] === undefined) delete fiche[champ];
  return fiche;
}

/** Ce qu'il faut pour lire : le client Sanity du Studio, ou celui de l'autre projet. */
export interface Lecteur {
  fetch: <T>(requete: string, parametres?: Record<string, unknown>, options?: Record<string, unknown>) => Promise<T>;
}

interface Retouche {
  set: (valeurs: Record<string, unknown>) => Retouche;
  unset: (champs: string[]) => Retouche;
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
 * Copie ici les images d'un film de l'autre cinéma. Une image déjà ici
 * (`dejaLa`, même fichier) n'est pas renvoyée. Une image qui ne se laisse
 * pas copier n'empêche pas le reste, et c'est compté.
 */
async function copierImages(
  client: Ecrivain,
  film: FilmDeLaBanque,
  telecharger: Telechargeur,
  dejaLa: ReadonlySet<string> = new Set()
): Promise<{ afficheId: string | null; photosIds: (string | null)[]; imagesManquantes: number }> {
  let imagesManquantes = 0;
  const copier = async (lue: ImageDeLaBanque | null): Promise<string | null> => {
    if (!lue?.url) return null;
    if (lue.id && dejaLa.has(lue.id)) return lue.id;
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
  return { afficheId, photosIds, imagesManquantes };
}

/**
 * Fait venir un film : copie son affiche et ses photos ici, puis crée sa
 * fiche, publiée, si elle n'existe pas déjà. Rend l'identifiant de la fiche.
 */
export async function faireVenir(
  client: Ecrivain,
  film: FilmDeLaBanque,
  telecharger: Telechargeur = telechargerImage
): Promise<{ id: string; imagesManquantes: number }> {
  const { afficheId, photosIds, imagesManquantes } = await copierImages(client, film, telecharger);
  const creee = await client.createIfNotExists(ficheAPartirDe(film, afficheId, photosIds));
  return { id: creee._id, imagesManquantes };
}

/** Le brouillon d'une fiche, s'il y en a un : il reçoit les mêmes corrections. */
const REQUETE_BROUILLON = `*[_id == $id][0]._id`;

/**
 * Reprend ici la fiche de l'autre cinéma : ce qui DÉCRIT le film est
 * remplacé (textes, affiche, photos) ; ce qui tient à ce cinéma (où en est
 * le film, ses séances, sa date de sortie, son invité, l'adresse de sa
 * page) ne bouge pas. Un champ vidé là-bas est vidé ici.
 *
 * Une image qui ne se laisse pas copier laisse l'ancienne en place.
 */
export async function reprendre(
  client: Ecrivain,
  film: FilmDeLaBanque,
  ici: FilmDIci,
  telecharger: Telechargeur = telechargerImage
): Promise<{ id: string; imagesManquantes: number }> {
  const dejaLa = new Set(
    [ici.affiche ?? null, ...(ici.photos ?? [])].map((img) => img?.id).filter((id): id is string => Boolean(id))
  );
  const copie = await copierImages(client, film, telecharger, dejaLa);
  /* L'affiche qui n'a pas suivi : on garde celle d'ici. */
  const afficheId = copie.afficheId ?? (film.affiche ? (ici.affiche?.id ?? null) : null);
  const champs = description(film, afficheId, copie.photosIds);
  /* Des photos qui n'ont pas toutes suivi : on garde celles d'ici. */
  const photosIncompletes = copie.photosIds.some((id) => id === null);
  if (photosIncompletes) delete champs.stillImages;
  const aEcrire: Record<string, unknown> = {};
  const aVider: string[] = [];
  for (const [champ, valeur] of Object.entries(champs)) {
    if (valeur !== undefined) aEcrire[champ] = valeur;
    else if (!(champ === "stillImages" && photosIncompletes)) aVider.push(champ);
  }
  /* Le repère : ce que la fiche d'ici dit maintenant. */
  const maintenant: Decrit = {
    ...telQuIci(film, afficheId, copie.photosIds),
    ...(photosIncompletes ? { photos: ici.photos ?? [] } : {}),
  };
  aEcrire.banqueEmpreinte = repere(empreinte(film), empreinte(maintenant));
  if (!ici.origineBanque) aEcrire.origineBanque = origineDe(film);

  const ecrire = (id: string) => {
    let retouche = client.patch(id).set(aEcrire);
    if (aVider.length) retouche = retouche.unset(aVider);
    return retouche.commit();
  };
  await ecrire(ici._id);
  const brouillon = `drafts.${ici._id}`;
  const existe = await client.fetch<string | null>(REQUETE_BROUILLON, { id: brouillon }, { perspective: "raw" });
  if (existe) await ecrire(brouillon);
  return { id: ici._id, imagesManquantes: copie.imagesManquantes };
}

/** Note sur une fiche d'ici que les deux fiches sont accordées. */
export async function noterAccord(client: Ecrivain, film: FilmDeLaBanque, ici: FilmDIci): Promise<void> {
  await client
    .patch(ici._id)
    .set({ banqueEmpreinte: repere(empreinte(film), empreinte(ici)) })
    .commit();
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
  /** Les fiches d'ici mises à jour d'après celles de l'autre cinéma. */
  misesAJour: { id: string; titre: string }[];
  /** Ce qui n'a pas pu être écrit (connexion, droits). */
  rates: number;
  /** Les images qui n'ont pas suivi. */
  imagesManquantes: number;
}

const titreDe = (film: FilmDeLaBanque): string => film.title?.trim() || "Film sans titre";

/**
 * L'arrivée des films : lit les films publiés de l'autre cinéma, crée ici
 * ceux qui manquent, et reprend ici les fiches que l'autre cinéma a
 * corrigées (si celle d'ici n'a pas bougé). Ne supprime rien, n'écrit rien
 * chez l'autre.
 *
 * Ce qui rate (connexion coupée) n'est pas noté : ce sera retenté la fois
 * suivante.
 */
export async function arriveeDesFilms(
  client: Ecrivain,
  autre: Lecteur,
  telecharger: Telechargeur = telechargerImage
): Promise<Bilan> {
  const [lus, lusIci, journal] = await Promise.all([
    autre.fetch<FilmDeLaBanque[]>(REQUETE_BANQUE),
    client.fetch<FilmDIci[]>(REQUETE_ICI, {}, { perspective: "published" }),
    client.fetch<string[] | null>(REQUETE_JOURNAL, { id: ID_JOURNAL }, { perspective: "raw" }),
  ]);
  const films = lus ?? [];
  const filmsDIci = lusIci ?? [];
  const { aFaireVenir, aNoter } = trier(films, filmsDIci, journal);
  const bilan: Bilan = { arrives: [], misesAJour: [], rates: 0, imagesManquantes: 0 };
  /* Un compte qui ne peut que lire : inutile d'essayer vingt fiches de suite. */
  let ecrites = 0;
  const peinePerdue = () => bilan.rates >= 3 && ecrites === 0;

  for (const film of aFaireVenir) {
    if (peinePerdue()) break;
    try {
      const { id, imagesManquantes } = await faireVenir(client, film, telecharger);
      bilan.arrives.push({ id, titre: titreDe(film) });
      bilan.imagesManquantes += imagesManquantes;
      ecrites += 1;
    } catch (cause) {
      console.error(`Films partagés : « ${film.title ?? film._id} » n'a pas pu arriver.`, cause);
      bilan.rates += 1;
    }
  }

  for (const film of films) {
    const ici = ficheLiee(film, filmsDIci);
    if (!ici) continue;
    const etat = comparer(film, ici);
    if (etat !== "a-noter" && etat !== "a-reprendre") continue;
    if (peinePerdue()) break;
    try {
      if (etat === "a-noter") await noterAccord(client, film, ici);
      if (etat === "a-reprendre") {
        const { imagesManquantes } = await reprendre(client, film, ici, telecharger);
        bilan.misesAJour.push({ id: ici._id, titre: titreDe(film) });
        bilan.imagesManquantes += imagesManquantes;
      }
      ecrites += 1;
    } catch (cause) {
      console.error(`Films partagés : « ${film.title ?? film._id} » n'a pas pu être mis à jour.`, cause);
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
