// @ts-check
/* Minimum : changer de page sans couper la radio.

   Un clic sur un lien du site va chercher la page suivante et remplace
   l’en-tête, le contenu et le pied de page ; le son de la radio, lui, vit
   dans lecteur.js et ne s’arrête pas.
   Si quoi que ce soit échoue, on retombe sur une navigation classique :
   la page change quand même (le son, lui, s’arrête). */

/**
 * @callback AuChangement
 * @param {string} page  La valeur de data-page de la nouvelle page.
 * @returns {void}
 */

/** La page actuellement affichée : chemin et paramètres (film/?id=…). */
let cheminAffiche = location.pathname + location.search;

/** @type {AuChangement | null} Branché par initNavigation. */
let surChangement = null;

/**
 * Ce lien mène-t-il à une page du site qu’on peut charger nous-mêmes ?
 * @param {HTMLAnchorElement} lien
 * @param {MouseEvent} e
 * @returns {boolean}
 */
function estInterne(lien, e) {
  if (e.defaultPrevented || e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (lien.target && lien.target !== "_self") return false;
  if (lien.hasAttribute("download")) return false;
  const url = new URL(lien.href);
  if (url.origin !== location.origin) return false;
  const memePage = url.pathname === location.pathname && url.search === location.search;
  if (memePage && url.hash) return false;
  return url.pathname.endsWith("/") || url.pathname.endsWith(".html");
}

/**
 * Remplace l’en-tête, le contenu et les réglages de page.
 * @param {Document} suivante
 * @returns {string} La nouvelle page.
 */
function remplacer(suivante) {
  const entete = document.querySelector(".entete");
  const contenu = document.querySelector("main");
  const nouvelEntete = suivante.querySelector(".entete");
  const nouveauContenu = suivante.querySelector("main");
  if (!entete || !contenu || !nouvelEntete || !nouveauContenu) {
    throw new Error("Page incomplète : en-tête ou contenu introuvable.");
  }
  entete.replaceWith(document.adoptNode(nouvelEntete));
  contenu.replaceWith(document.adoptNode(nouveauContenu));
  /* Le pied de page vit hors du contenu, et l'accueil n'en a pas. */
  const pied = document.querySelector(".pied");
  const nouveauPied = suivante.querySelector(".pied");
  if (nouveauPied) {
    const neuf = document.adoptNode(nouveauPied);
    if (pied) pied.replaceWith(neuf);
    else nouveauContenu.after(neuf);
  } else {
    pied?.remove();
  }
  document.title = suivante.title;
  const description = suivante.querySelector('meta[name="description"]');
  const actuelle = document.querySelector('meta[name="description"]');
  if (description && actuelle) actuelle.setAttribute("content", description.getAttribute("content") ?? "");
  document.body.dataset.page = suivante.body.dataset.page ?? "";
  document.body.dataset.racine = suivante.body.dataset.racine ?? "";
  return document.body.dataset.page;
}

/**
 * Place la lecture : sur l’ancre demandée, sinon en haut.
 * @param {URL} url
 */
function placer(url) {
  const cible = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
  if (cible) cible.scrollIntoView();
  else window.scrollTo(0, 0);
  const contenu = document.querySelector("main");
  if (contenu instanceof HTMLElement) contenu.focus({ preventScroll: true });
}

/**
 * Charge une page et l’affiche.
 * @param {URL} url
 * @param {boolean} ajouterAHistorique
 * @param {AuChangement} auChangement
 */
async function charger(url, ajouterAHistorique, auChangement) {
  try {
    const reponse = await fetch(url, { headers: { Accept: "text/html" } });
    if (!reponse.ok) throw new Error(`La page a répondu ${reponse.status}`);
    const suivante = new DOMParser().parseFromString(await reponse.text(), "text/html");
    if (ajouterAHistorique) history.pushState(null, "", url);
    const page = remplacer(suivante);
    cheminAffiche = url.pathname + url.search;
    auChangement(page);
    placer(url);
  } catch (erreur) {
    console.warn("Minimum : navigation classique à la place.", erreur);
    location.assign(url);
  }
}

/**
 * Active la navigation qui garde la radio.
 * @param {AuChangement} auChangement Appelé après chaque changement de page.
 */
export function initNavigation(auChangement) {
  surChangement = auChangement;
  document.addEventListener("click", (e) => {
    const cible = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!(cible instanceof HTMLAnchorElement) || !estInterne(cible, e)) return;
    e.preventDefault();
    void charger(new URL(cible.href), true, auChangement);
  });

  /* Retour arrière : seulement si la page change, pas pour une ancre. */
  window.addEventListener("popstate", () => {
    if (location.pathname + location.search === cheminAffiche) return;
    void charger(new URL(location.href), false, auChangement);
  });
}

/**
 * Change de page depuis le code, comme un clic sur un lien : la radio continue.
 * @param {string} adresse  Relative à la page actuelle.
 */
export function naviguer(adresse) {
  const url = new URL(adresse, location.href);
  if (surChangement) void charger(url, true, surChangement);
  else location.assign(url);
}
