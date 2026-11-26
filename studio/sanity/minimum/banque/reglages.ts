/* La banque de films : les deux cinémas (Zinéma et Minimum) ont les mêmes
   exploitants et passent souvent les mêmes films. Chacun garde son projet
   Sanity et son catalogue, mais peut PIOCHER dans celui de l'autre : la
   fiche et l'affiche sont copiées chez lui, rien à retaper.

   Ce dossier est écrit pour servir tel quel dans les deux Studios : seules
   les valeurs de ce fichier changent d'un cinéma à l'autre.

   La lecture de l'autre projet se fait SANS jeton et sans identifiants :
   on n'y lit que ce qui est publié, comme le fait son site public. Rien ne
   peut y être écrit d'ici, même par erreur. */

/** Le cinéma de ce Studio. */
export const ICI = "Minimum";

/** L'autre cinéma, dans le catalogue duquel on pioche. */
export const AUTRE = {
  nom: "Zinéma",
  /** Son projet Sanity (public : son site l'écrit en clair). */
  projet: "vle63mzm",
  jeu: "production",
  /** Ce qui précède l'identifiant d'un film pioché : « zinema:… ». */
  cle: "zinema",
} as const;

/** Le type des images de ce Studio (schemaTypes/objects). */
export const TYPE_IMAGE = "imageMinimum";

/** Version de l'API pour lire l'autre projet. */
export const VERSION_API_BANQUE = "2024-06-01";
