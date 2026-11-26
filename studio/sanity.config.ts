/* Minimum : le Studio. Cinéma, club et radio, dans un projet Sanity
   indépendant de celui de Zinéma (voir projet.ts). */

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { frFRLocale } from "@sanity/locale-fr-fr";
import { structureTool } from "sanity/structure";
import { BilletControle, MarquerRemboursee } from "./actions/commande";
import { PostInsta } from "./actions/post-insta";
import { avecProjection } from "./actions/publier-film";
import { TYPES_INSTAGRAM } from "./insta/requetes";
import { outilPlanning } from "./outils/planning";
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
  /* Le planning vient juste après « Structure ». */
  tools: (outils) => [...outils.slice(0, 1), outilPlanning, ...outils.slice(1)],
  schema: {
    types: schemaTypes,
    templates: (modeles) => [
      /* Une commande ne se crée jamais à la main. Les documents uniques gardent leur modèle
         (il porte leurs valeurs proposées d'office) ; c'est le bouton « + » qui ne les propose pas. */
      ...modeles.filter((modele) => modele.schemaType !== "commande"),
      {
        id: "seance-du-film",
        title: "Séance de ce film",
        schemaType: "screening",
        parameters: [{ name: "filmId", type: "string" }],
        value: (parametres: { filmId: string }) => ({ film: { _type: "reference", _ref: parametres.filmId } }),
      },
      /* Depuis le planning : une fiche créée directement à la bonne date. */
      ...[
        { id: "seance-du-jour", title: "Séance ce jour-là", schemaType: "screening" },
        { id: "soiree-du-jour", title: "Soirée ce jour-là", schemaType: "soiree" },
        { id: "live-du-jour", title: "Live ce jour-là", schemaType: "emission" },
      ].map((modele) => ({
        ...modele,
        parameters: [{ name: "date", type: "string" }],
        value: (parametres: { date: string }) => ({ date: parametres.date }),
      })),
    ],
  },
  document: {
    actions: (actions, { schemaType }) => {
      if (schemaType === "commande") return [BilletControle, MarquerRemboursee];
      if (UNIQUES.includes(schemaType)) return actions.filter(({ action }) => action && ACTIONS_UNIQUES.has(action));
      /* Publier un film crée ou déplace la séance de sa projection datée. */
      const adaptees = schemaType === "film" ? actions.map((action) => (action.action === "publish" ? avecProjection(action) : action)) : actions;
      return TYPES_INSTAGRAM.includes(schemaType) ? [...adaptees, PostInsta] : adaptees;
    },
    newDocumentOptions: (options) =>
      /* Le bouton « + » ne propose ni document unique, ni commande, ni les modèles réservés au planning. */
      options.filter((option) => !UNIQUES.includes(option.templateId) && option.templateId !== "commande" && !/-du-(jour|film)$/.test(option.templateId)),
  },
});
