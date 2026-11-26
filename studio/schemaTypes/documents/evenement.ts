import { StarIcon } from "@sanity/icons/Star";
import { defineArrayMember, defineField, defineType } from "sanity";
import { champAdresse, FIELDSET_ADRESSE } from "../shared/adresse";
import { heureValide, jourEnLettres } from "../shared/heure";
import { LISTE_ESPACES } from "../shared/lieux";

export const evenement = defineType({
  name: "evenement",
  title: "Événement",
  type: "document",
  icon: StarIcon,
  fieldsets: [FIELDSET_ADRESSE],
  fields: [
    defineField({
      name: "title",
      title: "Titre de l'événement",
      type: "string",
      description: "Ex. « Festival du film fantastique », « Fermeture estivale ».",
      validation: (rule) => rule.required().error("Donnez un titre à l'événement."),
    }),
    defineField({
      name: "image",
      title: "Visuel de l'événement",
      type: "imageMinimum",
      description: "Format libre ; une image large rend le mieux. Sans image, l'événement s'affiche en texte seul.",
    }),
    defineField({
      name: "imageAccueil",
      title: "Visuel vertical pour l'accueil (facultatif)",
      type: "imageMinimum",
      description: "La version portrait, pour le mur d'affiches de l'accueil. Laissez vide pour reprendre le visuel ci-dessus.",
    }),
    defineField({
      name: "typeEvenement",
      title: "Type d'événement",
      type: "string",
      description: "Écrit tel qu'il doit s'afficher : Festival, Cycle, Ciné-club, Brunch… Laissez vide pour ne rien afficher.",
      validation: (rule) => rule.max(60).warning("Un type court se lit mieux (60 signes au plus)."),
    }),
    defineField({
      name: "dateDebut",
      title: "Premier jour",
      type: "date",
      options: { dateFormat: "DD.MM.YYYY" },
      description: "L'événement est visible dès sa publication, même avant ce jour : on peut l'annoncer à l'avance.",
      validation: (rule) => rule.required().error("Indiquez le premier jour."),
    }),
    defineField({
      name: "dateFin",
      title: "Dernier jour",
      type: "date",
      options: { dateFormat: "DD.MM.YYYY" },
      description:
        "Passé ce jour, l'événement quitte tout seul les pages publiques. Pour un seul jour, remettez la même date. Laissé vide, il reste en ligne jusqu'à ce qu'on le supprime.",
      validation: (rule) =>
        rule.custom((fin, contexte) => {
          const debut = contexte.document?.dateDebut;
          return typeof fin === "string" && typeof debut === "string" && fin < debut
            ? "Le dernier jour ne peut pas précéder le premier."
            : true;
        }),
    }),
    defineField({
      name: "rendezVous",
      title: "Les dates (événement en plusieurs soirs)",
      type: "array",
      description:
        "Un ciné-club du dimanche, un rendez-vous mensuel : ajoutez ici chaque soir plutôt que de les écrire dans le résumé. Les dates passées disparaissent d'elles-mêmes.",
      of: [
        defineArrayMember({
          type: "object",
          name: "rendezVous",
          title: "Date",
          fields: [
            defineField({
              name: "date",
              title: "Jour",
              type: "date",
              options: { dateFormat: "DD.MM.YYYY" },
              validation: (rule) => rule.required().error("Indiquez le jour."),
            }),
            defineField({ name: "heure", type: "string", placeholder: "20:00", validation: heureValide }),
            defineField({ name: "salle", title: "Lieu", type: "string", options: { list: LISTE_ESPACES } }),
          ],
          preview: {
            select: { date: "date", heure: "heure", salle: "salle" },
            prepare: ({ date, heure, salle }) => ({ title: jourEnLettres(date) || "Date", subtitle: [heure, salle].filter(Boolean).join(" · ") }),
          },
        }),
      ],
    }),
    defineField({
      name: "excerpt",
      title: "Résumé en deux ou trois phrases (facultatif)",
      type: "text",
      rows: 3,
      description: "Le texte court de la liste des événements : quoi, quand, combien.",
      validation: (rule) => rule.max(400).error("Le résumé est limité à 400 signes."),
    }),
    defineField({
      name: "body",
      title: "Texte complet",
      type: "texteRiche",
      description: "Facultatif. Le détail : programme, invités, conditions.",
    }),
    defineField({
      name: "films",
      title: "Films concernés",
      type: "array",
      description: "Leurs affiches et leurs séances apparaissent sur la page de l'événement, sans rien recopier.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "film" }] })],
    }),
    defineField({
      name: "soirees",
      title: "Soirées concernées",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "soiree" }] })],
    }),
    defineField({
      name: "linkUrl",
      title: "Lien externe",
      type: "url",
      description: "Facultatif : billetterie extérieure, formulaire, site d'un partenaire. Un bouton apparaît sur l'événement.",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "linkLabel",
      title: "Texte du bouton",
      type: "string",
      description: "Ex. « Réserver ». Par défaut : « En savoir plus ».",
      hidden: ({ document }) => !document?.linkUrl,
    }),
    champAdresse("title"),
  ],
  orderings: [{ name: "date", title: "Par date", by: [{ field: "dateDebut", direction: "desc" }] }],
  preview: {
    select: { title: "title", type: "typeEvenement", debut: "dateDebut", media: "image" },
    prepare: ({ title, type, debut, media }) => ({ title, subtitle: [type, jourEnLettres(debut)].filter(Boolean).join(" · "), media }),
  },
});
