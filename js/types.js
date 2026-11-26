// @ts-check
/* Minimum : les formes de données partagées par tout le site.
   Vérifiées par TypeScript (npm run verifier), sans étape de construction. */

/**
 * @typedef {Object} Image
 * @property {string} url    Adresse de l’image (Sanity, ou chemin du site), sans paramètres.
 * @property {string} alt    Description en une phrase.
 * @property {number} [largeur]  Dimensions réelles, pour réserver la place avant le chargement.
 * @property {number} [hauteur]
 */

/**
 * Un lien vers un texte ou une fiche hors du site.
 * @typedef {Object} Lien
 * @property {string} genre    « Critique », « Article », « Distribution »…
 * @property {string} source   « Le Polyester », « RTS »…
 * @property {string} url
 */

/**
 * @typedef {Object} Film
 * @property {string} id
 * @property {string} titre
 * @property {string} realisation
 * @property {string | null} avec        Distribution principale, si le programme la cite.
 * @property {string} pays
 * @property {number} annee
 * @property {number} duree       En minutes.
 * @property {string} version     « VOSTFR », « VF »…
 * @property {string} age         « 16/16 ans »…
 * @property {string} genre       « Documentaire », « Fiction »…
 * @property {string} resume
 * @property {string | null} mention      « Meilleur documentaire, Oscar 2026 »…
 * @property {string | null} bandeAnnonce Adresse YouTube ou Vimeo.
 * @property {Lien[]} liens
 * @property {string | null} sortie   Date de sortie AAAA-MM-JJ, si le film est annoncé.
 * @property {Image | null} affiche
 * @property {string | null} titreOriginal  Seulement s’il diffère du titre.
 * @property {string | null} presence       L’invité·e, écrit pour suivre « En présence de » :
 *                                          « la réalisatrice Jeanne Dupont ».
 * @property {string | null} presenceJour   AAAA-MM-JJ. null : présent·e à toutes les séances.
 * @property {Image[]} photos               Images tirées du film.
 */

/**
 * @typedef {Object} Seance
 * @property {string} id
 * @property {string} filmId
 * @property {string} date   AAAA-MM-JJ
 * @property {string} heure  HH:MM
 * @property {"complet" | "annule"} [etat]  Absent : il reste des places.
 */

/**
 * Un tarif en vente en ligne. Le prix affiché n’engage que l’affichage :
 * le serveur recalcule toujours le montant à partir de ses propres tarifs.
 * @typedef {Object} Tarif
 * @property {string} cle       Identifiant stable : « ordinaire », « avs »…
 * @property {string} libelle
 * @property {string | null} detail   À qui il s’adresse.
 * @property {number} prix      En francs.
 */

/**
 * Un passage dans la nuit : qui joue, à quelle heure.
 * @typedef {Object} Passage
 * @property {string} debut  HH:MM
 * @property {string} nom
 * @property {string} precision  « DJ set », « Live »…
 */

/**
 * @typedef {Object} Soiree
 * @property {string} id
 * @property {string} titre
 * @property {string} date   AAAA-MM-JJ
 * @property {string} heure  HH:MM, ouverture des portes.
 * @property {string | null} fin   HH:MM, fermeture.
 * @property {string | null} description
 * @property {Passage[]} lineUp
 * @property {string | null} age
 * @property {Tarif[]} tarifs
 * @property {Image | null} affiche
 */

/**
 * Un live de la radio, sur YouTube.
 * @typedef {Object} Emission
 * @property {string} id
 * @property {string} titre  Le nom de l’artiste (« DJ … »).
 * @property {string} date   AAAA-MM-JJ
 * @property {string} heure  HH:MM
 * @property {boolean} enDirect
 * @property {string | null} video   Adresse YouTube du live (youtube.com/live/…, watch?v=…) ; null si pas encore en ligne.
 * @property {Image | null} visuel  Le portrait de l’artiste : le site en fait le flyer du live.
 */

/**
 * @typedef {Object} Programme
 * @property {Film[]} films
 * @property {Seance[]} seances
 * @property {Tarif[]} tarifsCinema
 * @property {Soiree[]} soirees
 * @property {Emission[]} emissions
 * @property {string} aujourdhui   La date de référence (AAAA-MM-JJ).
 */

/**
 * Ce qu’on peut acheter : une séance de cinéma ou une soirée.
 * @typedef {Object} Evenement
 * @property {"seance" | "soiree"} genre
 * @property {string} id
 * @property {string} titre
 * @property {string} date
 * @property {string} heure
 */

/**
 * Une case du mur d’accueil : une affiche, ou une rubrique du site.
 * @typedef {Object} Carte
 * @property {"film" | "soiree" | "emission" | "rubrique"} genre
 * @property {string} id
 * @property {string} titre
 * @property {string} lien        Adresse relative à la racine du site.
 * @property {Image | null} image
 * @property {string} ligne       Une ligne d’information (date, réalisation…).
 * @property {string} etat        « À l’affiche », « En direct », « Soirée »…
 * @property {"cinema" | "musique" | "radio" | "agenda" | "infos"} [teinte]  Une rubrique : sa couleur.
 * @property {Emission} [live]    Un live : de quoi composer son flyer.
 * @property {number} [hauteur]   Une rubrique du mur : sa hauteur, en largeurs de colonne.
 */

export {};
