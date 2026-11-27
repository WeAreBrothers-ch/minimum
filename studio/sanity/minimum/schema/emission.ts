import { PlayIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

import { jourEnLettres } from "../dates";
import { heureValide } from "./commun";

/** Reconnaît une adresse YouTube : youtube.com/live/…, watch?v=…, youtu.be/… */
const YOUTUBE = /^https:\/\/(www\.|m\.)?(youtube\.com\/(live\/|watch\?|embed\/)|youtu\.be\/)/;

/* La radio de Minimum, ce sont des lives YouTube, sur la page Musique.
   Le site compose le flyer de chaque live tout seul (js/flyer.js) : il
   suffit du nom, du jour, de l'heure et du portrait. */
export const emission = defineType({
  name: "emission",
  title: "Live de la radio",
  type: "document",
  icon: PlayIcon,
  fieldsets: [{ name: "horaire", title: "Quand ?", options: { columns: 3 } }],
  fields: [
    defineField({
      name: "title",
      title: "Nom de l'artiste",
      type: "string",
      description: "Tel qu'il s'écrit en très grand sur le flyer. Ex. « DJ … ».",
      validation: (rule) => rule.required().error("Indiquez le nom de l'artiste : c'est le titre du flyer."),
    }),
    defineField({
      name: "visuel",
      title: "Portrait de l'artiste",
      type: "imageMinimum",
      description:
        "Le site en fait le flyer du live, en noir et blanc, pour l'accueil, la page Musique et Instagram. Réglez le point d'intérêt sur le visage. Sans portrait, le flyer est typographique, tout rose.",
    }),
    defineField({
      name: "date",
      title: "Jour",
      type: "date",
      fieldset: "horaire",
      options: { dateFormat: "dddd D MMMM YYYY" },
      validation: (rule) => rule.required().error("Indiquez le jour du live."),
    }),
    defineField({
      name: "heure",
      title: "Heure de début",
      type: "string",
      fieldset: "horaire",
      placeholder: "19:00",
      validation: (rule) => heureValide(rule.required()),
    }),
    defineField({
      name: "duree",
      title: "Durée en minutes",
      type: "number",
      fieldset: "horaire",
      initialValue: 60,
      description: "Le site affiche « En direct » pendant ce temps-là.",
      validation: (rule) => rule.integer().min(5).max(720),
    }),
    defineField({
      name: "video",
      title: "Adresse YouTube du live",
      type: "url",
      description:
        "Facultatif avant le live : la page Musique montre alors le direct de la chaîne. Après le live, collez ici l'adresse de la vidéo (youtube.com/live/… ou watch?v=…) : elle passe dans « À revoir ».",
      validation: (rule) =>
        rule.custom((adresse) =>
          !adresse || YOUTUBE.test(adresse) ? true : "Collez une adresse YouTube complète, ex. https://www.youtube.com/watch?v=…",
        ),
    }),
    defineField({
      name: "artiste",
      title: "Fiche de l'artiste (facultatif)",
      type: "reference",
      to: [{ type: "artiste" }],
      description: "Si l'artiste a sa fiche : son compte Instagram et sa présentation sont repris dans le post.",
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      description: "Facultatif. Une ou deux phrases pour la légende Instagram.",
      validation: (rule) => rule.max(600).warning("Très long : pensez au téléphone."),
    }),
  ],
  orderings: [
    { name: "recents", title: "Les plus récents d'abord", by: [{ field: "date", direction: "desc" }, { field: "heure", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", date: "date", heure: "heure", video: "video", media: "visuel" },
    prepare: ({ title, date, heure, video, media }) => ({
      title,
      subtitle: [jourEnLettres(date), heure, video ? "vidéo en ligne" : null].filter(Boolean).join(" · "),
      media,
    }),
  },
});
