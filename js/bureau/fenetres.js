// @ts-check
/* Minimum Radio : les fenêtres du bureau.

   Ouvrir, fermer, réduire dans la barre des tâches, passer devant les
   autres, et, sur un écran assez large, les déplacer à la barre de titre.
   Sur téléphone, une fenêtre prend toute la largeur : on ne la déplace pas,
   on la ferme ou on la réduit. */

import { echapper } from "../format.js";
import { icone } from "./icones.js";

/**
 * @typedef {Object} Definition
 * @property {string} id
 * @property {string} titre
 * @property {string} court      Le nom dans la barre des tâches, en un ou deux mots.
 * @property {string} icone      Le nom d'une icône (icones.js).
 * @property {string} contenu    Le HTML du corps de la fenêtre.
 * @property {number} [largeur]  En pixels, sur grand écran.
 * @property {(corps: HTMLElement) => (void | (() => void))} [monter]
 *   Branche le contenu ; peut renvoyer de quoi le débrancher.
 */

/**
 * @typedef {Object} Fenetre
 * @property {Definition} def
 * @property {HTMLElement} el
 * @property {HTMLButtonElement} onglet
 * @property {"ouverte" | "reduite" | "fermee"} etat
 * @property {(() => void) | null} demonter
 */

/** Le visiteur a demandé moins de mouvement : les fenêtres disparaissent d’un coup. */
const MOINS_DE_MOUVEMENT = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Largeur à partir de laquelle on peut déplacer les fenêtres (40rem). */
const GRAND_ECRAN = "(min-width: 40rem)";
const DECALAGE = 28;
/** Les fenêtres commencent à droite de la colonne d’icônes, à ce haut. */
const GAUCHE = 150;
const HAUT = 24;
/** L’écart entre deux fenêtres posées côte à côte. */
const ESPACE = 16;

/**
 * @param {{ fenetres: HTMLElement, onglets: HTMLElement }} zones
 *   `fenetres` : le calque où se posent les fenêtres ; `onglets` : la rangée
 *   de la barre des tâches.
 */
export function creerFenetres({ fenetres: calque, onglets }) {
  /** @type {Map<string, Fenetre>} */
  const toutes = new Map();
  const grand = window.matchMedia(GRAND_ECRAN);
  let devant = 10;
  let actif = "";
  let ouvertes = 0;

  /**
   * Cache une fenêtre, après sa petite sortie animée (css/animations.css).
   * Si on la rouvre entre-temps, elle reste visible.
   * @param {Fenetre} f
   */
  function cacher(f) {
    if (MOINS_DE_MOUVEMENT.matches) {
      f.el.hidden = true;
      return;
    }
    const fin = () => {
      f.el.classList.remove("fenetre--sort");
      if (f.etat !== "ouverte") f.el.hidden = true;
    };
    f.el.classList.add("fenetre--sort");
    /** @param {AnimationEvent} e */
    const aLaFin = (e) => {
      if (e.target !== f.el) return;
      f.el.removeEventListener("animationend", aLaFin);
      fin();
    };
    f.el.addEventListener("animationend", aLaFin);
    /* Filet de sécurité, si l’animation ne se termine pas (onglet en fond). */
    window.setTimeout(() => {
      f.el.removeEventListener("animationend", aLaFin);
      if (f.el.classList.contains("fenetre--sort")) fin();
    }, 400);
  }

  /** @param {string} id */
  function activer(id) {
    actif = id;
    devant += 1;
    for (const [cle, f] of toutes) {
      const estActif = cle === id && f.etat === "ouverte";
      f.el.classList.toggle("fenetre--active", estActif);
      f.onglet.setAttribute("aria-pressed", String(estActif));
    }
    const f = toutes.get(id);
    if (f) f.el.style.zIndex = String(devant);
  }

  /** @param {string} id */
  function fermer(id) {
    const f = toutes.get(id);
    if (!f || f.etat === "fermee") return;
    f.etat = "fermee";
    cacher(f);
    f.onglet.hidden = true;
    if (actif === id) {
      /* La fenêtre la plus haute encore ouverte reprend la main. Sur
         téléphone, où une seule fenêtre est ouverte à la fois, celle qui
         avait été mise de côté en dernier revient : on ne retombe pas sur
         un bureau vide en fermant « À propos ». */
      const parHauteur = (/** @type {Fenetre} */ a, /** @type {Fenetre} */ b) =>
        Number(b.el.style.zIndex) - Number(a.el.style.zIndex);
      const ouverte = [...toutes.values()].filter((w) => w.etat === "ouverte").sort(parHauteur)[0];
      const reduite = [...toutes.values()].filter((w) => w.etat === "reduite").sort(parHauteur)[0];
      if (ouverte) activer(ouverte.def.id);
      else if (reduite && !grand.matches) montrer(reduite);
      else activer("");
    }
  }

  /** @param {string} id */
  function reduire(id) {
    const f = toutes.get(id);
    if (!f || f.etat !== "ouverte") return;
    f.etat = "reduite";
    cacher(f);
    f.onglet.setAttribute("aria-pressed", "false");
    if (actif === id) activer("");
  }

  /** @param {Fenetre} f */
  function montrer(f) {
    /* Sur téléphone, une seule fenêtre à la fois : les autres se réduisent
       dans la barre des tâches, d'où l'on les rappelle d'un appui. */
    if (!grand.matches) {
      for (const autre of toutes.values()) if (autre !== f && autre.etat === "ouverte") reduire(autre.def.id);
    }
    f.etat = "ouverte";
    f.el.classList.remove("fenetre--sort");
    f.el.hidden = false;
    f.onglet.hidden = false;
    activer(f.def.id);
  }

  /**
   * Un clic sur un onglet : la fenêtre se montre, passe devant, ou se réduit
   * si elle est déjà devant.
   * @param {string} id
   */
  function basculer(id) {
    const f = toutes.get(id);
    if (!f) return;
    if (f.etat === "ouverte" && actif === id) reduire(id);
    else montrer(f);
  }

  /** @param {Definition} def */
  function creer(def) {
    const el = document.createElement("section");
    el.className = "fenetre";
    el.dataset.id = def.id;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-labelledby", `titre-${def.id}`);
    el.tabIndex = -1;
    const rangee = ouvertes;
    ouvertes += 1;
    const largeurFenetre = def.largeur ?? 420;
    el.style.setProperty("--l", `${largeurFenetre}px`);
    const { x, y } = emplacement(largeurFenetre, rangee);
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--y", `${y}px`);
    el.innerHTML =
      `<header class="fenetre__titre"><h2 class="fenetre__nom" id="titre-${echapper(def.id)}">${echapper(def.titre)}</h2>` +
      `<div class="fenetre__boutons">` +
      `<button type="button" class="fenetre__bouton" data-action="reduire" aria-label="Réduire"><span class="fenetre__signe fenetre__signe--reduire" aria-hidden="true"></span></button>` +
      `<button type="button" class="fenetre__bouton" data-action="fermer" aria-label="Fermer"><span class="fenetre__signe fenetre__signe--fermer" aria-hidden="true"></span></button></div></header>` +
      `<div class="fenetre__corps">${def.contenu}</div>`;
    calque.append(el);

    const onglet = document.createElement("button");
    onglet.type = "button";
    onglet.className = "barre__onglet";
    onglet.dataset.id = def.id;
    onglet.setAttribute("aria-pressed", "false");
    onglet.setAttribute("aria-label", def.titre);
    onglet.innerHTML = `<span class="barre__contenu">${icone(def.icone, "barre__icone")}<span class="barre__nom">${echapper(def.court)}</span></span>`;
    onglets.append(onglet);

    /** @type {Fenetre} */
    const f = { def, el, onglet, etat: "ouverte", demonter: null };
    toutes.set(def.id, f);
    const corps = el.querySelector(".fenetre__corps");
    if (def.monter && corps instanceof HTMLElement) f.demonter = def.monter(corps) ?? null;
    placer(f);
    if (!grand.matches) {
      for (const autre of toutes.values()) if (autre !== f && autre.etat === "ouverte") reduire(autre.def.id);
    }
    activer(def.id);
    el.focus({ preventScroll: true });
  }

  /**
   * Où poser une nouvelle fenêtre, sur grand écran. Les fenêtres se rangent
   * en colonnes alignées en haut : la nouvelle se pose à droite de la
   * dernière colonne s’il y a la place, sinon dans la colonne la plus à
   * droite où elle tient, par-dessus la fenêtre qui s’y trouve. Jamais
   * d’escalier, sauf sur un bureau trop étroit pour deux colonnes.
   * @param {number} largeurFenetre
   * @param {number} rangee  Le nombre de fenêtres déjà créées.
   * @returns {{ x: number, y: number }}
   */
  function emplacement(largeurFenetre, rangee) {
    const visibles = [...toutes.values()].filter((w) => w.etat === "ouverte");
    if (grand.matches && visibles.length > 0) {
      const limite = calque.clientWidth - ESPACE;
      const colonnes = [...new Set(visibles.map((w) => Number.parseFloat(w.el.style.getPropertyValue("--x"))))].sort(
        (a, b) => a - b
      );
      const droite = Math.max(
        ...visibles.map((w) => Number.parseFloat(w.el.style.getPropertyValue("--x")) + w.el.offsetWidth)
      );
      if (droite + ESPACE + largeurFenetre <= limite) return { x: droite + ESPACE, y: HAUT };
      const colonne = colonnes.reverse().find((x) => x > GAUCHE && x + largeurFenetre <= limite);
      if (colonne !== undefined) return { x: colonne, y: HAUT };
    }
    return { x: GAUCHE + rangee * DECALAGE, y: HAUT + rangee * DECALAGE };
  }

  /**
   * Garde la fenêtre dans le bureau, sur grand écran.
   * @param {Fenetre} f
   */
  function placer(f) {
    if (!grand.matches) return;
    const largeur = calque.clientWidth;
    const hauteur = calque.clientHeight;
    const l = f.el.offsetWidth;
    const x = Math.max(0, Math.min(Number.parseFloat(f.el.style.getPropertyValue("--x")), largeur - l - 8));
    const y = Math.max(0, Math.min(Number.parseFloat(f.el.style.getPropertyValue("--y")), hauteur - 80));
    f.el.style.setProperty("--x", `${x}px`);
    f.el.style.setProperty("--y", `${y}px`);
  }

  /** @param {Definition} def */
  function ouvrir(def) {
    const f = toutes.get(def.id);
    if (f) {
      montrer(f);
      f.el.focus({ preventScroll: true });
    } else creer(def);
  }

  /* ---------- Boutons de la fenêtre, onglets, déplacement ---------- */

  /** @param {MouseEvent} e */
  const auClic = (e) => {
    const cible = e.target instanceof Element ? e.target : null;
    if (!cible) return;
    const fenetre = cible.closest(".fenetre");
    if (!(fenetre instanceof HTMLElement)) return;
    const id = fenetre.dataset.id ?? "";
    const action = cible.closest("[data-action]");
    if (action instanceof HTMLElement) {
      if (action.dataset.action === "fermer") fermer(id);
      if (action.dataset.action === "reduire") reduire(id);
    }
  };

  /** @param {PointerEvent} e */
  const auPointeur = (e) => {
    const cible = e.target instanceof Element ? e.target : null;
    const fenetre = cible?.closest(".fenetre");
    if (!(fenetre instanceof HTMLElement)) return;
    const id = fenetre.dataset.id ?? "";
    if (actif !== id) activer(id);
    const titre = cible?.closest(".fenetre__titre");
    if (!(titre instanceof HTMLElement) || cible?.closest("button") || !grand.matches) return;
    const f = toutes.get(id);
    if (!f) return;
    const departX = e.clientX;
    const departY = e.clientY;
    const x0 = Number.parseFloat(fenetre.style.getPropertyValue("--x"));
    const y0 = Number.parseFloat(fenetre.style.getPropertyValue("--y"));
    titre.setPointerCapture(e.pointerId);
    fenetre.classList.add("fenetre--deplace");

    /** @param {PointerEvent} m */
    const deplacer = (m) => {
      const x = Math.max(-fenetre.offsetWidth + 96, Math.min(x0 + m.clientX - departX, calque.clientWidth - 96));
      const y = Math.max(0, Math.min(y0 + m.clientY - departY, calque.clientHeight - 36));
      fenetre.style.setProperty("--x", `${x}px`);
      fenetre.style.setProperty("--y", `${y}px`);
    };
    const lacher = () => {
      fenetre.classList.remove("fenetre--deplace");
      titre.removeEventListener("pointermove", deplacer);
      titre.removeEventListener("pointerup", lacher);
      titre.removeEventListener("pointercancel", lacher);
    };
    titre.addEventListener("pointermove", deplacer);
    titre.addEventListener("pointerup", lacher);
    titre.addEventListener("pointercancel", lacher);
  };

  /** @param {MouseEvent} e */
  const auClicOnglet = (e) => {
    const cible = e.target instanceof Element ? e.target.closest(".barre__onglet") : null;
    if (cible instanceof HTMLElement && cible.dataset.id) basculer(cible.dataset.id);
  };

  /** @param {KeyboardEvent} e */
  const auClavier = (e) => {
    if (e.key === "Escape" && actif && calque.contains(document.activeElement)) fermer(actif);
  };

  calque.addEventListener("click", auClic);
  calque.addEventListener("pointerdown", auPointeur);
  onglets.addEventListener("click", auClicOnglet);
  document.addEventListener("keydown", auClavier);

  return {
    ouvrir,
    fermer,
    /** Débranche tout : à appeler quand on quitte la page. */
    detruire() {
      calque.removeEventListener("click", auClic);
      calque.removeEventListener("pointerdown", auPointeur);
      onglets.removeEventListener("click", auClicOnglet);
      document.removeEventListener("keydown", auClavier);
      for (const f of toutes.values()) f.demonter?.();
      toutes.clear();
    },
  };
}
