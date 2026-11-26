import { ClockIcon } from "@sanity/icons/Clock";
import { defineField, defineType } from "sanity";
import { heureValide } from "../shared/heure";

/** Un passage dans la nuit : qui joue, à quelle heure. */
export const passage = defineType({
  name: "passage",
  type: "object",
  icon: ClockIcon,
  fields: [
    defineField({
      name: "artiste",
      title: "Qui joue ?",
      type: "reference",
      to: [{ type: "artiste" }],
      description: "Choisissez l'artiste, ou créez sa fiche ici même : sa photo et son compte Instagram servent au post Instagram.",
      validation: (rule) => rule.required().error("Choisissez l'artiste."),
    }),
    defineField({
      name: "debut",
      title: "Heure de passage",
      type: "string",
      placeholder: "23:00",
      description: "Facultatif. Sur 24 heures, ex. 01:30.",
      validation: heureValide,
    }),
    defineField({
      name: "precision",
      title: "Type de passage",
      type: "string",
      initialValue: "DJ set",
      options: { list: ["DJ set", "Live", "B2B", "Concert", "Performance", "Warm-up"] },
    }),
  ],
  preview: {
    select: { nom: "artiste.nom", debut: "debut", precision: "precision", media: "artiste.photo" },
    prepare: ({ nom, debut, precision, media }) => ({
      title: nom ?? "Artiste à choisir",
      subtitle: [debut, precision].filter(Boolean).join(" · "),
      media,
    }),
  },
});
