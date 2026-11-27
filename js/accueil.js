// @ts-check
/* Minimum : l’accueil, deux murs (Musique et Cinéma) dont chaque colonne défile seule. */

import { cartesCinema, cartesMusique } from "./carte.js";
import { chargerProgramme } from "./donnees.js";
import { decaler, monterMur } from "./mur.js";

/** @typedef {import("./types.js").Carte} Carte */
/** @typedef {import("./mur.js").Colonne} Colonne */

/**
 * Remplit une moitié et renvoie de quoi la démonter.
 * @param {HTMLElement | null} moitie
 * @param {(ordinateur: boolean) => import("./mur.js").Colonne[]} colonnesDe
 * @param {string} racine
 * @returns {() => void}
 */
function remplir(moitie, colonnesDe, racine) {
  const colonnes = moitie?.querySelector(".moitie__colonnes");
  if (!(colonnes instanceof HTMLElement)) return () => {};
  return monterMur(colonnes, colonnesDe, racine);
}

/**
 * Une rubrique du site, comme case du mur.
 * @param {NonNullable<Carte["teinte"]>} teinte
 * @param {string} titre
 * @param {string} lien
 * @returns {Carte}
 */
function rubrique(teinte, titre, lien) {
  return { genre: "rubrique", id: `rubrique-${teinte}`, titre, lien, image: null, ligne: "", etat: "", teinte };
}

/**
 * Les quatre onglets de l’accueil (croquis du client, 26.11.2026), de gauche
 * à droite : Agenda (jaune), Musique (rose), Cinéma (rouge), Infos (grenat).
 * Sur ordinateur, chacun en tête de sa colonne ; sur téléphone, Agenda puis
 * Musique dans le mur gauche, Cinéma puis Infos dans le droit, une affiche
 * entre les deux. Leur taille et leur place sont tirées au sort à chaque
 * arrivée (tirerOrdinateur, tirerTelephone) ; elles restent les mêmes à
 * chaque tour de la colonne. Rien que leur nom et la flèche, pas de
 * petits mots (revu le 26.11.2026).
 */
function onglets() {
  return {
    agenda: rubrique("agenda", "Agenda", "agenda/"),
    musique: rubrique("musique", "Musique", "musique/"),
    cinema: rubrique("cinema", "Cinéma", "cinema/"),
    infos: rubrique("infos", "Infos", "infos/"),
  };
}

/* ---------- Le hasard du mur (revu le 26.11.2026 : « tout le temps aléatoire ») ----------
   À chaque arrivée sur l’accueil, les onglets changent de taille et de
   place, et les affiches d’ordre. Le hasard a des règles :
   - chaque onglet entre en entier dans l’écran à l’arrivée ;
   - deux onglets voisins ne commencent ni ne finissent à la même hauteur,
     et n’ont pas la même taille : jamais de rangée, jamais de symétrie.
   Les mesures sont en largeurs de colonne ; une affiche fait 1,5. */

const AFFICHE = 1.5;
/** Hauteur d’un onglet, en largeurs de colonne : de quoi lire son nom, jamais plus qu’une affiche. */
const ONGLET_MIN = 0.55;
const ONGLET_MAX = 1.3;
/** Sur téléphone, un onglet ne dépasse pas une largeur de colonne. */
const ONGLET_MAX_TELEPHONE = 0.95;
/** Sur téléphone, la colonne est étroite : le nom et sa ligne prennent plus de place. */
const ONGLET_MIN_TELEPHONE = 0.65;
/** Écart minimal entre deux onglets voisins : leurs hauts, leurs bas, leurs tailles. */
const ECART_HAUT = 0.45;
const ECART_BAS = 0.2;
const ECART_TAILLE = 0.1;
const ESSAIS = 400;

/**
 * Un nombre au hasard entre deux bornes.
 * @param {number} min
 * @param {number} max
 */
function entre(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Les mêmes éléments, dans un ordre tiré au sort (Fisher-Yates).
 * @template T
 * @param {T[]} liste
 * @returns {T[]}
 */
function melanger(liste) {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copie[i];
    const b = copie[j];
    if (a === undefined || b === undefined) continue;
    copie[i] = b;
    copie[j] = a;
  }
  return copie;
}

/**
 * Un onglet tiré : où il arrive (haut, en largeurs de colonne sous le
 * haut de l’écran) et sa taille.
 * @typedef {{ haut: number, taille: number }} Tirage
 */

/**
 * Deux onglets voisins assez différents ? `souplesse` va de 1 (écarts
 * entiers) à 0 (aucun) : si l’écran est trop bas pour tout respecter, on
 * relâche les écarts, jamais la règle « tout dans l’écran ».
 * @param {Tirage} a
 * @param {Tirage} b
 * @param {number} souplesse
 */
function differents(a, b, souplesse) {
  return (
    Math.abs(a.haut - b.haut) >= ECART_HAUT * souplesse &&
    Math.abs(a.haut + a.taille - (b.haut + b.taille)) >= ECART_BAS * souplesse &&
    Math.abs(a.taille - b.taille) >= ECART_TAILLE * souplesse
  );
}

/**
 * La souplesse de l’essai n : entière pendant la première moitié des
 * essais, puis de moins en moins.
 * @param {number} essai
 */
function souplesseDe(essai) {
  return essai < ESSAIS / 2 ? 1 : 1 - (essai - ESSAIS / 2) / (ESSAIS / 2);
}

/**
 * Une taille d’onglet, et un haut qui le laisse dans l’écran (`place` :
 * ce qui reste sous le haut de l’écran pour lui et ce qui le suit).
 * @param {number} place
 * @param {number} [min]  Taille minimale.
 * @param {number} [max]  Taille maximale.
 * @returns {Tirage}
 */
function tirerOnglet(place, min = ONGLET_MIN, max = ONGLET_MAX) {
  const taille = entre(min, Math.max(min, Math.min(max, place)));
  /* N’importe où dans l’écran, du haut jusqu’en bas (revu le 27.11.2026 :
     l’aléatoire ne se voyait pas assez, les onglets restaient en haut) ;
     jamais collé au haut : un liseré d’affiche au-dessus ferait défaut. */
  const plusBas = Math.max(0, place - taille);
  return { haut: entre(Math.min(0.15, plusBas), plusBas), taille };
}

/**
 * Ordinateur : un onglet en tête de chacune des quatre colonnes.
 * @param {number} ecran  Hauteur de l’écran, en largeurs de colonne.
 * @returns {Tirage[]}
 */
function tirerOrdinateur(ecran) {
  /** @type {Tirage[]} */
  let tirage = [];
  for (let essai = 0; essai < ESSAIS; essai++) {
    const souplesse = souplesseDe(essai);
    tirage = [0, 1, 2, 3].map(() => tirerOnglet(ecran - 0.05));
    const ok = tirage.every((t, i) => i === 0 || differents(t, /** @type {Tirage} */ (tirage[i - 1]), souplesse));
    if (ok) return tirage;
  }
  return tirage;
}

/**
 * Téléphone : deux onglets par colonne, une affiche entre les deux.
 * Renvoie, pour chaque colonne, le haut du premier et la taille de chacun.
 * @param {number} ecran
 * @returns {Array<{ haut: number, tailles: [number, number] }>}
 */
function tirerTelephone(ecran) {
  /** @type {Array<{ haut: number, tailles: [number, number] }>} */
  let tirage = [];
  for (let essai = 0; essai < ESSAIS; essai++) {
    const souplesse = souplesseDe(essai);
    tirage = [0, 1].map(() => {
      /* Le second onglet d’abord, puis le premier et son haut dans ce qui reste. */
      const second = entre(ONGLET_MIN_TELEPHONE, ONGLET_MAX_TELEPHONE);
      const premier = tirerOnglet(ecran - 0.05 - AFFICHE - second, ONGLET_MIN_TELEPHONE, ONGLET_MAX_TELEPHONE);
      /** @type {[number, number]} */
      const tailles = [premier.taille, second];
      return { haut: premier.haut, tailles };
    });
    /* Les quatre onglets, colonne par colonne. */
    const [gauche, droite] = tirage.map(({ haut, tailles: [a, b] }) => [
      { haut, taille: a },
      { haut: haut + a + AFFICHE, taille: b },
    ]);
    if (!gauche || !droite) break;
    const ok =
      gauche.every((g, i) => differents(g, /** @type {Tirage} */ (droite[i]), souplesse)) &&
      tirage.every(({ tailles: [a, b] }) => Math.abs(a - b) >= ECART_TAILLE * souplesse);
    if (ok) return tirage;
  }
  return tirage;
}

/**
 * Un onglet, une affiche, puis l’autre onglet et le reste des affiches.
 * @param {Carte} premier
 * @param {Carte} second
 * @param {Carte[]} affiches
 * @returns {Carte[]}
 */
function deuxOnglets(premier, second, affiches) {
  return [premier, ...affiches.slice(0, 1), second, ...affiches.slice(1)];
}

/**
 * Lance l’accueil. Renvoie de quoi le démonter avant de changer de page.
 * @returns {() => void}
 */
export function initAccueil() {
  const racine = document.body.dataset.racine ?? "";
  const musique = document.querySelector('[data-monde="musique"]');
  const cinema = document.querySelector('[data-monde="cinema"]');
  const moitieMusique = musique instanceof HTMLElement ? musique : null;
  const moitieCinema = cinema instanceof HTMLElement ? cinema : null;

  /** @type {Array<() => void>} */
  const demontages = [];
  let actif = true;

  /** Le tirage de l’arrivée, un par format (ordinateur, téléphone) :
      les deux murs le partagent. */
  /** @type {Map<boolean, Colonne[]>} */
  const tirages = new Map();

  /**
   * Les quatre (ou deux) colonnes de l’accueil, tirées au sort une fois.
   * @param {Carte[]} musique
   * @param {Carte[]} cinema
   * @param {boolean} ordinateur
   * @returns {Colonne[]}
   */
  const colonnes = (musique, cinema, ordinateur) => {
    const deja = tirages.get(ordinateur);
    if (deja) return deja;
    const o = onglets();
    const largeurMur = moitieMusique?.clientWidth || window.innerWidth / 2;
    const largeur = ordinateur ? largeurMur / 2 : largeurMur;
    const ecran = (moitieMusique?.clientHeight || window.innerHeight) / Math.max(1, largeur);
    const m = melanger(musique);
    const c = melanger(cinema);
    /** @type {Colonne[]} */
    let liste;
    if (ordinateur) {
      const tirage = tirerOrdinateur(ecran);
      const cases = [
        [o.agenda, ...m],
        [o.musique, ...decaler(m)],
        [o.cinema, ...c],
        [o.infos, ...decaler(c)],
      ];
      liste = cases.map((cartes, i) => {
        const { haut = 0, taille = ONGLET_MIN } = tirage[i] ?? {};
        const [onglet, ...reste] = cartes;
        return { cartes: onglet ? [{ ...onglet, hauteur: taille }, ...reste] : reste, depart: -haut / AFFICHE, rubrique: taille };
      });
    } else {
      const tirage = tirerTelephone(ecran);
      const paires = [
        [o.agenda, o.musique, m],
        [o.cinema, o.infos, c],
      ];
      liste = paires.map(([premier, second, affiches], i) => {
        const { haut = 0, tailles = [ONGLET_MIN, ONGLET_MAX] } = tirage[i] ?? {};
        const cartes = deuxOnglets(
          { .../** @type {Carte} */ (premier), hauteur: tailles[0] },
          { .../** @type {Carte} */ (second), hauteur: tailles[1] },
          /** @type {Carte[]} */ (affiches)
        );
        return { cartes, depart: -haut / AFFICHE, rubrique: tailles[0] };
      });
    }
    tirages.set(ordinateur, liste);
    return liste;
  };

  /** @param {Carte[]} musique @param {Carte[]} cinema */
  const monter = (musique, cinema) => {
    demontages.push(
      remplir(moitieMusique, (ordinateur) => colonnes(musique, cinema, ordinateur).slice(0, ordinateur ? 2 : 1), racine)
    );
    demontages.push(remplir(moitieCinema, (ordinateur) => colonnes(musique, cinema, ordinateur).slice(ordinateur ? 2 : 1), racine));
  };

  chargerProgramme()
    .then((programme) => {
      if (actif) monter(cartesMusique(programme), cartesCinema(programme));
    })
    .catch((/** @type {unknown} */ erreur) => {
      /* Sans programme, les onglets restent : on peut toujours aller ailleurs. */
      console.warn("Minimum : programme indisponible.", erreur);
      if (actif) monter([], []);
    });

  return () => {
    actif = false;
    for (const demonter of demontages) demonter();
  };
}
