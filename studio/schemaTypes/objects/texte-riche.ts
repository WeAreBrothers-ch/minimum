import { defineArrayMember, defineType } from "sanity";

/** Un texte mis en forme simplement : gras, listes, liens. Jamais d'italique sur le site de Minimum. */
export const texteRiche = defineType({
  name: "texteRiche",
  title: "Texte",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Texte", value: "normal" },
        { title: "Intertitre", value: "h3" },
      ],
      lists: [
        { title: "Liste à puces", value: "bullet" },
        { title: "Liste numérotée", value: "number" },
      ],
      marks: {
        decorators: [{ title: "Gras", value: "strong" }],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Lien",
            fields: [
              {
                name: "href",
                type: "url",
                title: "Adresse",
                validation: (rule) => rule.uri({ scheme: ["http", "https", "mailto", "tel"] }),
              },
            ],
          },
        ],
      },
    }),
  ],
});
