import { LinkIcon } from "@sanity/icons/Link";
import { defineField, defineType } from "sanity";

/** Un lien vers un texte ou une page hors du site : critique, article, distributeur. */
export const lien = defineType({
  name: "lien",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "genre",
      title: "Type de lien",
      type: "string",
      description: "Ex. Critique, Article, Entretien, Distribution.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "source",
      type: "string",
      description: "Qui publie. Ex. Le Temps, RTS, Le Polyester.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      title: "Adresse complète",
      type: "url",
      validation: (rule) => rule.required().uri({ scheme: ["http", "https"] }),
    }),
  ],
  preview: { select: { title: "source", subtitle: "genre" } },
});
