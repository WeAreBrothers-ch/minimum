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

function enumerer(films: Bilan["arrives"]): string {
  const titres = films.map((film) => `« ${film.titre} »`);
  if (titres.length === 1) return titres[0] as string;
  if (titres.length <= 3) return `${titres.slice(0, -1).join(", ")} et ${titres[titres.length - 1]}`;
  return `${titres.length} films`;
}

/** La phrase qui annonce une arrivée : « « Titre » est arrivé de Zinéma ». */
export function annonce(bilan: Bilan): string {
  const plusieurs = bilan.arrives.length > 1;
  return `${enumerer(bilan.arrives)} ${plusieurs ? "sont arrivés" : "est arrivé"} de ${AUTRE.nom}`;
}

/** La phrase qui annonce une correction reprise : « « Titre » : fiche mise à jour d'après Zinéma ». */
export function annonceMiseAJour(bilan: Bilan): string {
  const plusieurs = bilan.misesAJour.length > 1;
  return `${enumerer(bilan.misesAJour)} : ${plusieurs ? "fiches mises" : "fiche mise"} à jour d’après ${AUTRE.nom}`;
}
