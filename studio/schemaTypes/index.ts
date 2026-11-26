import { abonnements } from "./documents/abonnements";
import { artiste } from "./documents/artiste";
import { commande } from "./documents/commande";
import { emission } from "./documents/emission";
import { evenement } from "./documents/evenement";
import { film } from "./documents/film";
import { histoire } from "./documents/histoire";
import { location } from "./documents/location";
import { reglagesMinimum } from "./documents/reglages-minimum";
import { sansFilm } from "./documents/sans-film";
import { screening } from "./documents/screening";
import { soiree } from "./documents/soiree";
import { imageMinimum } from "./objects/image-minimum";
import { lien } from "./objects/lien";
import { passage } from "./objects/passage";
import { tarif } from "./objects/tarif";
import { texteRiche } from "./objects/texte-riche";

export const schemaTypes = [
  film,
  screening,
  sansFilm,
  soiree,
  artiste,
  emission,
  evenement,
  commande,
  reglagesMinimum,
  abonnements,
  location,
  histoire,
  imageMinimum,
  tarif,
  passage,
  lien,
  texteRiche,
];

/** Les documents uniques : un seul exemplaire, à identifiant fixe. */
export const UNIQUES = ["reglagesMinimum", "abonnements", "location", "histoire"];
