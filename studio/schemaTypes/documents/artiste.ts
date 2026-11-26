import { UserIcon } from "@sanity/icons/User";
import { defineArrayMember, defineField, defineType } from "sanity";

const ROLES = ["DJ", "Live", "Groupe", "Collectif", "Radio"];
const PLATEFORMES = ["SoundCloud", "Bandcamp", "Resident Advisor", "Spotify", "YouTube", "Site web"];

export const artiste = defineType({
  name: "artiste",
  title: "Artiste / DJ",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({
      name: "nom",
      title: "Nom de scène",
      type: "string",
      validation: (rule) => rule.required().error("Indiquez le nom de l'artiste."),
    }),
    defineField({
      name: "photo",
      type: "imageMinimum",
      description:
        "La photo de presse de l'artiste. Elle sert au line-up sur le site et au post Instagram, où elle passe en noir et blanc comme sur les flyers du site. Réglez le point d'intérêt (le visage) : le cadrage s'y ajuste, en post comme en story.",
    }),
    defineField({
      name: "role",
      title: "Ce qu'il ou elle fait",
      type: "string",
      options: { list: ROLES, layout: "radio", direction: "horizontal" },
      initialValue: "DJ",
    }),
    defineField({
      name: "origine",
      title: "Vient de",
      type: "string",
      description: "Ville ou pays, et label si utile. Ex. « Neuchâtel », « Berlin · Ostgut Ton ».",
    }),
    defineField({
      name: "styles",
      title: "Styles",
      type: "array",
      description: "Tapez un style puis Entrée. Ex. techno, house, ambient. Ils deviennent des hashtags sur Instagram.",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    defineField({
      name: "bio",
      title: "Présentation",
      type: "text",
      rows: 4,
      description: "Deux ou trois phrases. Elles s'affichent sur la soirée et dans la légende Instagram.",
      validation: (rule) => rule.max(600).warning("Au-delà de 600 signes, personne ne lit la suite sur Instagram."),
    }),
    defineField({
      name: "instagram",
      title: "Compte Instagram",
      type: "string",
      placeholder: "@nom.du.compte",
      description: "Le post Instagram mentionne ce compte tout seul. Ex. @minimum.neuchatel.",
      validation: (rule) =>
        rule.regex(/^@?[A-Za-z0-9._]{1,30}$/, { name: "compte Instagram" }).error("Écrivez seulement le nom du compte, ex. @nom.du.compte."),
    }),
    defineField({
      name: "liens",
      title: "Où l'écouter",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "ecoute",
          fields: [
            defineField({
              name: "label",
              title: "Plateforme",
              type: "string",
              options: { list: PLATEFORMES },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "url",
              title: "Adresse complète",
              type: "url",
              validation: (rule) => rule.required().uri({ scheme: ["http", "https"] }),
            }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        }),
      ],
    }),
  ],
  orderings: [{ name: "nom", title: "Nom (A → Z)", by: [{ field: "nom", direction: "asc" }] }],
  preview: {
    select: { title: "nom", role: "role", origine: "origine", media: "photo" },
    prepare: ({ title, role, origine, media }) => ({ title, subtitle: [role, origine].filter(Boolean).join(" · "), media }),
  },
});
