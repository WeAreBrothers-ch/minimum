import { ImageIcon } from "@sanity/icons/Image";
import { defineField, defineType } from "sanity";

/** Une image du site, avec sa description pour les personnes qui ne la voient pas. */
export const imageMinimum = defineType({
  name: "imageMinimum",
  title: "Image",
  type: "image",
  icon: ImageIcon,
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Description de l'image",
      type: "string",
      description:
        "Une phrase qui décrit ce qu'on voit, pour les lecteurs d'écran et Google. Laissez vide : le site écrit alors « Affiche de… » tout seul.",
    }),
  ],
});
