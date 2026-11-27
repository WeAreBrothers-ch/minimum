/* Minimum : dessine un visuel Instagram dans un canevas.

   Deux gabarits, tous deux tirés du site (DIRECTION-ARTISTIQUE.md) :

   - « flyer », pour la musique (soirées, DJ, lives YouTube) : la machine à
     flyers du site (js/flyer.js, css/flyer.css, croquis du client du
     26.11.2026). La photo en plein, une étiquette rose en haut, puis sur
     une bande noire le nom en très grand, la date et l'heure en rose
     (« 24.12.26 19H00 »). Le portrait d'un artiste est en noir et blanc,
     l'affiche d'une soirée en couleur. Sans image : un flyer tout rose.

   - « fiche », pour le cinéma et les événements : fond blanc, l'affiche
     entière, l'étiquette rouge du cinéma, le titre, la ligne de tirets,
     les séances.

   Aucune dépendance : le navigateur suffit. */

import archivoLatinExt from "./fonts/archivo-latin-ext.woff2";
import archivoLatin from "./fonts/archivo-latin.woff2";

export type Teinte = "musique" | "cinema" | "agenda" | "infos" | "argent" | "probleme" | "cadre";
export type Format = "post" | "story" | "carre";

export interface ImageVisuel {
  url: string;
  /** Point d'intérêt de l'image, de 0 à 1 (le visage, par exemple). */
  fx?: number;
  fy?: number;
  /** « couvrir » recadre pour remplir ; « entier » montre toute l'image (une affiche de film). */
  cadrage: "couvrir" | "entier";
  /** Le portrait d'un artiste : en noir et blanc, comme sur les flyers du site. */
  noirEtBlanc?: boolean;
}

export interface Visuel {
  gabarit: "flyer" | "fiche";
  etiquette: { texte: string; teinte: Teinte } | null;
  image: ImageVisuel | null;
  titre: string;
  sousTitre: string | null;
  /** Fiche : les lignes sous les tirets (séances, dates). */
  lignes: string[];
  /** Fiche d'un film : les repères (Durée, Version, Âge…), en cases à côté de l'affiche, comme sur le site. */
  reperes?: Array<{ nom: string; valeur: string }>;
  /** Flyer : la date (AAAA-MM-JJ) et l'heure (HH:MM), écrites « 24.12.26 » et « 19H00 ». */
  quand: { date: string; heure: string | null } | null;
  /** À droite du nom du lieu, en bas : le compte Instagram ou le lieu. */
  pied: string;
}

export const FORMATS: Record<Format, { nom: string; largeur: number; hauteur: number; haut: number; bas: number }> = {
  post: { nom: "Post 4:5", largeur: 1080, hauteur: 1350, haut: 0, bas: 0 },
  /* Une story garde le haut et le bas libres : Instagram y pose son interface. */
  story: { nom: "Story 9:16", largeur: 1080, hauteur: 1920, haut: 230, bas: 250 },
  carre: { nom: "Carré 1:1", largeur: 1080, hauteur: 1080, haut: 0, bas: 0 },
};

/* Le code couleur du site (css/jetons.css) : une couleur par rubrique, et le texte qui se lit dessus. */
const NOIR = "#000";
const BLANC = "#fff";
const ROSE = "#f48fbf";
const COULEURS: Record<Exclude<Teinte, "cadre">, { fond: string; texte: string }> = {
  musique: { fond: ROSE, texte: NOIR },
  cinema: { fond: "#a72920", texte: BLANC },
  agenda: { fond: "#f6d82b", texte: NOIR },
  infos: { fond: "#6b1222", texte: BLANC },
  argent: { fond: "#3cab64", texte: NOIR },
  probleme: { fond: "#ff7a2f", texte: NOIR },
};

const POLICE = '"Archivo", "Helvetica Neue", Arial, sans-serif';
/** Graisse du nom et des titres (--graisse-nom). */
const GRAS = 900;
/** Le trait du site (2 px), à l'échelle d'une image de 1080 px. */
const TRAIT = 6;
/** La marge d'un flyer : 5 % de sa largeur (5cqi). */
const MARGE = 54;

let polices: Promise<void> | null = null;

/** Charge Archivo (la police du site) pour le canevas. Une seule fois. */
export function chargerPolices(): Promise<void> {
  if (!polices) {
    const fichiers = [archivoLatin, archivoLatinExt];
    polices = Promise.all(
      fichiers.map(async (url, rang) => {
        const police = new FontFace("Archivo", `url("${url}") format("woff2")`, {
          weight: "100 900",
          stretch: "62% 125%",
          unicodeRange: rang === 0 ? "U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC" : "U+0100-02BA, U+1E00-1E9F",
        });
        document.fonts.add(await police.load());
      }),
    ).then(() => undefined);
  }
  return polices;
}

function chargerImage(url: string): Promise<HTMLImageElement> {
  return new Promise((reussite, echec) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => reussite(image);
    image.onerror = () => echec(new Error(`Image impossible à charger : ${url}`));
    image.src = url;
  });
}

/** Les images Sanity sont demandées à la bonne taille ; les autres telles quelles. */
function adresseImage(url: string): string {
  if (!url.startsWith("https://cdn.sanity.io/")) return url;
  const adresse = new URL(url);
  adresse.searchParams.set("w", "1620");
  adresse.searchParams.set("fit", "max");
  return adresse.toString();
}

function police(ctx: CanvasRenderingContext2D, graisse: number, taille: number, interlettre = 0): void {
  ctx.font = `${graisse} ${taille}px ${POLICE}`;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${interlettre}px`;
}

/** Coupe un texte en lignes qui tiennent dans la largeur. null si un mot seul dépasse. */
function couper(ctx: CanvasRenderingContext2D, texte: string, largeur: number): string[] | null {
  const lignes: string[] = [];
  let ligne = "";
  for (const mot of texte.split(/\s+/).filter(Boolean)) {
    if (ctx.measureText(mot).width > largeur) return null;
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ctx.measureText(essai).width <= largeur) {
      ligne = essai;
    } else {
      lignes.push(ligne);
      ligne = mot;
    }
  }
  if (ligne) lignes.push(ligne);
  return lignes;
}

/** La plus grande taille à laquelle le titre tient en « lignesMax » lignes. */
function ajusterTitre(ctx: CanvasRenderingContext2D, titre: string, largeur: number, tailleMax: number, lignesMax: number) {
  const tailleMin = 48;
  for (let taille = tailleMax; taille >= tailleMin; taille -= 4) {
    police(ctx, GRAS, taille, taille * 0.02);
    const lignes = couper(ctx, titre, largeur);
    if (lignes && lignes.length <= lignesMax) return { taille, lignes };
  }
  police(ctx, GRAS, tailleMin, tailleMin * 0.02);
  const lignes = couper(ctx, titre, largeur) ?? [titre];
  const gardees = lignes.slice(0, lignesMax).map((ligne) => tenir(ctx, ligne, largeur));
  if (lignes.length > lignesMax) gardees[lignesMax - 1] = tenir(ctx, `${gardees[lignesMax - 1]}…`, largeur);
  return { taille: tailleMin, lignes: gardees };
}

/** Raccourcit une ligne trop longue par des points de suspension. */
function tenir(ctx: CanvasRenderingContext2D, texte: string, largeur: number): string {
  if (ctx.measureText(texte).width <= largeur) return texte;
  let court = texte.replace(/…$/, "");
  while (court.length > 1 && ctx.measureText(`${court}…`).width > largeur) court = court.slice(0, -1);
  return `${court.trimEnd()}…`;
}

/** La ligne de tirets du programme de 2009, tapée en vrais caractères. */
function tirets(ctx: CanvasRenderingContext2D, largeur: number): string {
  let ligne = "-";
  while (ctx.measureText(`${ligne}-`).width <= largeur) ligne += "-";
  return ligne;
}

const capitales = (texte: string) => texte.toLocaleUpperCase("fr");

/** « 2026-12-24 » → « 24.12.26 », comme sur les flyers du site. */
export function dateFlyer(iso: string): string {
  const [annee = "", mois = "", jour = ""] = iso.split("-");
  return `${jour}.${mois}.${annee.slice(2)}`;
}

/** « 19:00 » → « 19H00 ». */
export const heureFlyer = (heure: string) => heure.replace(":", "H");

interface Zone {
  x: number;
  y: number;
  l: number;
  h: number;
}

/** L'image recadrée pour remplir la zone, centrée sur son point d'intérêt. */
function couvrir(ctx: CanvasRenderingContext2D, image: HTMLImageElement, zone: Zone, fx = 0.5, fy = 0.5): void {
  const echelle = Math.max(zone.l / image.naturalWidth, zone.h / image.naturalHeight);
  const l = zone.l / echelle;
  const h = zone.h / echelle;
  const sx = Math.min(Math.max(0, fx * image.naturalWidth - l / 2), image.naturalWidth - l);
  const sy = Math.min(Math.max(0, fy * image.naturalHeight - h / 2), image.naturalHeight - h);
  ctx.drawImage(image, sx, sy, l, h, zone.x, zone.y, zone.l, zone.h);
}

/** Noir et blanc, un peu contrasté : le « grayscale(1) contrast(1.1) » des flyers du site. */
function noirEtBlanc(ctx: CanvasRenderingContext2D, zone: Zone): void {
  const pixels = ctx.getImageData(zone.x, zone.y, zone.l, zone.h);
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const gris = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    const valeur = (gris - 128) * 1.1 + 128;
    d[i] = valeur;
    d[i + 1] = valeur;
    d[i + 2] = valeur;
  }
  ctx.putImageData(pixels, zone.x, zone.y);
}

/** Une étiquette : un rectangle de couleur à angle droit, le texte en capitales grasses. Rend sa hauteur. */
function etiquette(
  ctx: CanvasRenderingContext2D,
  texte: string,
  couleurs: { fond: string; texte: string } | { cadre: string },
  x: number,
  y: number,
  largeurMax: number,
  taille: number,
): number {
  police(ctx, GRAS, taille, taille * 0.02);
  const remplissage = Math.round(taille * 0.55);
  const hauteur = Math.round(taille * 1.7);
  const libelle = tenir(ctx, capitales(texte), largeurMax - 2 * remplissage);
  const largeur = ctx.measureText(libelle).width + 2 * remplissage;
  if ("cadre" in couleurs) {
    ctx.strokeStyle = couleurs.cadre;
    ctx.lineWidth = TRAIT;
    ctx.strokeRect(x + TRAIT / 2, y + TRAIT / 2, largeur - TRAIT, hauteur - TRAIT);
    ctx.fillStyle = couleurs.cadre;
  } else {
    ctx.fillStyle = couleurs.fond;
    ctx.fillRect(x, y, largeur, hauteur);
    ctx.fillStyle = couleurs.texte;
  }
  ctx.fillText(libelle, x + remplissage, y + hauteur / 2 + taille * 0.36);
  return hauteur;
}

/** Le pied : le nom du lieu, puis le compte ou l'adresse. Rend sa hauteur. */
function pied(ctx: CanvasRenderingContext2D, texte: string, couleur: string, x: number, y: number, largeur: number): number {
  ctx.fillStyle = couleur;
  police(ctx, GRAS, 40, 0.8);
  ctx.fillText("MINIMUM", x - 2, y + 34);
  const largeurNom = ctx.measureText("MINIMUM").width;
  police(ctx, 560, 26, 1);
  ctx.textAlign = "right";
  ctx.fillText(tenir(ctx, capitales(texte), largeur - largeurNom - 40), x + largeur, y + 32);
  ctx.textAlign = "left";
  return 40;
}

/* ------------------------------ Flyer (musique) ------------------------------ */

function dessinerFlyer(ctx: CanvasRenderingContext2D, visuel: Visuel, format: Format, image: HTMLImageElement | null): void {
  const { largeur, hauteur, haut, bas } = FORMATS[format];
  const utile = largeur - 2 * MARGE;
  /* Sans image : un flyer typographique, tout rose, texte noir. */
  const typo = image === null;
  const encre = typo ? NOIR : BLANC;
  const accent = typo ? NOIR : ROSE;

  ctx.fillStyle = typo ? ROSE : NOIR;
  ctx.fillRect(0, 0, largeur, hauteur);

  /* La bande du bas se mesure d'abord : le nom, la ligne, la date et l'heure, le pied. */
  const nom = ajusterTitre(ctx, capitales(visuel.titre), utile, typo ? 190 : 130, typo ? 5 : 3);
  const interligne = Math.round(nom.taille * 0.92);
  const hauteurNom = nom.lignes.length * interligne;
  const tailleQuand = 97;
  const hauteurBande =
    MARGE + hauteurNom + (visuel.sousTitre ? 24 + 40 : 0) + (visuel.quand ? 30 + tailleQuand * 0.78 : 0) + 34 + TRAIT + 22 + 40 + MARGE + bas;
  const yBande = hauteur - hauteurBande;

  if (image && visuel.image) {
    const zone = { x: 0, y: 0, l: largeur, h: yBande };
    couvrir(ctx, image, zone, visuel.image.fx, visuel.image.fy);
    if (visuel.image.noirEtBlanc) noirEtBlanc(ctx, zone);
    ctx.fillStyle = NOIR;
    ctx.fillRect(0, yBande, largeur, hauteurBande);
  }

  if (visuel.etiquette) {
    const { texte, teinte } = visuel.etiquette;
    const couleurs = teinte === "cadre" ? { cadre: encre } : typo && teinte === "musique" ? { fond: NOIR, texte: BLANC } : COULEURS[teinte];
    etiquette(ctx, texte, couleurs, MARGE, MARGE + haut, utile, 48);
  }

  let y = yBande + MARGE;
  police(ctx, GRAS, nom.taille, nom.taille * 0.02);
  ctx.fillStyle = encre;
  nom.lignes.forEach((ligne, i) => ctx.fillText(ligne, MARGE - nom.taille * 0.04, y + i * interligne + nom.taille * 0.76));
  y += hauteurNom;

  if (visuel.sousTitre) {
    y += 24;
    police(ctx, 560, 36, 0.4);
    ctx.fillStyle = encre;
    ctx.fillText(tenir(ctx, visuel.sousTitre, utile), MARGE, y + 31);
    y += 40;
  }

  if (visuel.quand) {
    y += 30;
    police(ctx, GRAS, tailleQuand, 0);
    ctx.fillStyle = accent;
    const base = y + tailleQuand * 0.74;
    ctx.fillText(dateFlyer(visuel.quand.date), MARGE - 4, base);
    if (visuel.quand.heure) {
      ctx.textAlign = "right";
      ctx.fillText(heureFlyer(visuel.quand.heure), largeur - MARGE, base);
      ctx.textAlign = "left";
    }
    y += tailleQuand * 0.78;
  }

  y += 34;
  ctx.fillStyle = encre;
  ctx.fillRect(MARGE, y, utile, TRAIT);
  pied(ctx, visuel.pied, encre, MARGE, y + TRAIT + 22, utile);
}

/* ------------------------------ Fiche (cinéma, événements) ------------------------------ */

function dessinerFiche(ctx: CanvasRenderingContext2D, visuel: Visuel, format: Format, image: HTMLImageElement | null): void {
  const { largeur, hauteur, haut, bas } = FORMATS[format];
  const marge = 64;
  const utile = largeur - 2 * marge;
  ctx.fillStyle = BLANC;
  ctx.fillRect(0, 0, largeur, hauteur);

  const sansImage = image === null;
  const titre = ajusterTitre(ctx, capitales(visuel.titre), utile, sansImage ? 170 : format === "carre" ? 92 : 112, sansImage ? 5 : 3);
  const interligne = Math.round(titre.taille * 0.96);
  police(ctx, 560, 40, 0.4);
  const sousTitre = visuel.sousTitre ? (couper(ctx, visuel.sousTitre, utile) ?? [visuel.sousTitre]).slice(0, 2) : [];
  const lignes = visuel.lignes.slice(0, 4);
  const hauteurEtiquette = visuel.etiquette ? Math.round(30 * 1.7) + 28 : 0;
  const hauteurTexte =
    hauteurEtiquette + titre.lignes.length * interligne + (sousTitre.length > 0 ? 18 + sousTitre.length * 50 : 0) + 22 + 30 + 22 + lignes.length * 52;
  const yPied = hauteur - bas - marge - 40;
  const yTrait = yPied - 22 - TRAIT;
  const yTexte = sansImage ? marge + haut : yTrait - 30 - hauteurTexte;

  if (image && visuel.image) {
    const zone = { x: marge, y: marge + haut, l: utile, h: Math.max(0, yTexte - 40 - marge - haut) };
    if (visuel.image.cadrage === "entier") {
      const echelle = Math.min(zone.l / image.naturalWidth, zone.h / image.naturalHeight);
      const l = Math.round(image.naturalWidth * echelle);
      const h = Math.round(image.naturalHeight * echelle);
      const y = zone.y + zone.h - h;
      const reperes = (visuel.reperes ?? []).slice(0, 6);
      const colonne = zone.l - l;
      /* Assez de place à droite : les repères en cases jointes d'un trait ; sinon l'affiche se centre. */
      const enCases = reperes.length > 0 && colonne >= 300;
      const x = enCases ? zone.x : zone.x + Math.round(colonne / 2);
      ctx.drawImage(image, x, y, l, h);
      ctx.strokeStyle = NOIR;
      ctx.fillStyle = NOIR;
      ctx.lineWidth = TRAIT;
      ctx.strokeRect(x + TRAIT / 2, y + TRAIT / 2, l - TRAIT, h - TRAIT);
      if (enCases) {
        const xCases = x + l - TRAIT;
        ctx.strokeRect(xCases + TRAIT / 2, y + TRAIT / 2, colonne, h - TRAIT);
        const hauteurCase = (h - TRAIT) / reperes.length;
        const dedans = colonne - 2 * 30;
        reperes.forEach((repere, rang) => {
          const haut = y + rang * hauteurCase;
          if (rang > 0) ctx.fillRect(xCases, Math.round(haut), colonne + TRAIT, TRAIT);
          const milieu = haut + TRAIT / 2 + hauteurCase / 2;
          police(ctx, 560, 24, 1.2);
          ctx.fillText(tenir(ctx, capitales(repere.nom), dedans), xCases + TRAIT + 26, milieu - 12);
          police(ctx, GRAS, 40, 0.4);
          ctx.fillText(tenir(ctx, capitales(repere.valeur), dedans), xCases + TRAIT + 24, milieu + 34);
        });
      }
    } else {
      const pleine = { x: 0, y: 0, l: largeur, h: Math.max(0, yTexte - 40) };
      couvrir(ctx, image, pleine, visuel.image.fx, visuel.image.fy);
      ctx.fillStyle = NOIR;
      ctx.fillRect(0, pleine.h, largeur, TRAIT);
    }
  }

  let y = yTexte;
  if (visuel.etiquette) {
    const { texte, teinte } = visuel.etiquette;
    y += etiquette(ctx, texte, teinte === "cadre" ? { cadre: NOIR } : COULEURS[teinte], marge, y, utile, 30) + 28;
  }
  police(ctx, GRAS, titre.taille, titre.taille * 0.02);
  ctx.fillStyle = NOIR;
  titre.lignes.forEach((ligne, i) => ctx.fillText(ligne, marge - titre.taille * 0.04, y + i * interligne + titre.taille * 0.8));
  y += titre.lignes.length * interligne;

  if (sousTitre.length > 0) {
    y += 18;
    police(ctx, 560, 40, 0.4);
    sousTitre.forEach((ligne, i) => ctx.fillText(tenir(ctx, ligne, utile), marge, y + i * 50 + 38));
    y += sousTitre.length * 50;
  }

  y += 22;
  police(ctx, 400, 34, 0);
  ctx.fillText(tirets(ctx, utile), marge, y + 24);
  y += 30 + 22;

  police(ctx, 700, 38, 0.6);
  for (const ligne of lignes) {
    ctx.fillText(tenir(ctx, capitales(ligne), utile), marge, y + 39);
    y += 52;
  }

  ctx.fillStyle = NOIR;
  ctx.fillRect(marge, yTrait, utile, TRAIT);
  pied(ctx, visuel.pied, NOIR, marge, yPied, utile);
}

/**
 * Dessine le visuel au format demandé. Le canevas prend la taille du format.
 * L'image manquante ou illisible n'empêche rien : le visuel devient typographique.
 */
export async function dessiner(canevas: HTMLCanvasElement, visuel: Visuel, format: Format): Promise<void> {
  const { largeur, hauteur } = FORMATS[format];
  await chargerPolices();
  let image: HTMLImageElement | null = null;
  if (visuel.image) {
    try {
      image = await chargerImage(adresseImage(visuel.image.url));
    } catch (erreur) {
      console.warn("Minimum : image du post indisponible, visuel typographique à la place.", erreur);
    }
  }
  canevas.width = largeur;
  canevas.height = hauteur;
  const ctx = canevas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Ce navigateur ne sait pas dessiner l'image.");
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  if (visuel.gabarit === "flyer") dessinerFlyer(ctx, visuel, format, image);
  else dessinerFiche(ctx, visuel, format, image);
}

/** Le canevas en fichier JPEG, prêt pour Instagram. */
export function versFichier(canevas: HTMLCanvasElement, nom: string): Promise<File> {
  return new Promise((reussite, echec) => {
    canevas.toBlob(
      (blob) => (blob ? reussite(new File([blob], `${nom}.jpg`, { type: "image/jpeg" })) : echec(new Error("Image impossible à enregistrer."))),
      "image/jpeg",
      0.95,
    );
  });
}
