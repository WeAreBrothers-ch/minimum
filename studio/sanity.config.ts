/* Minimum : le Studio. Cinéma, club et radio, dans un projet Sanity
   indépendant de celui de Zinéma (voir projet.ts). */

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { frFRLocale } from "@sanity/locale-fr-fr";
import { structureTool } from "sanity/structure";
import { BilletControle, MarquerRemboursee } from "./actions/commande";
import { PostInsta } from "./actions/post-insta";
import { TYPES_INSTAGRAM } from "./insta/requetes";
import { JEU, PROJET } from "./projet";
import { schemaTypes, UNIQUES } from "./schemaTypes";
import { defaultDocumentNode, structure } from "./structure";

/** Ce qu'on peut faire d'un document unique : pas le dupliquer, ni le supprimer. */
const ACTIONS_UNIQUES = new Set(["publish", "discardChanges", "restore"]);

export default defineConfig({
  name: "minimum",
  title: "Minimum",
  projectId: PROJET,
  dataset: JEU,
  plugins: [structureTool({ structure, defaultDocumentNode }), visionTool({ defaultApiVersion: "2026-11-01" }), frFRLocale()],
  schema: {
    types: schemaTypes,
    templates: (modeles) => [
      /* Ni document unique ni commande ne se créent depuis le bouton « + ». */
      ...modeles.filter((modele) => !UNIQUES.includes(modele.schemaType) && modele.schemaType !== "commande"),
      {
        id: "seance-du-film",
        title: "Séance de ce film",
        schemaType: "screening",
        parameters: [{ name: "filmId", type: "string" }],
        value: (parametres: { filmId: string }) => ({ film: { _type: "reference", _ref: parametres.filmId } }),
      },
    ],
  },
  document: {
    actions: (actions, { schemaType }) => {
      if (schemaType === "commande") return [BilletControle, MarquerRemboursee];
      if (UNIQUES.includes(schemaType)) return actions.filter(({ action }) => action && ACTIONS_UNIQUES.has(action));
      return TYPES_INSTAGRAM.includes(schemaType) ? [...actions, PostInsta] : actions;
    },
    newDocumentOptions: (options) =>
      options.filter((option) => !UNIQUES.includes(option.templateId) && option.templateId !== "commande"),
  },
});
