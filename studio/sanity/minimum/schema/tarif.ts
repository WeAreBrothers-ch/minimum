import { CreditCardIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

/** Un tarif vendu par la caisse en ligne. Le prix écrit ici est celui réellement encaissé. */
export const tarif = defineType({
  name: "tarif",
  type: "object",
  icon: CreditCardIcon,
  fields: [
    defineField({
      name: "libelle",
      title: "Nom du tarif",
      type: "string",
      description: "Ex. Ordinaire, Prévente, Sur place, Réduit.",
      validation: (rule) => rule.required().error("Donnez un nom au tarif."),
    }),
    defineField({
      name: "prix",
      title: "Prix (CHF)",
      type: "number",
      description: "Attention : ce chiffre est celui réellement facturé par la caisse en ligne.",
      validation: (rule) => rule.required().positive().error("Indiquez un prix supérieur à zéro."),
    }),
    defineField({
      name: "detail",
      title: "À qui il s'adresse (facultatif)",
      type: "string",
      description: "Ex. Membres de soutien, étudiant·e·s, carte Culture Caritas.",
    }),
    defineField({
      name: "cle",
      title: "Code du tarif",
      type: "string",
      description:
        "Un mot en minuscules, sans espace ni accent. Ex. prevente, sur-place. La caisse s'en sert pour reconnaître le tarif : ne le changez plus une fois la vente ouverte.",
      validation: (rule) =>
        rule
          .required()
          .regex(/^[a-z0-9-]{1,40}$/, { name: "code" })
          .error("Minuscules, chiffres et tirets seulement. Ex. prevente."),
    }),
  ],
  preview: {
    select: { libelle: "libelle", prix: "prix", detail: "detail" },
    prepare: ({ libelle, prix, detail }) => ({
      title: `${libelle ?? "Tarif"} : CHF ${typeof prix === "number" ? prix : "?"}.–`,
      subtitle: detail,
    }),
  },
});
