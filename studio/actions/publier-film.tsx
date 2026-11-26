/* Minimum : publier un film. Comme le bouton « Publier » ordinaire, et en plus :
   si la fiche annonce une avant-première, une première ou une projection
   extraordinaire datée, sa séance est créée (ou déplacée) toute seule. */

import { useToast } from "@sanity/ui/toast";
import { type DocumentActionComponent, type SanityClient, useClient } from "sanity";
import { VERSION_API } from "../projet";
import { jourEnLettres } from "../schemaTypes/shared/heure";
import { type Ecrivain, type Issue, projectionAnnoncee, synchroniserProjection } from "./projection";

/** Attend que la fiche publiée existe : la séance y fait référence. */
async function attendrePublication(client: SanityClient, id: string, depuis: string): Promise<boolean> {
  for (let essai = 0; essai < 20; essai += 1) {
    const publie = await client.fetch<string | null>("*[_id == $id][0]._updatedAt", { id }, { perspective: "published" });
    if (publie && publie >= depuis) return true;
    await new Promise((suite) => setTimeout(suite, 750));
  }
  return false;
}

export function avecProjection(Publier: DocumentActionComponent): DocumentActionComponent {
  const PublierFilm: DocumentActionComponent = (props) => {
    const original = Publier(props);
    const client = useClient({ apiVersion: VERSION_API });
    const toast = useToast();
    if (!original) return null;
    return {
      ...original,
      onHandle: () => {
        const film = props.draft ?? props.published;
        const depuis = new Date(Date.now() - 2000).toISOString();
        original.onHandle?.();
        if (!film) return;
        const voulue = projectionAnnoncee(film);
        attendrePublication(client, props.id, depuis)
          .then((publie): Promise<Issue> | Issue => (publie ? synchroniserProjection(client as unknown as Ecrivain, props.id, film) : "rien"))
          .then((issue) => {
            if (issue === "rien") return;
            const quand = voulue ? `${jourEnLettres(voulue.date)} à ${voulue.heure}` : "";
            toast.push({
              status: "success",
              title: issue === "creee" ? "Séance créée" : issue === "deplacee" ? "Séance déplacée" : "Séance gardée au programme",
              description:
                issue === "liberee"
                  ? "La fiche n'annonce plus de projection : la séance reste, et se modifie désormais dans « Séances »."
                  : `La séance de la projection est au ${quand}. Elle se règle ici, dans la fiche du film.`,
            });
          })
          .catch((cause: unknown) => {
            console.error("Minimum : la séance de la projection n'a pas pu être mise à jour.", cause);
            toast.push({
              status: "error",
              title: "La séance n'a pas pu être créée",
              description: "Le film est publié, mais pas sa séance. Créez-la à la main dans « Séances », ou republiez la fiche.",
            });
          });
      },
    };
  };
  PublierFilm.displayName = "PublierFilm";
  PublierFilm.action = "publish";
  return PublierFilm;
}
