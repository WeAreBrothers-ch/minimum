import { MoonIcon } from "@sanity/icons/Moon";
import { defineArrayMember, defineField, defineType } from "sanity";
import { champAdresse, FIELDSET_ADRESSE } from "../shared/adresse";
import { heureValide, jourEnLettres } from "../shared/heure";
import { ETATS_VENTE } from "../shared/lieux";

export const soiree = defineType({
  name: "soiree",
  title: "Soirée",
  type: "document",
  icon: MoonIcon,
  groups: [
    { name: "soiree", title: "La soirée", default: true },
    { name: "lineup", title: "Line-up" },
    { name: "billets", title: "Billets" },
  ],
  fieldsets: [
    FIELDSET_ADRESSE,
    { name: "horaire", title: "Quand ?", options: { columns: 3 } },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Nom de la soirée",
      type: "string",
      group: "soiree",
      validation: (rule) => rule.required().error("Donnez un nom à la soirée."),
    }),
    defineField({
      name: "affiche",
      title: "Affiche de la soirée",
      type: "imageMinimum",
      group: "soiree",
      description:
        "L'affiche sur le mur Musique de l'accueil, sur la page Musique, sur la fiche de la soirée et sur les posts Instagram. Verticale de préférence : le site y pose le nom et la date sur une bande noire, en bas. Sans affiche, le flyer est typographique, tout rose.",
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      group: "soiree",
      fieldset: "horaire",
      options: { dateFormat: "DD.MM.YYYY" },
      description: "Le soir où les portes ouvrent, même si la soirée finit après minuit.",
      validation: (rule) => rule.required().error("Indiquez la date."),
    }),
    defineField({
      name: "ouverture",
      title: "Ouverture des portes",
      type: "string",
      group: "soiree",
      fieldset: "horaire",
      placeholder: "23:00",
      initialValue: "23:00",
      validation: (rule) => heureValide(rule.required()),
    }),
    defineField({
      name: "fin",
      title: "Fermeture",
      type: "string",
      group: "soiree",
      fieldset: "horaire",
      placeholder: "04:00",
      validation: heureValide,
    }),
    defineField({
      name: "genreMusical",
      title: "Style musical",
      type: "string",
      group: "soiree",
      description: "Écrit tel qu'il s'affichera. Ex. Techno, House · Disco, Bass music.",
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 5,
      group: "soiree",
      description: "Facultatif. Quelques phrases sur la soirée : elles s'affichent sur la fiche et servent de base à la légende Instagram.",
      validation: (rule) => rule.max(900).warning("Très long pour une soirée : pensez au téléphone."),
    }),
    defineField({
      name: "age",
      title: "Âge d'entrée",
      type: "string",
      group: "soiree",
      initialValue: "Dès 18 ans",
    }),
    defineField({
      name: "status",
      title: "État de la vente",
      type: "string",
      group: "soiree",
      options: { list: ETATS_VENTE, layout: "radio" },
      initialValue: "disponible",
      description: "« Complet » et « Annulée » s'affichent sur le site et ferment la vente en ligne.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lineUp",
      title: "Line-up",
      type: "array",
      group: "lineup",
      description:
        "Un passage par artiste, dans l'ordre de la nuit. Chaque artiste a sa fiche (photo, compte Instagram) : l'onglet « Instagram » en haut de cette page prépare un post par artiste, et un pour la soirée entière.",
      of: [defineArrayMember({ type: "passage" })],
    }),
    defineField({
      name: "tarifs",
      title: "Tarifs en vente",
      type: "array",
      group: "billets",
      description:
        "Les billets vendus en ligne pour cette soirée. Sans aucun tarif, la caisse en ligne reste fermée pour cette soirée.",
      of: [defineArrayMember({ type: "tarif" })],
      validation: (rule) =>
        rule.custom((tarifs) => {
          const cles = (Array.isArray(tarifs) ? tarifs : []).map((t) => (t as { cle?: string }).cle);
          return new Set(cles).size === cles.length ? true : "Deux tarifs portent le même code : chacun doit avoir le sien.";
        }),
    }),
    defineField({
      name: "capacite",
      title: "Nombre de billets en vente",
      type: "number",
      group: "billets",
      description:
        "La jauge de cette soirée. Laissez vide pour reprendre celle du club (« Réglages → Tarifs et jauges »). La caisse ne vend jamais plus que ce nombre.",
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({
      name: "lienBillets",
      title: "Billetterie extérieure (facultatif)",
      type: "url",
      group: "billets",
      description: "Seulement si les billets se vendent ailleurs (Petzi, Ticketcorner…). Le bouton « Billets » y mène alors.",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    champAdresse("title"),
  ],
  orderings: [
    { name: "prochaines", title: "Les plus proches d'abord", by: [{ field: "date", direction: "asc" }] },
    { name: "recentes", title: "Les plus récentes d'abord", by: [{ field: "date", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", date: "date", heure: "ouverture", etat: "status", media: "affiche" },
    prepare: ({ title, date, heure, etat, media }) => ({
      title,
      subtitle: [jourEnLettres(date), heure, etat === "complet" ? "COMPLET" : etat === "annule" ? "ANNULÉE" : null]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
