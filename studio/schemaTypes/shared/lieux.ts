/** Les espaces de Minimum, tels qu'ils s'écrivent sur le site. */
export const ESPACES = ["Salle de cinéma", "Club", "Studio radio"] as const;

export const LISTE_ESPACES = ESPACES.map((nom) => ({ title: nom, value: nom }));

export const ETATS_VENTE = [
  { title: "Places disponibles", value: "disponible" },
  { title: "Complet", value: "complet" },
  { title: "Annulée", value: "annule" },
];
