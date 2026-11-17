// @ts-check
/* Minimum : le vrai programme de la semaine du 11 au 17 novembre 2026,
   repris de cineminimum.ch (résumés reformulés, liens et bandes-annonces
   tels que publiés). Les affiches viennent du catalogue commun (Sanity). */

/** @typedef {import("../types.js").Film} Film */
/** @typedef {import("../types.js").Seance} Seance */
/** @typedef {import("../types.js").Tarif} Tarif */

/** Les tarifs du cinéma, ceux de la page Infos. L’AG culturel (CHF 0.–)
    ne se vend pas en ligne : il se présente à la buvette.
    @type {Tarif[]} */
export const TARIFS_CINEMA_DEMO = [
  { cle: "ordinaire", libelle: "Ordinaire", detail: null, prix: 16 },
  { cle: "avs", libelle: "AVS, AI, chômeur.euse.s", detail: null, prix: 14 },
  {
    cle: "soutien",
    libelle: "Réduit",
    detail: "Membres de soutien, abonné.e.s au journal Le Courrier, étudiant.e.s, carte Culture Caritas",
    prix: 10,
  },
];

/**
 * Les champs communs à tous les films de la démonstration.
 * @param {Pick<Film, "id" | "titre" | "realisation" | "pays" | "annee" | "duree" | "version" | "age" | "genre" | "resume"> & Partial<Film>} film
 * @returns {Film}
 */
function film(film) {
  return {
    avec: null, mention: null, bandeAnnonce: null, liens: [], sortie: null, affiche: null,
    titreOriginal: null, presence: null, presenceJour: null, photos: [],
    ...film,
  };
}

/** @type {Film[]} */
export const FILMS_DEMO = [
  film({
    id: "mr-nobody-against-putin", titre: "Mr. Nobody Against Putin",
    realisation: "David Borenstein et Pavel Ilyich Talankin", pays: "Danemark, Tchéquie, Allemagne",
    annee: 2025, duree: 90, version: "VOSTFR", age: "16/16 ans", genre: "Documentaire",
    mention: "Meilleur documentaire, Oscar 2026",
    resume: "Dans une ville de l’Oural, un enseignant filme en secret, pendant deux ans, l’endoctrinement patriotique et militariste imposé aux écoliers après l’invasion de l’Ukraine. Un acte de résistance qui met sa vie en danger.",
    bandeAnnonce: "https://www.youtube.com/watch?v=qufodzXdabg",
    liens: [{ genre: "Distribution", source: "Let’s Doc", url: "https://letsdoc.ch/fr/pro/films/mr-nobody-against-putin" }],
  }),
  film({
    id: "garance", titre: "Garance", realisation: "Jeanne Herry", pays: "France",
    annee: 2026, duree: 105, version: "VF", age: "10/10 ans", genre: "Fiction",
    resume: "Sur huit ans, une jeune actrice alcoolique traverse déménagements, travail, rencontres et épreuves : un parcours de libération intime, amicale et sexuelle, entre excès et destruction.",
    bandeAnnonce: "https://www.youtube.com/watch?v=kgG4W6-RZyQ",
    liens: [{ genre: "Article", source: "Cineuropa", url: "https://cineuropa.org/fr/newsdetail/491552/" }],
  }),
  film({
    id: "nicole-nicole", titre: "Nicole Nicole", realisation: "Lauren Dällenbach", pays: "Suisse",
    annee: 2026, duree: 94, version: "VOSTFR", age: "16/16 ans", genre: "Documentaire",
    resume: "Nicole vit depuis plus de cinquante ans avec sa mère, dans la maison familiale. Sa nièce Lauren la filme et accompagne son émancipation.",
    bandeAnnonce: "https://www.youtube.com/watch?v=LTNtRLSrizE",
    liens: [{ genre: "Article", source: "RTS", url: "https://www.rts.ch/info/culture/cinema/2026/article/nicole-nicole-le-film-de-lauren-dallenbach-sur-sa-tante-atypique-29399567.html" }],
  }),
  film({
    id: "dentro", titre: "Dentro", realisation: "Elsa Amiel", pays: "France",
    annee: 2026, duree: 94, version: "VOSTFR", age: "16/16 ans", genre: "Documentaire",
    resume: "À la prison de Volterra, en Toscane, Armando Punzo monte depuis trente ans des spectacles avec des détenus. Le film mêle théâtre et cinéma, et fait de ce lieu une expérience paradoxale de liberté.",
    bandeAnnonce: "https://www.youtube.com/watch?v=Me118VCUlcI",
    liens: [{ genre: "Critique", source: "Film Fest Report", url: "https://film-fest-report.com/visions-du-reel-2026-dentro-real-elsa-amiel-critique/" }],
  }),
  film({
    id: "ingeborg-bachmann", titre: "Ingeborg Bachmann", realisation: "Regina Schilling",
    avec: "Sandra Hüller", pays: "Allemagne",
    annee: 2026, duree: 97, version: "VOSTFR", age: "6/12 ans", genre: "Documentaire",
    resume: "Une quête poétique sur les traces de la poétesse autrichienne, de son enfance en Carinthie à ses derniers jours à Rome, entre improvisations, archives et textes.",
    bandeAnnonce: "https://youtu.be/R7YEath41k8",
    liens: [{ genre: "Critique", source: "Le Polyester", url: "https://lepolyester.com/critique-ingeborg-bachmann-someone-who-was-once-me/" }],
  }),
  film({
    id: "enjoy-your-stay", titre: "Enjoy Your Stay",
    realisation: "Dominique Locher et Mary Honeylyn Joy Alipo", pays: "Suisse",
    annee: 2026, duree: 99, version: "VOSTFR", age: "16/16 ans", genre: "Fiction", sortie: "2026-11-18",
    resume: "Une femme de ménage philippine sans papiers travaille au noir à Verbier. Pour rentrer à Manille et défendre la garde de sa fille, elle doit réunir d’urgence une grosse somme.",
    bandeAnnonce: "https://www.youtube.com/watch?v=ZVooUpk6XS0",
    liens: [{ genre: "Distribution", source: "Cineworx", url: "https://cineworx.ch/movie/enjoy-your-stay-2/" }],
  }),
  film({
    id: "une-usine-en-catalogne", titre: "Une usine en Catalogne", realisation: "Helena Dali", pays: "Suisse",
    annee: 2025, duree: 65, version: "VOSTFR", age: "16/16 ans", genre: "Documentaire", sortie: "2026-12-09",
    resume: "La vie de César Dubler, émigré suisse devenu entrepreneur à Barcelone, entre révolution, expropriation, guerre civile et franquisme. À partir des souvenirs de famille et des archives, la réalisatrice lutte contre l’oubli.",
    bandeAnnonce: "https://vimeo.com/1185454429",
    liens: [{ genre: "Fiche", source: "Swiss Films", url: "https://www.swissfilms.ch/fr/movie/eine-fabrik-in-katalonien/fa2991584cd846739348ac5ba63e6604" }],
  }),
  film({
    id: "mit-einem-tiger-schlafen", titre: "Mit einem Tiger schlafen", realisation: "Anja Salomonowitz",
    avec: "Birgit Minichmayr", pays: "Autriche",
    annee: 2024, duree: 107, version: "VOSTFR", age: "12/16 ans", genre: "Documentaire", sortie: "2026-12-16",
    resume: "Portrait poétique de la peintre autrichienne Maria Lassnig, de son enfance difficile à son succès tardif, dans un monde de l’art dominé par les hommes.",
    bandeAnnonce: "https://www.youtube.com/watch?v=G7_Oe-COhZ4",
    liens: [{ genre: "Distribution", source: "Xenix Film", url: "https://www.xenixfilm.ch/de/film_info.php?ID=12100" }],
  }),
];

/**
 * @param {string} filmId
 * @param {string} date
 * @param {string} heure
 * @returns {Seance}
 */
function seance(filmId, date, heure) {
  return { id: `${filmId}-${date}-${heure.replace(":", "")}`, filmId, date, heure };
}

/** @type {Seance[]} */
export const SEANCES_DEMO = [
  seance("mr-nobody-against-putin", "2026-11-11", "19:00"),
  seance("garance", "2026-11-11", "21:00"),
  seance("dentro", "2026-11-12", "19:00"),
  seance("nicole-nicole", "2026-11-12", "21:00"),
  seance("garance", "2026-11-13", "19:00"),
  seance("dentro", "2026-11-13", "21:00"),
  seance("nicole-nicole", "2026-11-14", "19:00"),
  seance("mr-nobody-against-putin", "2026-11-14", "21:00"),
  seance("ingeborg-bachmann", "2026-11-15", "17:00"),
  seance("dentro", "2026-11-15", "19:00"),
  seance("ingeborg-bachmann", "2026-11-16", "19:00"),
  seance("nicole-nicole", "2026-11-16", "21:00"),
  seance("mr-nobody-against-putin", "2026-11-17", "19:00"),
  seance("garance", "2026-11-17", "21:00"),
];
