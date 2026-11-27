// Minimum : déclare en tête de chaque page les modules JavaScript dont elle
// a besoin (<link rel="modulepreload">) : ceux de main.js, et ceux de la page
// elle-même (main.js charge le code de chaque page à la demande). Sans cela,
// le navigateur découvre les modules les uns après les autres (main.js, puis
// ce qu'il importe, puis ce que ces fichiers importent…) : sur un téléphone,
// les affiches arrivaient une seconde plus tard.
//
// À relancer quand on ajoute ou retire un module : npm run precharger

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
/** Chaque page, et le module qui la lance (null : la page n'a pas de code propre). */
const PAGES = {
  "index.html": "js/accueil.js",
  "cinema/index.html": "js/pages/cinema.js",
  "musique/index.html": "js/pages/musique.js",
  "agenda/index.html": "js/pages/agenda.js",
  "infos/index.html": "js/pages/infos.js",
  "film/index.html": "js/pages/film.js",
  "soiree/index.html": "js/pages/soiree.js",
  "billet/index.html": "js/pages/billet.js",
};
const DEBUT = "  <!-- modules : npm run precharger -->\n";
const FIN = "  <!-- /modules -->\n";

/**
 * Les modules atteints depuis ces points de départ par des imports statiques,
 * dans l'ordre où on les découvre.
 * @param {string[]} departs
 */
function modules(departs) {
  const vus = [];
  const file = [...departs];
  while (file.length) {
    const fichier = file.shift();
    if (vus.includes(fichier)) continue;
    vus.push(fichier);
    const source = readFileSync(join(RACINE, fichier), "utf8");
    for (const m of source.matchAll(/^\s*import\s+(?:[^"']*?from\s+)?["'](\.[^"']+)["']/gm)) {
      file.push(normalize(join(dirname(fichier), m[1])).replaceAll("\\", "/"));
    }
  }
  return vus;
}

let total = 0;
for (const [page, module] of Object.entries(PAGES)) {
  const liste = modules(module ? ["js/main.js", module] : ["js/main.js"]);
  total += liste.length;
  const chemin = join(RACINE, page);
  let html = readFileSync(chemin, "utf8");
  const vers = relative(dirname(chemin), RACINE).replaceAll("\\", "/");
  const prefixe = vers ? `${vers}/` : "";
  const bloc = DEBUT + liste.map((m) => `  <link rel="modulepreload" href="${prefixe}${m}" />\n`).join("") + FIN;
  if (html.includes(DEBUT)) {
    html = html.slice(0, html.indexOf(DEBUT)) + bloc + html.slice(html.indexOf(FIN) + FIN.length);
  } else {
    html = html.replace("</head>", `${bloc}</head>`);
  }
  writeFileSync(chemin, html);
}
console.log(`${Object.keys(PAGES).length} pages, ${Math.round(total / Object.keys(PAGES).length)} modules par page en moyenne.`);
