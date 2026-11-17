// @ts-check
/* Minimum : les réglages du site. Rien de secret ici : ces valeurs sont
   visibles par tous les visiteurs, comme sur n’importe quel site. */

/** Projet Sanity partagé avec Zinéma : le catalogue de films est commun. */
export const SANITY = Object.freeze({
  projet: "vle63mzm",
  jeu: "production",
  version: "2024-06-01",
});

/** Le lieu, tel qu’il est noté sur les séances et les soirées dans Sanity. */
export const LIEU = "minimum";

/** Le flux en direct de la radio. null tant que le client ne l’a pas fourni :
    le lecteur l’annonce au lieu de faire semblant de jouer.
    @type {string | null} */
export const FLUX_RADIO = null;

/** Tant que Minimum n’a pas ses séances dans Sanity, le site montre le
    programme réel de la semaine du 11 au 17 novembre 2026, repris de
    cineminimum.ch, et des soirées et émissions d’essai.
    Passer à false le jour où le Studio est branché. */
export const DEMONSTRATION = true;

/** Le jour que la démonstration fait comme si c’était aujourd’hui. */
export const JOUR_DE_DEMONSTRATION = "2026-11-11";

/** La caisse en ligne.
    « demonstration » : on choisit, on compte, on remplit, puis on passe
    directement au billet, sans paiement ni encaissement.
    « ouverte » : le serveur du site (dossier api/) crée le paiement chez
    SumUp. Il faut le compte SumUp de Minimum et les clés (LISEZ-MOI.md).
    « fermee » : pas de vente en ligne, seulement la buvette.
    @type {"demonstration" | "ouverte" | "fermee"} */
export const BILLETTERIE = "demonstration";

/** Au-delà, on demande d’écrire au lieu (même limite que le serveur). */
export const MAX_BILLETS = 10;

/** Où se trouve le lieu, tel qu’écrit sur les billets. */
export const ADRESSE_BILLET = "Minimum, La Case à Chocs, quai Philippe-Godet 20, Neuchâtel";
