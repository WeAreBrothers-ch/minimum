/* Minimum : ce que le Studio lit pour préparer un post. Une requête par type de fiche. */

import type { SanityClient } from "sanity";
import { aujourdhui } from "../dates";
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

/* Les cases « Où en est ce film ? » : la liste « statuts », ou l'ancien champ « status »
   d'une fiche qui n'a pas été rouverte depuis (même règle que le Studio de Zinéma). */
const FILM = `{title, director, year, country, duration, language, "typeDeFilm": coalesce(typeDeFilm, array::join(genres, " · ")), synopsis,
  "statuts": coalesce(statuts, [status]), releaseDate, presence, ageRating, "poster": poster${IMAGE}, "photo": stillImages[0]${IMAGE},
  "seances": *[_type == "screening" && film._ref == ^._id && date >= $jour && status != "annule"] | order(date asc, time asc)[0...12]{date, time, versionNote}}`;
const LIVE = `{title, date, heure, description, video, "visuel": visuel${IMAGE}, "artiste": artiste->${ARTISTE}}`;
const EVENEMENT = `{title, typeEvenement, dateDebut, dateFin, excerpt, "image": coalesce(imageAccueil, image)${IMAGE}}`;

const REQUETES: Record<string, string> = {
  soiree: `*[_type == "soiree" && _id == $id][0]${SOIREE}`,
  artiste: `*[_type == "artiste" && _id == $id][0]{nom, role, instagram, bio, origine, styles, "photo": photo${IMAGE},
    "soirees": *[_type == "soiree" && references(^._id) && date >= $jour] | order(date asc)[0...6]${SOIREE}}`,
  film: `*[_type == "film" && _id == $id][0]${FILM}`,
  emission: `*[_type == "emission" && _id == $id][0]${LIVE}`,
  evenement: `*[_type == "evenement" && _id == $id][0]${EVENEMENT}`,
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

/* ------------------------------ Tout le programme, pour l'outil « Posts » ------------------------------ */

/** Un post de l'outil « Posts » : la proposition, et la fiche d'où elle vient. */
export interface PostDuProgramme extends Proposition {
  type: "soiree" | "emission" | "film" | "evenement";
  id: string;
  /** Le jour dont parle le post (AAAA-MM-JJ) : c'est lui qui range la liste. */
  jour: string;
}

export interface Rubrique {
  cle: "musique" | "cinema" | "evenements";
  titre: string;
  /** Ce qu'on lit quand la rubrique est vide. */
  vide: string;
  posts: PostDuProgramme[];
}

const PROGRAMME = `{
  "soirees": *[_type == "soiree" && date >= $jour && status != "annule"] | order(date asc)[0...8]{_id, ...${SOIREE}},
  "lives": *[_type == "emission" && date >= $jour] | order(date asc, heure asc)[0...8]{_id, ...${LIVE}},
  "films": *[_type == "film" && count(*[_type == "screening" && film._ref == ^._id && date >= $jour && date <= $fin && status != "annule"]) > 0] | order(title asc)[0...16]{_id, ...${FILM}},
  "evenements": *[_type == "evenement" && coalesce(dateFin, dateDebut) >= $jour && dateDebut <= $fin] | order(dateDebut asc)[0...8]{_id, ...${EVENEMENT}},
  "reglages": ${REGLAGES}
}`;

interface Lu {
  soirees: Array<Record<string, unknown> & { _id: string; date?: string }>;
  lives: Array<Record<string, unknown> & { _id: string; date?: string }>;
  films: Array<Record<string, unknown> & { _id: string; seances?: Array<{ date?: string }> }>;
  evenements: Array<Record<string, unknown> & { _id: string; dateDebut?: string }>;
  reglages: Reglages | null;
}

/** Ajoute des jours à une date « AAAA-MM-JJ ». */
function plusTard(iso: string, jours: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

/**
 * Tout ce qui peut se poster dans les semaines qui viennent, rangé par rubrique :
 * les soirées (la soirée entière, puis un post par artiste du line-up) et les
 * lives de la radio ; les films qui ont une séance ; les événements.
 * Seules les fiches PUBLIÉES sont proposées : on ne poste pas un brouillon.
 */
export async function chargerProgrammeAPoster(client: SanityClient, semaines = 4): Promise<Rubrique[]> {
  const jour = aujourdhui();
  const lu = await client.fetch<Lu>(PROGRAMME, { jour, fin: plusTard(jour, semaines * 7) }, { perspective: "published" });
  const r: Reglages = {
    compteInstagram: lu.reglages?.compteInstagram,
    hashtags: lu.reglages?.hashtags ?? REGLAGES_PAR_DEFAUT.hashtags,
    mentionBillets: lu.reglages?.mentionBillets ?? REGLAGES_PAR_DEFAUT.mentionBillets,
    nomRadio: lu.reglages?.nomRadio ?? REGLAGES_PAR_DEFAUT.nomRadio,
  };
  const musique: PostDuProgramme[] = [
    ...lu.soirees.flatMap((soiree) =>
      propositionsSoiree(soiree, r).map((p) => ({ ...p, cle: `${soiree._id}-${p.cle}`, type: "soiree" as const, id: soiree._id, jour: soiree.date ?? "" })),
    ),
    ...lu.lives.flatMap((live) =>
      propositionsEmission(live, r).map((p) => ({ ...p, cle: `${live._id}-${p.cle}`, type: "emission" as const, id: live._id, jour: live.date ?? "" })),
    ),
  ].sort((a, b) => a.jour.localeCompare(b.jour));
  const cinema: PostDuProgramme[] = lu.films
    .flatMap((film) =>
      /* Un post par film : celui de l'affiche. Le post « photo du film » reste dans l'onglet Instagram de la fiche. */
      propositionsFilm(film, r).slice(0, 1).map((p) => ({ ...p, cle: `${film._id}-${p.cle}`, type: "film" as const, id: film._id, jour: film.seances?.[0]?.date ?? "" })),
    )
    .sort((a, b) => a.jour.localeCompare(b.jour));
  const evenements: PostDuProgramme[] = lu.evenements.flatMap((evenement) =>
    propositionsEvenement(evenement, r).map((p) => ({ ...p, cle: `${evenement._id}-${p.cle}`, type: "evenement" as const, id: evenement._id, jour: evenement.dateDebut ?? "" })),
  );
  return [
    { cle: "musique", titre: "Musique : soirées, DJ et lives", vide: "Aucune soirée ni aucun live publié dans les semaines qui viennent.", posts: musique },
    { cle: "cinema", titre: "Cinéma : les films qui ont une séance", vide: "Aucun film n'a de séance dans les semaines qui viennent : programmez-les dans « Planification ».", posts: cinema },
    { cle: "evenements", titre: "Événements", vide: "Aucun événement publié dans les semaines qui viennent.", posts: evenements },
  ];
}
