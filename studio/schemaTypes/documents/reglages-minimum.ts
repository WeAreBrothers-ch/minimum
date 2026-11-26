import { CogIcon } from "@sanity/icons/Cog";
import { defineArrayMember, defineField, defineType } from "sanity";

const RESEAUX = ["Instagram", "YouTube", "Facebook", "SoundCloud", "Mixcloud", "Newsletter"];
const CLES_CINEMA = ["ordinaire", "avs", "soutien"];

/** Le document unique des réglages de Minimum (identifiant fixe : reglagesMinimum). */
export const reglagesMinimum = defineType({
  name: "reglagesMinimum",
  title: "Réglages de Minimum",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "contact", title: "Adresse et contact", default: true },
    { name: "tarifs", title: "Tarifs et jauges" },
    { name: "radio", title: "Radio (lives YouTube)" },
    { name: "instagram", title: "Instagram et réseaux" },
    { name: "merci", title: "Remerciements" },
    { name: "google", title: "Google et partage" },
  ],
  fields: [
    defineField({
      name: "address",
      title: "Adresse postale",
      type: "text",
      rows: 3,
      group: "contact",
      initialValue: "Cinéma Minimum, salle Anaïs Emery\nQuai Philippe-Godet 20\n2000 Neuchâtel",
      validation: (rule) => rule.required().error("L'adresse est obligatoire."),
    }),
    defineField({
      name: "phone",
      title: "Téléphone du cinéma",
      type: "string",
      group: "contact",
      description: "Le numéro que le public appelle.",
    }),
    defineField({
      name: "phoneSecondary",
      title: "Téléphone du bureau",
      type: "string",
      group: "contact",
      description: "Facultatif. N'apparaît sur le site que s'il est rempli.",
    }),
    defineField({
      name: "email",
      title: "E-mail principal",
      type: "string",
      group: "contact",
      validation: (rule) => rule.required().email().error("Écrivez une adresse e-mail valable."),
    }),
    defineField({
      name: "openingHours",
      title: "Horaires",
      type: "array",
      group: "contact",
      description: "Une ligne par période. Ex. « Mercredi au mardi » / « Séances à 19h et 21h ».",
      of: [
        defineArrayMember({
          type: "object",
          name: "horaire",
          fields: [
            defineField({ name: "label", title: "Jours", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "value", title: "Horaire", type: "string", validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: "label", subtitle: "value" } },
        }),
      ],
    }),
    defineField({
      name: "accessInfo",
      title: "Comment venir",
      type: "texteRiche",
      group: "contact",
      description: "Transports publics, arrêt le plus proche, parking, accès en fauteuil roulant.",
    }),
    defineField({
      name: "mapUrl",
      title: "Lien de la carte (facultatif)",
      type: "url",
      group: "contact",
      description: "À laisser vide presque toujours : le lien « Ouvrir le plan » est construit à partir de l'adresse.",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "tarifsCinema",
      title: "Tarifs du cinéma",
      type: "array",
      group: "tarifs",
      description:
        "Les tarifs des séances, tels que la caisse en ligne les encaisse. Les codes « ordinaire », « avs » et « soutien » doivent rester : la caisse s'en sert pour reconnaître chaque tarif.",
      of: [defineArrayMember({ type: "tarif" })],
      initialValue: [
        { _type: "tarif", _key: "ordinaire", cle: "ordinaire", libelle: "Ordinaire", prix: 16 },
        { _type: "tarif", _key: "avs", cle: "avs", libelle: "AVS, AI, chômeur.euse.s", prix: 14 },
        {
          _type: "tarif",
          _key: "soutien",
          cle: "soutien",
          libelle: "Réduit",
          prix: 10,
          detail: "Membres de soutien, abonné.e.s au journal Le Courrier, étudiant.e.s, carte Culture Caritas",
        },
      ],
      validation: (rule) =>
        rule.custom((tarifs) => {
          const cles = (Array.isArray(tarifs) ? tarifs : []).map((t) => (t as { cle?: string }).cle);
          const manquantes = CLES_CINEMA.filter((cle) => !cles.includes(cle));
          return manquantes.length === 0 ? true : `Il manque le tarif dont le code est « ${manquantes.join(" », « ")} ».`;
        }),
    }),
    defineField({
      name: "tarifsHorsLigne",
      title: "Tarifs vendus seulement à la buvette",
      type: "array",
      group: "tarifs",
      description: "Affichés sur la page Infos, jamais vendus en ligne. Ex. « AG culturel : CHF 0.– ».",
      of: [
        defineArrayMember({
          type: "object",
          name: "tarifHorsLigne",
          fields: [
            defineField({ name: "libelle", title: "Nom du tarif", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "prix", title: "Prix (CHF)", type: "number", validation: (rule) => rule.required().min(0) }),
          ],
          preview: {
            select: { libelle: "libelle", prix: "prix" },
            prepare: ({ libelle, prix }) => ({ title: `${libelle} : CHF ${prix}.–` }),
          },
        }),
      ],
    }),
    defineField({
      name: "placesCinema",
      title: "Places dans la salle de cinéma",
      type: "number",
      group: "tarifs",
      description: "Sert à ne jamais vendre plus de billets qu'il n'y a de sièges. Sans ce nombre, la caisse du cinéma reste fermée.",
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({
      name: "placesClub",
      title: "Jauge du club",
      type: "number",
      group: "tarifs",
      description: "Le nombre de billets en vente pour une soirée, quand la soirée n'en précise pas d'autre.",
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({
      name: "notePaiement",
      title: "Où et comment payer",
      type: "text",
      rows: 3,
      group: "tarifs",
      initialValue:
        "En ligne, par carte, sur la fiche de chaque film. À la buvette, 15 minutes avant chaque séance, en espèces ou par TWINT.",
    }),
    defineField({
      name: "chaineYoutube",
      title: "Identifiant de la chaîne YouTube",
      type: "string",
      group: "radio",
      placeholder: "UC…",
      description:
        "La radio, ce sont des lives YouTube. L'identifiant de la chaîne commence par « UC » : il se lit dans l'adresse youtube.com/channel/UC… La page Musique montre alors le live en cours. Tant qu'il est vide, la page le dit au lieu de montrer un lecteur vide.",
      validation: (rule) => rule.regex(/^UC[A-Za-z0-9_-]{22}$/, { name: "identifiant de chaîne" }).error("L'identifiant commence par UC et compte 24 signes."),
    }),
    defineField({
      name: "nomRadio",
      title: "Nom de la radio",
      type: "string",
      group: "radio",
      initialValue: "Minimum Radio",
    }),
    defineField({
      name: "compteInstagram",
      title: "Compte Instagram de Minimum",
      type: "string",
      group: "instagram",
      placeholder: "@minimum",
      description: "Écrit sur les visuels et dans les légendes des posts préparés par le Studio.",
      validation: (rule) => rule.regex(/^@?[A-Za-z0-9._]{1,30}$/, { name: "compte Instagram" }),
    }),
    defineField({
      name: "hashtags",
      title: "Hashtags de toujours",
      type: "array",
      group: "instagram",
      description: "Ajoutés à la fin de chaque légende. Tapez un mot puis Entrée, sans le #.",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      initialValue: ["minimum", "caseachocs", "neuchatel"],
    }),
    defineField({
      name: "mentionBillets",
      title: "Phrase des billets",
      type: "string",
      group: "instagram",
      initialValue: "Billets : cineminimum.ch (lien en bio)",
      description: "La ligne qui dit où acheter, dans chaque légende.",
    }),
    defineField({
      name: "socialLinks",
      title: "Réseaux sociaux",
      type: "array",
      group: "instagram",
      description: "Affichés dans le pied de page du site.",
      of: [
        defineArrayMember({
          type: "object",
          name: "reseau",
          fields: [
            defineField({ name: "label", title: "Réseau", type: "string", options: { list: RESEAUX }, validation: (rule) => rule.required() }),
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
    defineField({
      name: "remerciements",
      type: "array",
      group: "merci",
      description: "Celles et ceux que Minimum remercie : institutions, soutiens, personnes. Un nom par ligne.",
      of: [
        defineArrayMember({
          type: "object",
          name: "remerciement",
          fields: [
            defineField({ name: "nom", type: "string", validation: (rule) => rule.required().error("Écrivez le nom à remercier.") }),
            defineField({ name: "mention", title: "Pour quoi (facultatif)", type: "string" }),
            defineField({ name: "url", title: "Lien (facultatif)", type: "url", validation: (rule) => rule.uri({ scheme: ["http", "https"] }) }),
          ],
          preview: { select: { title: "nom", subtitle: "mention" } },
        }),
      ],
    }),
    defineField({
      name: "credits",
      title: "Crédits",
      type: "text",
      rows: 3,
      group: "merci",
      description: "Graphisme, site, photos. Ex. « Graphisme : Karen Ichters ».",
    }),
    defineField({
      name: "seoDescription",
      title: "Description pour Google",
      type: "text",
      rows: 3,
      group: "google",
      description: "Le petit texte sous le titre du site dans les résultats de recherche. Entre 120 et 160 signes.",
      validation: (rule) => rule.max(180).warning("Au-delà de 180 signes, Google coupe la phrase."),
    }),
    defineField({
      name: "shareImage",
      title: "Image de partage",
      type: "imageMinimum",
      group: "google",
      description: "L'image affichée quand quelqu'un partage l'adresse du site. Format paysage, 1200 × 630 px.",
    }),
  ],
  preview: { prepare: () => ({ title: "Réglages de Minimum" }) },
});
