/* Lance toutes les vérifications du Studio de Minimum, l'une après l'autre.
   Pour lancer :  npm test */
import {spawnSync} from 'node:child_process'

const FICHIERS = ['une-salle.mjs', 'projection.mjs', 'banque.mjs', 'historique.mjs', 'impression.mjs', 'actions-studio.mjs']
let echecs = 0
for (const fichier of FICHIERS) {
  const chemin = new URL(fichier, import.meta.url).pathname
  const {status} = spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', chemin], {stdio: 'inherit'})
  if (status !== 0) {
    echecs += 1
    console.error(`✗ ${fichier} a échoué.`)
  }
}
process.exit(echecs > 0 ? 1 : 0)
