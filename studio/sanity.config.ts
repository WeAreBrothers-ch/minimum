import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes, typesNonCreables, typesUniques } from "./sanity/schemaTypes";
import { actionsRetirees } from "./sanity/actionsRetirees";
import { defaultDocumentNode, deskStructure } from "./sanity/deskStructure";
import { planification } from "./sanity/plugins/planification";
import { BilletControle, MarquerRemboursee } from "./sanity/minimum/actions/commande";
import { PostInsta } from "./sanity/minimum/actions/post-insta";
import { TYPES_INSTAGRAM } from "./sanity/minimum/insta/requetes";
import { posts } from "./sanity/minimum/posts";
import { JEU, PROJET } from "./sanity/projet";

/* Le Studio de Minimum.

   C'est le Studio de Zinéma — même menu, même onglet Planification, mêmes
   fiches, mêmes gestes : la même personne gère les deux cinémas — sur un
   projet Sanity INDÉPENDANT (sanity/projet.ts). S'y ajoute ce qui n'existe
   qu'à Minimum : la Musique (soirées du club, lives de la radio, artistes)
   et les posts Instagram (onglet « Posts », onglet « Instagram » d'une fiche).

   Le code repris de Zinéma est dans sanity/ tel quel, adapté le moins
   possible ; ce qui est propre à Minimum est dans sanity/minimum/. */
export default defineConfig({
  name: "minimum",
  title: "Minimum",
  projectId: PROJET,
  dataset: JEU,
  schema: {
    types: schemaTypes,
    // Retire des modèles de création les commandes de billetterie, créées
    // par le serveur. Les fiches uniques gardent leur modèle (il porte leurs
    // valeurs proposées d'office) : c'est le bouton « + » qui ne les
    // propose pas.
    templates: (modeles) => modeles.filter((modele) => modele.schemaType !== "commande"),
  },
  document: {
    // Le bouton « + » ne propose que ce qui se crée vraiment à la main.
    newDocumentOptions: (options) =>
      options.filter((option) => !typesNonCreables.includes(option.templateId)),
    // Fiches uniques et commandes : certaines actions sont retirées,
    // voir sanity/actionsRetirees.ts.
    actions: (actions, { schemaType }) => {
      const retirees = actionsRetirees(schemaType, typesUniques);
      const gardees = actions.filter(
        (action) => !retirees.includes((action as { action?: string }).action ?? "")
      );
      /* Propre à Minimum : le contrôle d'entrée et le remboursement d'une
         commande ; le post Instagram d'une fiche, en un clic. */
      if (schemaType === "commande") return [BilletControle, MarquerRemboursee, ...gardees];
      return TYPES_INSTAGRAM.includes(schemaType) ? [...gardees, PostInsta] : gardees;
    },
  },
  plugins: [
    structureTool({ name: "structure", title: "Contenu", structure: deskStructure, defaultDocumentNode }),
    planification(),
    posts(),
    visionTool({ name: "vision", title: "Requêtes", defaultApiVersion: "2024-06-01" }),
  ],
});
