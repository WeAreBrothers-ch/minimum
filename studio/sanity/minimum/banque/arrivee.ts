/* L'arrivée des films, vue du Studio : le client qui lit l'autre cinéma, et
   une seule arrivée à la fois (le Studio qui s'ouvre et l'écran « Films
   partagés » peuvent la demander au même moment). */
import { createClient } from "@sanity/client";

import { type Bilan, type Ecrivain, arriveeDesFilms } from "./partage";
import { AUTRE, VERSION_API_BANQUE } from "./reglages";

/* L'autre cinéma, en lecture seule : ni jeton, ni identifiants. On n'y lit
   que ce qui est publié, par l'API publique, comme son site. */
export const autreCinema = createClient({
  projectId: AUTRE.projet,
  dataset: AUTRE.jeu,
  apiVersion: VERSION_API_BANQUE,
  useCdn: true,
  withCredentials: false,
  perspective: "published",
});

let enCours: Promise<Bilan> | null = null;

/** Lance l'arrivée, ou rejoint celle qui est déjà en route. */
export function lancerArrivee(client: unknown): Promise<Bilan> {
  if (!enCours) {
    enCours = arriveeDesFilms(client as Ecrivain, autreCinema).finally(() => {
      enCours = null;
    });
  }
  return enCours;
}

/** La phrase qui annonce une arrivée : « « Titre » est arrivé de Zinéma ». */
export function annonce(bilan: Bilan): string {
  const titres = bilan.arrives.map((film) => `« ${film.titre} »`);
  if (titres.length === 1) return `${titres[0]} est arrivé de ${AUTRE.nom}`;
  if (titres.length <= 3) return `${titres.slice(0, -1).join(", ")} et ${titres[titres.length - 1]} sont arrivés de ${AUTRE.nom}`;
  return `${titres.length} films sont arrivés de ${AUTRE.nom}`;
}
