// @ts-check
/* Minimum Radio : les autres fenêtres du bureau, Photos, Écrire, À propos
   et Réglages (où l'on change le fond d'écran et les couleurs). */

import { MAIL_RADIO } from "../config.js";
import { echapper } from "../format.js";
import { sourcesImage } from "../images.js";
import { trouver } from "./dom.js";
import {
  appliquerCouleur,
  appliquerFond,
  COULEURS,
  couleurChoisie,
  FOND_PERSO,
  FONDS_IMAGES,
  FONDS_SYSTEME,
  fondChoisi,
  importerImage,
} from "./fonds.js";

/** @typedef {import("./fenetres.js").Definition} Definition */
/** @typedef {import("../types.js").Image} Image */

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

/**
 * @typedef {Object} Photo
 * @property {Image} image
 * @property {string} nom
 */

/**
 * La visionneuse : les affiches des soirées, l'une après l'autre.
 * @param {Photo[]} photos
 * @returns {Definition}
 */
export function fenetrePhotos(photos) {
  const contenu = photos.length
    ? `<div class="os-menu"><span class="os-menu__item os-menu__item--texte">Les affiches des soirées</span></div>` +
      `<div class="visionneuse"><div class="visionneuse__image"></div>` +
      `<p class="visionneuse__nom"></p>` +
      `<div class="visionneuse__nav"><button type="button" class="os-bouton os-bouton--texte" data-pas="-1">Précédent</button>` +
      `<span class="visionneuse__rang"></span>` +
      `<button type="button" class="os-bouton os-bouton--texte" data-pas="1">Suivant</button></div></div>` +
      `<p class="os-statut" role="status"><span class="os-statut__texte"></span></p>`
    : `<p class="os-texte">Aucune photo pour l’instant.</p>`;
  return {
    id: "photos",
    titre: "Visionneuse de photos",
    icone: "photos",
    largeur: 400,
    contenu,
    monter: (corps) => {
      if (photos.length === 0) return;
      const racine = document.body.dataset.racine ?? "";
      const zone = trouver(corps, ".visionneuse__image", HTMLElement);
      const nom = trouver(corps, ".visionneuse__nom", HTMLElement);
      const rangEl = trouver(corps, ".visionneuse__rang", HTMLElement);
      const statut = trouver(corps, ".os-statut__texte", HTMLElement);
      let i = 0;
      const afficher = () => {
        const photo = photos[i];
        if (!photo) return;
        const { src, srcset, sizes } = sourcesImage(photo.image, racine, [480, 720], "(min-width: 40rem) 24rem, 80vw");
        const variantes = srcset ? ` srcset="${echapper(srcset)}" sizes="${echapper(sizes)}"` : "";
        zone.innerHTML = `<img src="${echapper(src)}"${variantes} alt="${echapper(photo.image.alt)}" decoding="async">`;
        nom.textContent = photo.nom;
        rangEl.textContent = `${i + 1} sur ${photos.length}`;
        statut.textContent = `Image ${i + 1} sur ${photos.length}`;
      };
      /** @param {MouseEvent} e */
      const auClic = (e) => {
        const pas = e.target instanceof Element ? e.target.closest("[data-pas]") : null;
        if (!(pas instanceof HTMLElement)) return;
        i = (i + Number(pas.dataset.pas) + photos.length) % photos.length;
        afficher();
      };
      corps.addEventListener("click", auClic);
      afficher();
      return () => corps.removeEventListener("click", auClic);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Écrire                                                              */
/* ------------------------------------------------------------------ */

/**
 * Un message à la radio : la messagerie du visiteur s'ouvre, le message
 * n'est envoyé nulle part avant qu'il l'envoie lui-même.
 * @returns {Definition}
 */
export function fenetreEcrire() {
  return {
    id: "ecrire",
    titre: "Écrire à la radio",
    icone: "lettre",
    largeur: 400,
    contenu:
      `<form class="formulaire" novalidate>` +
      `<p class="formulaire__titre">Demander un titre, proposer une émission</p>` +
      `<label class="formulaire__champ">Votre nom<input type="text" name="nom" autocomplete="name" placeholder="Prénom Nom"></label>` +
      `<label class="formulaire__champ">Votre message<textarea name="message" rows="5" required placeholder="Un titre, une idée, une question…"></textarea></label>` +
      `<button type="submit" class="os-bouton os-bouton--texte">Envoyer</button></form>` +
      `<p class="os-statut" role="status"><span class="os-statut__texte">Prêt</span></p>`,
    monter: (corps) => {
      const formulaire = trouver(corps, "form", HTMLFormElement);
      const statut = trouver(corps, ".os-statut__texte", HTMLElement);
      /** @param {SubmitEvent} e */
      const auEnvoi = (e) => {
        e.preventDefault();
        const donnees = new FormData(formulaire);
        const message = String(donnees.get("message") ?? "").trim();
        const nom = String(donnees.get("nom") ?? "").trim();
        if (!message) {
          statut.textContent = "Écrivez d’abord votre message";
          return;
        }
        const corpsMail = `${message}${nom ? `\n\n${nom}` : ""}`;
        statut.textContent = "Ouverture de votre messagerie…";
        window.location.href = `mailto:${MAIL_RADIO}?subject=${encodeURIComponent("Minimum Radio")}&body=${encodeURIComponent(corpsMail)}`;
      };
      formulaire.addEventListener("submit", auEnvoi);
      return () => formulaire.removeEventListener("submit", auEnvoi);
    },
  };
}

/* ------------------------------------------------------------------ */
/* À propos                                                            */
/* ------------------------------------------------------------------ */

/**
 * @param {string} racine
 * @returns {Definition}
 */
export function fenetreApropos(racine) {
  return {
    id: "apropos",
    titre: "À propos de Minimum radio",
    icone: "info",
    largeur: 360,
    contenu:
      `<div class="apropos"><p class="apropos__logo" aria-hidden="true">M</p>` +
      `<p class="apropos__nom">Minimum radio, édition bureau</p>` +
      `<p>La web radio de Minimum, à La Case à Chocs, Neuchâtel.</p>` +
      `<p class="apropos__liens"><a href="${racine}cinema/">Cinéma</a><a href="${racine}nuit/">Nuit</a><a href="${racine}infos/">Infos</a></p>` +
      `<button type="button" class="os-bouton os-bouton--texte" data-action="fermer">OK</button></div>`,
  };
}

/* ------------------------------------------------------------------ */
/* Réglages                                                            */
/* ------------------------------------------------------------------ */

/**
 * @param {{ ecran: HTMLElement, bureau: HTMLElement, racine: string }} cibles
 *   `ecran` porte le fond d'écran ; `bureau` porte la couleur des fenêtres.
 * @returns {Definition}
 */
export function fenetreReglages({ ecran, bureau, racine }) {
  /** @param {import("./fonds.js").Fond} f */
  const tuileFond = (f) =>
    `<button type="button" class="tuile" data-fond="${f.id}" aria-pressed="false" title="${echapper(f.nom)}" ` +
    (f.genre === "couleur" ? `style="background:${f.valeur}"` : `style="background-image:url('${racine}${f.valeur}')"`) +
    `><span class="tuile__nom">${echapper(f.nom)}</span></button>`;
  const tuileCouleur = (/** @type {{id: string, nom: string, valeur: string}} */ c) =>
    `<button type="button" class="tuile tuile--couleur" data-couleur="${c.id}" aria-pressed="false" title="${echapper(c.nom)}" style="background:${c.valeur}">` +
    `<span class="tuile__nom">${echapper(c.nom)}</span></button>`;
  return {
    id: "reglages",
    titre: "Réglages",
    icone: "reglages",
    largeur: 540,
    contenu:
      `<div class="os-onglets" role="tablist">` +
      `<button type="button" role="tab" class="os-onglet" data-onglet="fonds" aria-selected="true">Fond d’écran</button>` +
      `<button type="button" role="tab" class="os-onglet" data-onglet="couleurs" aria-selected="false">Couleurs</button></div>` +
      `<div class="os-page" data-page="fonds" role="tabpanel">` +
      `<h3 class="os-page__titre">Fonds de couleur</h3><div class="tuiles">${FONDS_SYSTEME.map(tuileFond).join("")}</div>` +
      `<h3 class="os-page__titre">Fonds Minimum</h3><div class="tuiles">${FONDS_IMAGES.map(tuileFond).join("")}</div>` +
      `<h3 class="os-page__titre">Mon image</h3><div class="tuiles">` +
      `<button type="button" class="tuile tuile--perso" data-fond="${FOND_PERSO}" aria-pressed="false" hidden><span class="tuile__nom">Mon image</span></button>` +
      `<label class="tuile tuile--ajout"><span class="tuile__nom">Choisir une image…</span>` +
      `<input type="file" accept="image/*" class="visuellement-cache"></label></div>` +
      `<p class="os-note">L’image reste sur votre appareil : elle n’est envoyée nulle part.</p></div>` +
      `<div class="os-page" data-page="couleurs" role="tabpanel" hidden>` +
      `<h3 class="os-page__titre">Couleur des fenêtres</h3><div class="tuiles">${COULEURS.map(tuileCouleur).join("")}</div></div>` +
      `<p class="os-statut" role="status"><span class="os-statut__texte">Prêt</span></p>`,
    monter: (corps) => {
      const statut = trouver(corps, ".os-statut__texte", HTMLElement);
      const perso = trouver(corps, ".tuile--perso", HTMLElement);
      const fichier = trouver(corps, 'input[type="file"]', HTMLInputElement);

      const marquer = () => {
        const fond = fondChoisi();
        const couleur = couleurChoisie();
        for (const t of corps.querySelectorAll("[data-fond]")) t.setAttribute("aria-pressed", String(t instanceof HTMLElement && t.dataset.fond === fond));
        for (const t of corps.querySelectorAll("[data-couleur]")) t.setAttribute("aria-pressed", String(t instanceof HTMLElement && t.dataset.couleur === couleur));
        perso.hidden = fond !== FOND_PERSO;
      };

      /** @param {MouseEvent} e */
      const auClic = (e) => {
        const cible = e.target instanceof Element ? e.target : null;
        if (!cible) return;
        const onglet = cible.closest("[data-onglet]");
        if (onglet instanceof HTMLElement) {
          for (const o of corps.querySelectorAll("[data-onglet]")) {
            if (o instanceof HTMLElement) o.setAttribute("aria-selected", String(o === onglet));
          }
          for (const page of corps.querySelectorAll("[data-page]")) {
            if (page instanceof HTMLElement) page.hidden = page.dataset.page !== onglet.dataset.onglet;
          }
          return;
        }
        const fond = cible.closest(".tuile[data-fond]");
        if (fond instanceof HTMLElement && fond.dataset.fond) {
          appliquerFond(ecran, fond.dataset.fond, racine);
          statut.textContent = `Fond d’écran : ${fond.title || "Mon image"}`;
          return marquer();
        }
        const couleur = cible.closest(".tuile[data-couleur]");
        if (couleur instanceof HTMLElement && couleur.dataset.couleur) {
          appliquerCouleur(bureau, couleur.dataset.couleur);
          statut.textContent = `Couleur : ${couleur.title}`;
          marquer();
        }
      };

      const auChoix = async () => {
        const f = fichier.files?.[0];
        if (!f) return;
        statut.textContent = "Lecture de l’image…";
        try {
          await importerImage(f);
          appliquerFond(ecran, FOND_PERSO, racine);
          statut.textContent = "Fond d’écran : votre image";
          marquer();
        } catch (erreur) {
          console.warn("Minimum Radio : image refusée.", erreur);
          statut.textContent = "Cette image n’a pas pu être lue";
        }
        fichier.value = "";
      };

      corps.addEventListener("click", auClic);
      fichier.addEventListener("change", auChoix);
      marquer();
      return () => {
        corps.removeEventListener("click", auClic);
        fichier.removeEventListener("change", auChoix);
      };
    },
  };
}
