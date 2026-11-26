/* Minimum : ce que le Studio lit pour préparer un post. Une requête par type de fiche. */

import type { SanityClient } from "sanity";
import { aujourdhui } from "../schemaTypes/shared/heure";
import {
  type Proposition,
  REGLAGES_PAR_DEFAUT,
  type Reglages,
  propositionsArtiste,
  propositionsEmission,
  propositionsEvenement,
  propositionsFilm,
  propositionsSoiree,
} from "./propositions";

const IMAGE = '{"url": asset->url, "fx": hotspot.x, "fy": hotspot.y, "largeur": asset->metadata.dimensions.width}';
const ARTISTE = `{nom, role, instagram, bio, origine, styles, "photo": photo${IMAGE}}`;
const SOIREE = `{title, date, ouverture, fin, age, genreMusical, description, status, "affiche": affiche${IMAGE},
  "lineUp": lineUp[]{debut, precision, "artiste": artiste->${ARTISTE}}, "tarifs": tarifs[]{libelle, prix}}`;

const REQUETES: Record<string, string> = {
  soiree: `*[_type == "soiree" && _id == $id][0]${SOIREE}`,
  artiste: `*[_type == "artiste" && _id == $id][0]{nom, role, instagram, bio, origine, styles, "photo": photo${IMAGE},
    "soirees": *[_type == "soiree" && references(^._id) && date >= $jour] | order(date asc)[0...6]${SOIREE}}`,
  film: `*[_type == "film" && _id == $id][0]{title, director, year, country, duration, language, typeDeFilm, synopsis, mention,
    statuts, releaseDate, presence, ageRating, "poster": poster${IMAGE}, "photo": stillImages[0]${IMAGE},
    "seances": *[_type == "screening" && film._ref == ^._id && date >= $jour && status != "annule"] | order(date asc, time asc)[0...12]{date, time, versionNote}}`,
  emission: `*[_type == "emission" && _id == $id][0]{title, date, heure, description, video,
    "visuel": visuel${IMAGE}, "artiste": artiste->${ARTISTE}}`,
  evenement: `*[_type == "evenement" && _id == $id][0]{title, typeEvenement, dateDebut, dateFin, excerpt, "image": coalesce(imageAccueil, image)${IMAGE}}`,
};

const REGLAGES = '*[_id == "reglagesMinimum"][0]{compteInstagram, hashtags, mentionBillets, nomRadio}';

/** Les types de fiche pour lesquels le Studio sait préparer un post. */
export const TYPES_INSTAGRAM = Object.keys(REQUETES);

/**
 * Les posts possibles pour une fiche. Lit la version en cours d'écriture
 * (le brouillon s'il y en a un) : on peut préparer le post avant de publier.
 * null : la fiche n'existe pas encore (rien n'a été saisi).
 */
export async function chargerPropositions(client: SanityClient, type: string, id: string): Promise<Proposition[] | null> {
  const requete = REQUETES[type];
  if (!requete) throw new Error(`Pas de post Instagram pour le type « ${type} ».`);
  const { fiche, reglages } = await client.fetch<{ fiche: Record<string, unknown> | null; reglages: Reglages | null }>(
    `{"fiche": ${requete}, "reglages": ${REGLAGES}}`,
    { id: id.replace(/^drafts\./, ""), jour: aujourdhui() },
    { perspective: "drafts" },
  );
  if (!fiche) return null;
  const r: Reglages = {
    compteInstagram: reglages?.compteInstagram,
    hashtags: reglages?.hashtags ?? REGLAGES_PAR_DEFAUT.hashtags,
    mentionBillets: reglages?.mentionBillets ?? REGLAGES_PAR_DEFAUT.mentionBillets,
    nomRadio: reglages?.nomRadio ?? REGLAGES_PAR_DEFAUT.nomRadio,
  };
  switch (type) {
    case "soiree":
      return propositionsSoiree(fiche, r);
    case "artiste":
      return propositionsArtiste(fiche, r);
    case "film":
      return propositionsFilm(fiche, r);
    case "emission":
      return propositionsEmission(fiche, r);
    default:
      return propositionsEvenement(fiche, r);
  }
}
