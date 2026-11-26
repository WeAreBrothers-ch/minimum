import { defineCliConfig } from "sanity/cli";
import { JEU, PROJET } from "./sanity/projet";

/* Le projet Sanity de Minimum est FIXE (voir sanity/projet.ts), comme celui
   de Zinéma l'est dans son propre dépôt : un réglage oublié sur une machine
   ne doit jamais pouvoir faire éditer le mauvais projet sans prévenir. */
export default defineCliConfig({
  api: { projectId: PROJET, dataset: JEU },
  /** Adresse en ligne du Studio : https://cine-minimum.sanity.studio */
  studioHost: "cine-minimum",
});
