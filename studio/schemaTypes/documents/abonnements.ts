import { CreditCardIcon } from "@sanity/icons/CreditCard";
import { defineArrayMember, defineField, defineType } from "sanity";

export const abonnements = defineType({
  name: "abonnements",
  title: "Cartes de membre et paiement",
  type: "document",
  icon: CreditCardIcon,
  fields: [
    defineField({
      name: "intro",
      title: "Phrase d'accueil",
      type: "text",
      rows: 3,
      description: "Le texte avant les formules. Facultatif.",
      validation: (rule) => rule.max(600).warning("Au-delà de 600 signes, le texte cesse d'être lu."),
    }),
    defineField({
      name: "formules",
      title: "Les formules proposées",
      type: "array",
      description: "Une carte par formule, dans l'ordre d'affichage.",
      of: [
        defineArrayMember({
          type: "object",
          name: "formule",
          fields: [
            defineField({
              name: "titre",
              title: "Nom de la formule",
              type: "string",
              description: "Ex. Membre de soutien, Membre couple.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "prix",
              type: "string",
              description: "Écrit tel qu'il doit s'afficher. Ex. « 60 CHF par an », « sur demande ».",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "texte", title: "À qui ça s'adresse", type: "text", rows: 3 }),
            defineField({
              name: "avantages",
              type: "array",
              description: "Un avantage par ligne. Ex. Toutes les places à 10 CHF.",
              of: [defineArrayMember({ type: "string" })],
            }),
          ],
          preview: { select: { title: "titre", subtitle: "prix" } },
        }),
      ],
      validation: (rule) => rule.min(1).warning("La rubrique sera vide sans au moins une formule."),
    }),
    defineField({ name: "beneficiaire", title: "Au nom de qui payer", type: "string", description: "Le titulaire du compte." }),
    defineField({ name: "iban", title: "IBAN", type: "string", description: "Vérifiez chiffre par chiffre." }),
    defineField({ name: "ccp", title: "Numéro de compte (CCP)", type: "string", description: "Facultatif." }),
    defineField({ name: "banque", type: "string", description: "Ex. PostFinance Suisse." }),
    defineField({
      name: "notePaiement",
      title: "Précision sur le paiement",
      type: "text",
      rows: 2,
      description: "Facultatif. Ex. « Indiquez votre nom en communication ; la carte vous attend à la buvette. »",
    }),
  ],
  preview: { prepare: () => ({ title: "Cartes de membre et paiement" }) },
});
