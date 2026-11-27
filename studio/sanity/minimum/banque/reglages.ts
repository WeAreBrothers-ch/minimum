/* Les films partagés : les deux cinémas (Zinéma et Minimum) ont les mêmes
   exploitants et passent souvent les mêmes films. Chacun garde son projet
   Sanity, mais la liste des films est la même des deux côtés : un film créé
   chez l'un ARRIVE TOUT SEUL chez l'autre, fiche et affiche copiées, rien à
   retaper (demande d'Eliott, 26.11.2026).

   Ce dossier est écrit pour servir tel quel dans les deux Studios : seules
   les valeurs de ce fichier changent d'un cinéma à l'autre.

   La lecture de l'autre projet se fait SANS jeton et sans identifiants :
   on n'y lit que ce qui est publié, comme le fait son site public. Rien ne
   peut y être écrit d'ici, même par erreur. */

/** Le cinéma de ce Studio. */
export const ICI = "Minimum";

/** L'autre cinéma, dont les films arrivent ici. */
export const AUTRE = {
  nom: "Zinéma",
  /** Son projet Sanity (public : son site l'écrit en clair). */
  projet: "vle63mzm",
  jeu: "production",
  /** Ce qui précède l'identifiant d'un film venu de là-bas : « zinema:… ». */
  cle: "zinema",
} as const;

/** Le type des images de ce Studio (schemaTypes/objects). */
export const TYPE_IMAGE = "imageMinimum";

/** Version de l'API pour lire l'autre projet. */
export const VERSION_API_BANQUE = "2024-06-01";

/** Les films de l'autre cinéma arrivent-ils tout seuls ? `false` : seulement
    à la demande, depuis l'écran « Films partagés ». */
export const ARRIVEE_AUTOMATIQUE = true;

/** Tant que le Studio reste ouvert, on regarde à nouveau toutes les cinq minutes. */
export const INTERVALLE_ARRIVEE = 5 * 60 * 1000;

/** L'état d'un film qui arrive : PAS à l'affiche. Un film créé chez l'autre
    ne doit pas se montrer au public d'ici sans qu'on l'ait décidé. */
export const ETAT_A_L_ARRIVEE = "passe";

/** Le carnet des films déjà venus de l'autre cinéma (schema/journal-banque).
    Son identifiant a un point : il n'est pas lisible sans être connecté. */
export const ID_JOURNAL = `banque.${AUTRE.cle}`;
export const TYPE_JOURNAL = "journalBanque";
