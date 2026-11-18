// @ts-check
/* Minimum : les cases apparaissent en cascade quand elles entrent dans
   l’écran. Ce fichier ne fait que poser deux classes ; le mouvement lui-même
   est dans css/animations.css.

   - une case déjà visible au chargement entre tout de suite, après celles
     qui la précèdent (--i) ;
   - une case plus bas attend, invisible (.a-attente), et entre quand on y
     arrive en faisant défiler.

   Les pages remplissent leur contenu après coup (programme chargé, onglets) :
   on regarde donc ce qui s’ajoute à la page. Rien de tout cela si le
   visiteur a demandé moins de mouvement. */

/** Ce qui entre en cascade : les cases des tableaux, jamais le mur ni le bureau. */
const CIBLES = [
  ".onglets",
  ".carreau",
  ".info",
  ".rdv__jour",
  ".rdv",
  ".detail > *",
  ".photos__case",
  ".fiche",
].join(", ");

/** Au-delà, la cascade attendrait trop : les suivantes entrent ensemble. */
const RANG_MAX = 6;

/** @type {IntersectionObserver | null} */
let observateur = null;
let prevu = false;

/**
 * Fait entrer une case, avec son rang dans la cascade.
 * @param {HTMLElement} el
 * @param {number} rang
 */
function entrer(el, rang) {
  el.style.setProperty("--i", String(Math.min(rang, RANG_MAX)));
  el.classList.remove("a-attente");
  el.classList.add("a-entree");
}

/** Repère les nouvelles cases de la page et les prépare. */
function scruter() {
  prevu = false;
  if (!observateur) return;
  let rang = 0;
  for (const el of document.querySelectorAll(CIBLES)) {
    if (!(el instanceof HTMLElement) || el.dataset.anime) continue;
    if (el.closest(".bureau, .moitie__colonnes, [hidden]")) continue;
    el.dataset.anime = "1";
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      entrer(el, rang);
      rang += 1;
    } else {
      el.classList.add("a-attente");
      observateur.observe(el);
    }
  }
}

function planifier() {
  if (prevu) return;
  prevu = true;
  requestAnimationFrame(scruter);
}

/** À appeler une fois : la suite se fait toute seule, page après page. */
export function initAnimations() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  observateur = new IntersectionObserver(
    (entrees) => {
      const visibles = entrees
        .filter((e) => e.isIntersecting)
        .map((e) => e.target)
        .filter((el) => el instanceof HTMLElement)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      visibles.forEach((el, rang) => {
        observateur?.unobserve(el);
        if (el instanceof HTMLElement) entrer(el, rang);
      });
    },
    { rootMargin: "0px 0px -6% 0px" }
  );

  /* Seul le contenu de la page compte ; le bureau de la radio (horloge,
     playlist) change sans cesse et n'a rien à faire entrer. */
  new MutationObserver((changements) => {
    if (changements.some((c) => !(c.target instanceof Element) || !c.target.closest(".bureau"))) planifier();
  }).observe(document.body, { childList: true, subtree: true });
  scruter();
}
