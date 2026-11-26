import { defineField, defineType } from "sanity";

import { AUTRE, TYPE_JOURNAL } from "../banque/reglages";

/* Le carnet des films partagés : la liste des films de l'autre cinéma déjà
   venus ici. Le Studio le tient seul (minimum/banque/partage.ts) ; il sert
   à ne pas faire revenir un film qu'on a supprimé ici. Personne ne le crée
   ni ne le modifie à la main : il n'est dans aucun menu. */
export const journalBanque = defineType({
  name: TYPE_JOURNAL,
  title: "Carnet des films partagés",
  type: "document",
  readOnly: true,
  // Hors de la recherche du Studio.
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: "films",
      title: `Films de ${AUTRE.nom} déjà venus ici`,
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
  preview: { prepare: () => ({ title: "Carnet des films partagés" }) },
});
