import { BlockElementIcon } from "@sanity/icons/BlockElement";
import { defineField, defineType } from "sanity";
import { heureValide, jourEnLettres } from "../shared/heure";
import { LISTE_ESPACES } from "../shared/lieux";

const LIBELLES = ["Projection privée", "Soirée privée", "Vacances"];

export const sansFilm = defineType({
  name: "sansFilm",
  title: "Case sans film",
  type: "document",
  icon: BlockElementIcon,
  fields: [
    defineField({
      name: "libelle",
      title: "Quoi ?",
      type: "string",
      options: { list: LIBELLES, layout: "radio" },
      description:
        "« Vacances » ferme toute la journée : l'agenda l'annonce sans heure ni lieu. Les autres s'affichent à leur heure, dans leur espace.",
      validation: (rule) => rule.required().error("Choisissez ce qui occupe cette case."),
    }),
    defineField({
      name: "date",
      title: "Jour",
      type: "date",
      options: { dateFormat: "dddd D MMMM YYYY" },
      validation: (rule) => rule.required().error("Indiquez le jour."),
    }),
    defineField({
      name: "time",
      title: "Heure",
      type: "string",
      placeholder: "19:00",
      hidden: ({ document }) => document?.libelle === "Vacances",
      validation: (rule) =>
        heureValide(rule).custom((heure, contexte) =>
          contexte.document?.libelle !== "Vacances" && !heure ? "Indiquez l'heure, sous la forme 19:00." : true,
        ),
    }),
    defineField({
      name: "room",
      title: "Espace",
      type: "string",
      options: { list: LISTE_ESPACES, layout: "radio" },
      initialValue: "Salle de cinéma",
      hidden: ({ document }) => document?.libelle === "Vacances",
    }),
  ],
  orderings: [{ name: "date", title: "Par date", by: [{ field: "date", direction: "asc" }] }],
  preview: {
    select: { libelle: "libelle", date: "date", heure: "time", espace: "room" },
    prepare: ({ libelle, date, heure, espace }) => ({
      title: libelle ?? "Case sans film",
      subtitle: [jourEnLettres(date), libelle === "Vacances" ? null : heure, libelle === "Vacances" ? null : espace]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
