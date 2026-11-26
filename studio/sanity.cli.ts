import { defineCliConfig } from "sanity/cli";
import { JEU, PROJET } from "./projet";

export default defineCliConfig({
  api: { projectId: PROJET, dataset: JEU },
  /* L'adresse du Studio en ligne : https://cine-minimum.sanity.studio */
  studioHost: "cine-minimum",
  /* appId : l'identifiant du Studio en ligne, pour que « npm run deploy » le mette à jour au lieu d'en créer un autre. */
  deployment: { autoUpdates: true, appId: "zatp3vqamn0brwy2qkqoa4rv" },
});
