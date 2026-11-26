import { DocumentVideoIcon } from "@sanity/icons/DocumentVideo";
import { defineArrayMember, defineField, defineType } from "sanity";
import { SeancesDuFilm } from "../../composants/seances-du-film";
import { champAdresse, FIELDSET_ADRESSE } from "../shared/adresse";

const STATUTS = [
  { title: "À l'affiche", value: "a-laffiche" },
  { title: "Avant-première", value: "avant-premiere" },
  { title: "Première", value: "premiere" },
  { title: "Projection extraordinaire", value: "projection-extraordinaire" },
  { title: "Prochainement", value: "prochainement" },
  { title: "Cycle / ciné-club", value: "cycle" },
  { title: "Terminé", value: "passe" },
];

export const film = defineType({
  name: "film",
  type: "document",
  icon: DocumentVideoIcon,
  groups: [
    { name: "fiche", title: "La fiche", default: true },
    { name: "seances", title: "Séances" },
    { name: "medias", title: "Images et liens" },
  ],
  fieldsets: [FIELDSET_ADRESSE],
  fields: [
    defineField({
      name: "title",
      title: "Titre du film",
      type: "string",
      group: "fiche",
      validation: (rule) => rule.required().error("Le titre est obligatoire."),
    }),
    defineField({
      name: "poster",
      title: "Affiche du film",
      type: "imageMinimum",
      group: "fiche",
      description:
        "Glissez l'affiche ici. Image verticale (portrait), 800 px de large au moins. C'est LA seule affiche du film : elle s'affiche sur le mur de l'accueil, la page Cinéma, la fiche du film, l'agenda et les posts Instagram.",
      validation: (rule) =>
        rule.required().error("Un film sans affiche ne peut pas être publié : c'est elle qui le représente sur tout le site."),
    }),
    defineField({
      name: "director",
      title: "Réalisation",
      type: "string",
      group: "fiche",
      description: "Ex. Francesco Sossai. Plusieurs noms : séparez par « & ».",
      validation: (rule) => rule.required().error("Indiquez qui a réalisé le film."),
    }),
    defineField({
      name: "cast",
      title: "Avec",
      type: "string",
      group: "fiche",
      description: "Facultatif. La distribution principale, ex. « Léa Seydoux, Vincent Lindon ».",
    }),
    defineField({
      name: "duration",
      title: "Durée en minutes",
      type: "number",
      group: "fiche",
      description:
        "Uniquement le nombre, ex. 94. C'est la durée qui permet au Studio de repérer deux séances qui se chevaucheraient dans la salle.",
      validation: (rule) =>
        rule.min(1).max(600).warning("Sans durée, le Studio ne peut pas repérer deux films qui se chevauchent."),
    }),
    defineField({
      name: "year",
      title: "Année de sortie",
      type: "number",
      group: "fiche",
      validation: (rule) => rule.min(1895).max(2035).warning("Cette année semble inhabituelle : vérifiez la saisie."),
    }),
    defineField({
      name: "country",
      title: "Pays",
      type: "string",
      group: "fiche",
      description: "Ex. Suisse, France. Coproduction : « Suisse / France ».",
    }),
    defineField({
      name: "originalTitle",
      title: "Titre original",
      type: "string",
      group: "fiche",
      description: "Seulement si le film sort sous un autre titre chez nous.",
    }),
    defineField({
      name: "language",
      title: "Version",
      type: "string",
      group: "fiche",
      description: "Ex. VOSTFR, VF, VO anglais.",
    }),
    defineField({
      name: "subtitles",
      title: "Sous-titres",
      type: "string",
      group: "fiche",
      description: "Ex. st fr, st fr/all. Laissez vide s'il n'y en a pas.",
    }),
    defineField({
      name: "ageRating",
      title: "Âge légal / âge conseillé",
      type: "string",
      group: "fiche",
      description: "Ex. 12/14 ans, ou « Tous publics ».",
    }),
    defineField({
      name: "typeDeFilm",
      title: "Type de film",
      type: "string",
      group: "fiche",
      description: "Écrit tel qu'il s'affichera. Ex. Documentaire, Fiction, Animation.",
    }),
    defineField({
      name: "mention",
      title: "Distinction (facultatif)",
      type: "string",
      group: "fiche",
      description: "Ex. « Meilleur documentaire, Oscar 2026 », « Léopard d'or, Locarno 2025 ».",
    }),
    defineField({
      name: "synopsis",
      type: "text",
      rows: 6,
      group: "fiche",
      description: "Le résumé affiché sur la fiche du film. Deux à six phrases suffisent.",
      validation: (rule) => rule.max(1200).warning("Très long : au-delà de 1200 signes, le texte devient pénible à lire sur téléphone."),
    }),
    defineField({
      name: "statuts",
      title: "Où en est ce film ?",
      type: "array",
      group: "fiche",
      of: [defineArrayMember({ type: "string" })],
      options: { list: STATUTS, layout: "grid" },
      initialValue: ["a-laffiche"],
      description:
        "Cochez une ou plusieurs cases : le film apparaît dans chaque rubrique cochée. « Terminé » ne se combine avec rien : le film sort des pages publiques mais reste consultable ici.",
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .error("Cochez au moins une case.")
          .custom((valeur) =>
            Array.isArray(valeur) && valeur.includes("passe") && valeur.length > 1
              ? "« Terminé » ne se combine avec aucune autre case."
              : true,
          ),
    }),
    defineField({
      name: "releaseDate",
      title: "Date de sortie",
      type: "date",
      group: "fiche",
      options: { dateFormat: "DD/MM/YYYY" },
      description:
        "Le jour où le film arrive chez nous. La fiche annonce alors « À partir du mercredi 12 mars ». Laissez vide si la date n'est pas encore connue.",
      hidden: ({ document }) => !(Array.isArray(document?.statuts) && document.statuts.includes("prochainement")),
    }),
    defineField({
      name: "seancesDuFilm",
      title: "Séances de ce film",
      type: "string",
      group: "seances",
      description: "Les horaires auxquels ce film passe. Tout se règle ici, sans quitter la fiche.",
      components: { input: SeancesDuFilm },
      readOnly: true,
    }),
    defineField({
      name: "presence",
      title: "Séance en présence de…",
      type: "string",
      group: "seances",
      description:
        "Le nom de l'invité·e, écrit tel qu'il doit se lire après « En présence de ». Ex. « la réalisatrice Jeanne Dupont », « l'équipe du film ». Laissez vide s'il n'y a pas d'invité.",
    }),
    defineField({
      name: "presenceDate",
      title: "Jour de cette séance",
      type: "date",
      group: "seances",
      options: { dateFormat: "DD/MM/YYYY" },
      description: "Le jour où l'invité·e sera là. Laissez vide s'il est présent à toutes les séances.",
      hidden: ({ document }) => !document?.presence,
    }),
    defineField({
      name: "stillImages",
      title: "Photos du film",
      type: "array",
      group: "medias",
      description: "Facultatif. Images horizontales tirées du film, affichées sous le synopsis. Glissez-les pour changer l'ordre.",
      of: [defineArrayMember({ type: "imageMinimum" })],
    }),
    defineField({
      name: "trailerUrl",
      title: "Bande-annonce",
      type: "url",
      group: "medias",
      description: "Collez l'adresse complète de la vidéo YouTube ou Vimeo.",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "presseUrl",
      title: "Article de presse",
      type: "url",
      group: "medias",
      description: "Facultatif. La fiche du film affiche alors un lien « Presse ».",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "liens",
      title: "Autres liens",
      type: "array",
      group: "medias",
      description: "Critiques, entretiens, site du distributeur.",
      of: [defineArrayMember({ type: "lien" })],
    }),
    champAdresse("title"),
  ],
  orderings: [
    { name: "titre", title: "Titre (A → Z)", by: [{ field: "title", direction: "asc" }] },
    { name: "recents", title: "Derniers ajoutés", by: [{ field: "_createdAt", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", director: "director", year: "year", media: "poster" },
    prepare: ({ title, director, year, media }) => ({
      title,
      subtitle: [director, year].filter(Boolean).join(" · "),
      media,
    }),
  },
});
