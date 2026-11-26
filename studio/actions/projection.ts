/* Minimum : la projection annoncée par la fiche d'un film (avant-première, première,
   projection extraordinaire). Publier la fiche crée sa séance, ou la déplace.
   Ce fichier ne dépend de rien : il se vérifie seul (outils/verifier-projection.mjs). */

export const PROJECTIONS = ["avant-premiere", "premiere", "projection-extraordinaire"];

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** La fiche d'un film, telle que publiée : on n'en lit que statuts, projectionDate et projectionHeure. */
export type FilmPublie = Record<string, unknown>;

export interface Projection {
  genre: string;
  date: string;
  heure: string;
}

export interface SeanceAnnoncee {
  _id: string;
  date?: string;
  time?: string;
  evenementDuFilm?: string;
}

/** Ce qu'il faut pour lire et écrire les séances : le client Sanity du Studio le fournit. */
export interface Ecrivain {
  fetch: (requete: string, parametres: Record<string, unknown>) => Promise<SeanceAnnoncee[]>;
  create: (document: Record<string, unknown>) => Promise<unknown>;
  patch: (id: string) => { set: (champs: Record<string, unknown>) => { commit: () => Promise<unknown> }; unset: (champs: string[]) => { commit: () => Promise<unknown> } };
}

/** La projection que la fiche annonce ; null si aucune case n'est cochée ou si le jour ou l'heure manque. */
export function projectionAnnoncee(film: FilmPublie): Projection | null {
  const statuts = Array.isArray(film.statuts) ? film.statuts : [];
  const genre = PROJECTIONS.find((p) => statuts.includes(p));
  const { projectionDate: date, projectionHeure: heure } = film;
  if (!genre || typeof date !== "string" || !DATE.test(date) || typeof heure !== "string" || !HEURE.test(heure)) return null;
  return { genre, date, heure };
}

export type Issue = "creee" | "deplacee" | "liberee" | "rien";

/**
 * Met la séance annoncée en accord avec la fiche du film qui vient d'être publiée.
 * - Projection annoncée, pas encore de séance : elle est créée.
 * - Séance déjà là, jour ou heure changés : elle est déplacée.
 * - Plus de projection annoncée : la séance reste au programme, mais redevient
 *   une séance ordinaire, modifiable à la main. Rien n'est jamais supprimé.
 */
export async function synchroniserProjection(client: Ecrivain, filmId: string, film: FilmPublie): Promise<Issue> {
  const voulue = projectionAnnoncee(film);
  const seances = await client.fetch(
    '*[_type == "screening" && film._ref == $film && defined(evenementDuFilm) && !(_id in path("drafts.**"))] | order(_createdAt asc){_id, date, time, evenementDuFilm}',
    { film: filmId },
  );
  const seance = seances[0];
  if (!voulue) {
    if (!seance) return "rien";
    await client.patch(seance._id).unset(["evenementDuFilm"]).commit();
    return "liberee";
  }
  if (!seance) {
    await client.create({
      _type: "screening",
      film: { _type: "reference", _ref: filmId },
      date: voulue.date,
      time: voulue.heure,
      status: "disponible",
      evenementDuFilm: voulue.genre,
    });
    return "creee";
  }
  if (seance.date === voulue.date && seance.time === voulue.heure && seance.evenementDuFilm === voulue.genre) return "rien";
  await client.patch(seance._id).set({ date: voulue.date, time: voulue.heure, evenementDuFilm: voulue.genre }).commit();
  return "deplacee";
}
