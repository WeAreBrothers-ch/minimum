// @ts-check
/* Minimum : la disposition d’une grille d’affiches (Cinéma, Musique), sur grand
   écran. Règle : jamais de case vide en fin de grille.

   - On cherche un nombre de colonnes qui remplit la dernière rangée, avec des
     affiches de 11 à 22 rem de large (cinq films, cinq colonnes ; huit
     films, quatre colonnes), au besoin jusqu’à 8,5 rem ;
   - s’il y a moins de films que de colonnes possibles, la grille a autant de
     colonnes que de films, et des affiches de 22 rem au plus ;
   - sinon (sept soirées sur un petit écran d’ordinateur), les affiches
     passent en liste, comme sur téléphone : là non plus, aucun trou.
   Sur téléphone, c’est toujours la liste (css/cases.css). */

const LARGEUR_MIN = 11;
const LARGEUR_PLANCHER = 8.5;
const LARGEUR_MAX = 22;
const LARGEUR_IDEALE = 16;

/**
 * @param {number} nombre   Le nombre d’affiches.
 * @param {number} largeur  La largeur disponible, en rem.
 * @returns {number}  Le nombre de colonnes, ou 0 pour la liste.
 */
export function colonnesPour(nombre, largeur) {
  if (nombre <= 1) return 1;
  const moins = Math.max(1, Math.ceil(largeur / LARGEUR_MAX));
  if (nombre <= moins) return nombre;
  /** @param {number} minimum */
  const chercher = (minimum) => {
    const plus = Math.max(moins, Math.floor(largeur / minimum));
    let meilleur = 0;
    let ecart = Infinity;
    for (let c = moins; c <= Math.min(plus, nombre); c++) {
      if (nombre % c !== 0) continue;
      const e = Math.abs(largeur / c - LARGEUR_IDEALE);
      if (e < ecart) {
        meilleur = c;
        ecart = e;
      }
    }
    return meilleur;
  };
  return chercher(LARGEUR_MIN) || chercher(LARGEUR_PLANCHER);
}

/**
 * Règle --colonnes sur chaque grille de la zone, et la recalcule quand la
 * largeur change (fenêtre redimensionnée, onglet affiché). Renvoie de quoi
 * arrêter.
 * @param {HTMLElement} zone
 * @returns {() => void}
 */
export function ajusterGrilles(zone) {
  const grilles = [...zone.querySelectorAll(".carreaux")].filter((g) => g instanceof HTMLElement);
  if (grilles.length === 0 || !("ResizeObserver" in window)) return () => {};
  const rem = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  /** @param {HTMLElement} grille */
  const regler = (grille) => {
    /* La place disponible est celle du conteneur : la grille elle-même se
       rétrécit quand elle a peu de colonnes. */
    const largeur = (grille.parentElement ?? grille).clientWidth;
    if (largeur === 0) return;
    const nombre = grille.querySelectorAll(":scope > .carreau").length;
    const colonnes = colonnesPour(nombre, largeur / rem());
    grille.style.setProperty("--colonnes", String(Math.max(colonnes, 1)));
    grille.toggleAttribute("data-liste", colonnes === 0);
  };

  const observateur = new ResizeObserver((entrees) => {
    for (const entree of entrees) {
      for (const g of grilles) if (g.parentElement === entree.target || g === entree.target) regler(g);
    }
  });
  for (const g of grilles) {
    regler(g);
    observateur.observe(g.parentElement ?? g);
    observateur.observe(g);
  }
  return () => observateur.disconnect();
}
