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
 * @returns {void | Promise<void>}  Une promesse tenue quand la page a démarré.
 */

/** Le visiteur a demandé moins de mouvement : on change de page sans transition. */
const MOINS_DE_MOUVEMENT = window.matchMedia("(prefers-reduced-motion: reduce)");

/** La page actuellement affichée : chemin et paramètres (film/?id=…). */
let cheminAffiche = location.pathname + location.search;

/** @type {AuChangement | null} Branché par initNavigation. */
let surChangement = null;

/** Les pages déjà demandées : le doigt posé sur un lien la fait venir,
    avant même qu'il se lève. Une page n'est demandée qu'une fois. */
/** @type {Map<string, Promise<string>>} */
const pagesDemandees = new Map();

/**
 * Le HTML d'une page du site, depuis la mémoire ou le réseau.
 * @param {URL} url
 * @returns {Promise<string>}
 */
function texteDePage(url) {
  const cle = url.origin + url.pathname + url.search;
  let demande = pagesDemandees.get(cle);
  if (!demande) {
    demande = fetch(url, { headers: { Accept: "text/html" } }).then((reponse) => {
      if (!reponse.ok) throw new Error(`La page a répondu ${reponse.status}`);
      return reponse.text();
    });
    /* Un échec ne reste pas en mémoire : la prochaine fois, on réessaie. */
    demande.catch(() => pagesDemandees.delete(cle));
    pagesDemandees.set(cle, demande);
  }
  return demande;
}

/**
 * Commence à faire venir la page d'un lien du site, sans l'afficher.
 * @param {EventTarget | null} cible
 */
function precharger(cible) {
  const lien = cible instanceof Element ? cible.closest("a[href]") : null;
  if (!(lien instanceof HTMLAnchorElement) || (lien.target && lien.target !== "_self")) return;
  const url = new URL(lien.href);
  if (url.origin !== location.origin) return;
  if (url.pathname === location.pathname && url.search === location.search) return;
  if (!url.pathname.endsWith("/") && !url.pathname.endsWith(".html")) return;
  texteDePage(url).catch(() => {});
}

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
 * Charge les feuilles de style de la page suivante qui manquent à celle-ci,
 * et attend qu’elles soient prêtes : sans cela, une page qui a sa propre
 * feuille (Infos, par exemple) s’afficherait sans style quand on y arrive
 * depuis une autre page du site.
 * @param {Document} suivante
 * @param {URL} url  L’adresse de la page suivante, pour lire ses liens relatifs.
 * @returns {Promise<void>}
 */
async function chargerStyles(suivante, url) {
  /** @type {Map<string, Element>} */
  const presentes = new Map();
  for (const l of document.querySelectorAll('link[rel="stylesheet"]')) {
    if (l instanceof HTMLLinkElement) presentes.set(l.href, l);
  }
  /** @type {Promise<void>[]} */
  const attentes = [];
  /* Chaque feuille manquante se place juste après celle qui la précède
     dans la page suivante : l’ordre des feuilles, donc la priorité des
     règles, reste celui d’un chargement direct de la page. */
  /** @type {Element | null} */
  let precedente = null;
  for (const lien of suivante.querySelectorAll('link[rel="stylesheet"]')) {
    const href = new URL(lien.getAttribute("href") ?? "", url).href;
    let place = presentes.get(href) ?? null;
    if (!place) {
      const neuf = document.createElement("link");
      neuf.rel = "stylesheet";
      neuf.href = href;
      attentes.push(
        new Promise((fin) => {
          neuf.addEventListener("load", () => fin(), { once: true });
          neuf.addEventListener("error", () => fin(), { once: true });
        })
      );
      if (precedente) precedente.after(neuf);
      else document.head.append(neuf);
      presentes.set(href, neuf);
      place = neuf;
    }
    precedente = place;
  }
  await Promise.all(attentes);
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
    const suivante = new DOMParser().parseFromString(await texteDePage(url), "text/html");
    await chargerStyles(suivante, url);
    if (ajouterAHistorique) history.pushState(null, "", url);
    /* Change de page, puis attend qu’elle ait démarré (son code chargé, son
       contenu posé), sans jamais attendre plus d’une seconde. */
    const changer = async () => {
      const page = remplacer(suivante);
      cheminAffiche = url.pathname + url.search;
      const demarrage = auChangement(page);
      placer(url);
      await Promise.race([demarrage, new Promise((fin) => setTimeout(fin, 1000))]);
    };
    if (typeof document.startViewTransition === "function" && !MOINS_DE_MOUVEMENT.matches) {
      /* La nouvelle page se pose sur l’ancienne (css/animations.css).
         L’en-tête ne reste immobile que s’il est en vue en haut de l’écran :
         venu d’une page défilée, il glisserait depuis le haut. On attend que
         la page ait démarré, puis une tâche : le programme, déjà chargé, a
         rempli la page. (Pas requestAnimationFrame : l’affichage est
         suspendu pendant la transition, il n’arriverait jamais.) */
      const racine = document.documentElement;
      racine.classList.toggle("vt-entete", window.scrollY < 1);
      const transition = document.startViewTransition(async () => {
        await changer();
        await new Promise((fin) => setTimeout(fin, 0));
      });
      /* Une transition interrompue (clic rapide sur un autre lien) n’est pas
         une erreur : la page a changé quand même. */
      transition.ready.catch(() => {});
      transition.finished.catch(() => {}).finally(() => racine.classList.remove("vt-entete"));
      await transition.updateCallbackDone;
    } else {
      await changer();
    }
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

  /* Le doigt se pose, la souris s'approche, le clavier arrive sur un lien :
     la page suivante est déjà en route au moment du clic. */
  document.addEventListener("pointerdown", (e) => precharger(e.target), { passive: true });
  document.addEventListener("pointerover", (e) => precharger(e.target), { passive: true });
  document.addEventListener("focusin", (e) => precharger(e.target));

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
