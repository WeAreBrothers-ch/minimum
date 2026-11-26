import { defineCliConfig } from "sanity/cli";
import { JEU, PROJET } from "./projet";

export default defineCliConfig({
  api: { projectId: PROJET, dataset: JEU },
  deployment: { autoUpdates: true },
});
