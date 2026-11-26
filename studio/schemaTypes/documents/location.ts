import { HomeIcon } from "@sanity/icons/Home";
import { defineArrayMember, defineField, defineType } from "sanity";
import { ESPACES } from "../shared/lieux";

const ESPACES_A_LOUER = [...ESPACES, "Tout le lieu"];

export const location = defineType({
  name: "location",
  title: "Projections privées et location",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({
      name: "intro",
      title: "Phrase d'accueil",
      type: "text",
      rows: 3,
      description: "Deux ou trois phrases : à qui s'adresse la location, et ce qu'on peut y faire.",
      validation: (rule) => rule.max(600).warning("Au-delà de 600 signes, le texte cesse d'être lu."),
    }),
    defineField({
      name: "occasions",
      title: "Pour quelles occasions",
      type: "array",
      description: "Une occasion par ligne. Ex. Projection privée, Anniversaire, Séminaire, Soirée d'entreprise.",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "espaces",
      title: "Les espaces à louer",
      type: "array",
      description: "Un bloc par espace. Glissez-les pour changer l'ordre.",
      of: [
        defineArrayMember({
          type: "object",
          name: "espace",
          fields: [
            defineField({
              name: "nom",
              title: "Espace",
              type: "string",
              options: { list: ESPACES_A_LOUER },
              validation: (rule) => rule.required().error("Choisissez l'espace concerné."),
            }),
            defineField({
              name: "places",
              title: "Nombre de places",
              type: "number",
              validation: (rule) => rule.min(1).max(1000).warning("Ce nombre semble inhabituel : vérifiez la saisie."),
            }),
            defineField({ name: "description", type: "text", rows: 4 }),
            defineField({
              name: "equipements",
              title: "Équipement",
              type: "array",
              description: "Un équipement par ligne. Ex. Projection 4K, Sonorisation club, Micro, Bar.",
              of: [defineArrayMember({ type: "string" })],
            }),
            defineField({ name: "tarif", type: "string", description: "Ex. « 450.– la soirée », ou « Sur demande »." }),
            defineField({ name: "image", title: "Photo de l'espace", type: "imageMinimum" }),
          ],
          preview: { select: { title: "nom", subtitle: "tarif", media: "image" } },
        }),
      ],
      validation: (rule) => rule.min(1).error("Indiquez au moins un espace, sinon la rubrique n'a rien à montrer."),
    }),
    defineField({
      name: "conditions",
      title: "Bon à savoir",
      type: "text",
      rows: 5,
      description: "Horaires possibles, restauration, accessibilité, délai de réservation. Une idée par ligne.",
    }),
    defineField({
      name: "emailDemandes",
      title: "Adresse qui reçoit les demandes",
      type: "string",
      description: "Laissez vide pour utiliser l'e-mail principal des réglages.",
      validation: (rule) => rule.email(),
    }),
  ],
  preview: { prepare: () => ({ title: "Projections privées et location" }) },
});
