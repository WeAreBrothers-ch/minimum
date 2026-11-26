import { imageMinimum } from "./objects/imageMinimum";

import { film } from "./film";
import { screening } from "./screening";
import { sansFilm } from "./sansFilm";
import { evenement } from "./evenement";
import { histoire } from "./histoire";
import { siteSettings } from "./siteSettings";
import { abonnements } from "./abonnements";
import { location } from "./location";
import { commande } from "./commande";

/* Propre à Minimum : la Musique (soirées du club, lives de la radio, artistes). */
import { soiree } from "../minimum/schema/soiree";
import { artiste } from "../minimum/schema/artiste";
import { emission } from "../minimum/schema/emission";
import { tarif } from "../minimum/schema/tarif";
import { passage } from "../minimum/schema/passage";
import { journalBanque } from "../minimum/schema/journal-banque";

export const schemaTypes = [
  // Brique réutilisée par toutes les images du site
  imageMinimum,

  // Contenu courant
  film,
  screening,
  // Vacances, projection privée : posées dans la grille à la place d'un film
  sansFilm,
  evenement,

  // La Musique : soirées du club, lives YouTube de la radio, artistes
  soiree,
  emission,
  artiste,
  tarif,
  passage,

  // Documents uniques (une seule fiche pour tout le site)
  siteSettings,
  abonnements,
  location,
  histoire,

  // Billetterie : créé automatiquement par le serveur, jamais à la main
  commande,

  // Films partagés avec l'autre cinéma : le carnet que le Studio tient seul
  journalBanque,
];

/** Types dont il n'existe qu'une seule fiche : pas de bouton « créer ». */
export const typesUniques = ["siteSettings", "abonnements", "location", "histoire"];

/** Types que personne ne crée à la main depuis le Studio. */
export const typesNonCreables = [...typesUniques, "commande", "journalBanque"];
