import { BookIcon } from "@sanity/icons/Book";
import { defineArrayMember, defineField, defineType } from "sanity";

export const histoire = defineType({
  name: "histoire",
  title: "Histoire du lieu",
  type: "document",
  icon: BookIcon,
  fields: [
    defineField({
      name: "intro",
      title: "Phrase d'accueil",
      type: "text",
      rows: 3,
      description: "Une ou deux phrases : ce qu'est Minimum, et depuis quand.",
      validation: (rule) => rule.max(400).warning("Au-delà de 400 signes, la phrase d'accueil cesse d'être lue."),
    }),
    defineField({
      name: "etapes",
      title: "Les étapes de la frise",
      type: "array",
      description: "Les moments de l'histoire du lieu, du plus ancien au plus récent.",
      of: [
        defineArrayMember({
          type: "object",
          name: "etape",
          title: "Étape",
          fields: [
            defineField({
              name: "year",
              title: "Année ou période",
              type: "string",
              description: "Ex. 2009, ou 2010–2012.",
              validation: (rule) => rule.required().error("Indiquez l'année."),
            }),
            defineField({
              name: "title",
              title: "Titre de l'étape",
              type: "string",
              validation: (rule) => rule.required().error("Donnez un titre à l'étape."),
            }),
            defineField({ name: "body", title: "Texte", type: "texteRiche" }),
            defineField({ name: "image", title: "Photo d'archive", type: "imageMinimum" }),
          ],
          preview: { select: { title: "title", subtitle: "year", media: "image" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Histoire du lieu" }) },
});
