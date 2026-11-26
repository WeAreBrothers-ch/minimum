import { defineField, defineType } from "sanity";


/* ============================================================
   Les réglages du cinéma : ce qui ne change presque jamais, mais
   qui est repris partout sur le site (en-tête, pied de page, page
   Infos pratiques, boutons d'achat) et par la caisse en ligne.

   Les tarifs et les salles sont lus par le SERVEUR au moment de
   l'achat (dossier /api) : c'est lui qui calcule le montant à payer
   et le nombre de places restantes, jamais le navigateur du client,
   qui pourrait être trafiqué. Modifier un prix ici le change donc
   réellement à la caisse en ligne.
   ============================================================ */

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Réglages du cinéma",
  type: "document",
  groups: [
    { name: "identite", title: "Identité", default: true },
    { name: "pratique", title: "Infos pratiques" },
    { name: "tarifs", title: "Tarifs & salles" },
    { name: "reseaux", title: "Réseaux & référencement" },
    { name: "musique", title: "Radio & Instagram" },
  ],
  fields: [
    /* ---------------- Identité ----------------
       Il n'y a plus de champ « logo » : le nom du cinéma est écrit
       en haut de chaque page, dans la typographie du site, et non
       plus déposé sous forme d'image. */
    defineField({
      name: "shareImage",
      title: "Image de partage",
      type: "imageMinimum",
      group: "identite",
      description:
        "L'image qui s'affiche quand quelqu'un partage l'adresse du cinéma sur WhatsApp, Facebook ou Instagram. Format paysage, 1200 × 630 px idéalement. Sans elle, les partages apparaissent sans visuel.",
    }),

    /* ---------------- Infos pratiques ---------------- */
    defineField({
      name: "address",
      title: "Adresse postale",
      type: "text",
      rows: 2,
      group: "pratique",
      description:
        "La rue, puis le code postal et la ville. Ex.\nQuai Philippe-Godet 20\n2000 Neuchâtel\nSert aussi au lien « Ouvrir le plan » de la page Infos.",
      validation: (Rule) => Rule.required().error("L'adresse est obligatoire."),
    }),
    defineField({
      name: "phone",
      title: "Téléphone du cinéma",
      type: "string",
      group: "pratique",
      description: "Le numéro que le public appelle. Ex. 032 545 37 37.",
      validation: (Rule) => Rule.required().error("Le téléphone est obligatoire."),
    }),
    defineField({
      name: "phoneSecondary",
      title: "Téléphone du bureau",
      type: "string",
      group: "pratique",
      description: "Facultatif. N'apparaît sur le site que s'il est rempli.",
    }),
    defineField({
      name: "email",
      title: "E-mail principal",
      type: "string",
      group: "pratique",
      description: "Celui affiché sur la page Infos et dans le pied de page.",
      validation: (Rule) =>
        Rule.required()
          .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, { name: "adresse e-mail" })
          .error("Écrivez une adresse e-mail valable, ex. cineminimum@gmail.com."),
    }),
    defineField({
      name: "openingHours",
      title: "Horaires",
      type: "array",
      group: "pratique",
      description:
        "Une ligne par période. À gauche les jours, à droite l'horaire. Ex. « Lundi au samedi » / « 15h30 – 24h00 ».",
      of: [
        {
          type: "object",
          name: "horaire",
          fields: [
            {
              name: "label",
              title: "Jours",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "value",
              title: "Horaire",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: "label", subtitle: "value" },
          },
        },
      ],
    }),
    defineField({
      name: "accessInfo",
      title: "Comment venir",
      type: "array",
      of: [{ type: "block" }],
      group: "pratique",
      description:
        "Transports publics, arrêt le plus proche, parking, accès en fauteuil roulant. Affiché sur la page Infos.",
    }),
    defineField({
      name: "remerciements",
      title: "Remerciements",
      type: "array",
      group: "pratique",
      description:
        "Celles et ceux que le cinéma remercie : institutions, soutiens, personnes. Une brique par nom, toutes à la même taille, sur le mur de la page Merci — on y entre par la case « Merci » de la page Infos, à côté de « Notre histoire » ; la page ne répète pas le mot, elle ne montre que les noms. Les noms s'affichent tout seuls par ordre alphabétique, quel que soit l'ordre de saisie ; la couleur de chaque brique est tirée au hasard à chaque visite. Sans aucun nom, la case et la page n'apparaissent pas du tout sur le site.",
      of: [
        {
          type: "object",
          name: "remerciement",
          fields: [
            {
              name: "nom",
              title: "Nom",
              type: "string",
              description:
                "Ce qui s'affiche en grand dans la case. Ex. Loterie Romande, Ville de Neuchâtel, État de Neuchâtel.",
              validation: (Rule) => Rule.required().error("Écrivez le nom à remercier."),
            },
            {
              name: "mention",
              title: "Pour quoi (facultatif)",
              type: "string",
              description:
                "Deux ou trois mots, en petit sous le nom. Ex. « soutien à la programmation », « projection », « graphisme ». À laisser vide si le nom se suffit.",
            },
            {
              name: "url",
              title: "Lien (facultatif)",
              type: "url",
              description:
                "Si la case doit être cliquable, l'adresse complète du site. Ex. https://entreprise.loro.ch",
            },
          ],
          preview: { select: { title: "nom", subtitle: "mention" } },
        },
      ],
    }),
    defineField({
      name: "mapUrl",
      title: "Lien Google Maps particulier",
      type: "url",
      group: "pratique",
      description:
        "À laisser vide presque toujours : la carte et le lien « Voir sur Google Maps » sont construits automatiquement à partir de l'adresse ci-dessus. À remplir seulement pour pointer vers la fiche Google du cinéma (avec avis et photos).",
    }),

    /* ---------------- Tarifs & salles ----------------
       Les noms de ces trois champs sont ceux que lit la caisse du site
       (api/_evenement.php) : tarifsCinema, placesCinema, placesClub. */
    defineField({
      name: "tarifsCinema",
      title: "Tarifs du cinéma",
      type: "array",
      group: "tarifs",
      description:
        "Les tarifs des séances. Attention : ces chiffres sont ceux réellement facturés par la caisse en ligne. Les codes « ordinaire », « avs » et « soutien » doivent rester : la caisse s'en sert pour reconnaître chaque tarif.",
      of: [{ type: "tarif" }],
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
      validation: (Rule) =>
        Rule.custom((tarifs?: { cle?: string }[]) => {
          const cles = (tarifs ?? []).map((tarif) => tarif?.cle);
          const manquantes = ["ordinaire", "avs", "soutien"].filter((cle) => !cles.includes(cle));
          return manquantes.length
            ? `Il manque le tarif dont le code est « ${manquantes.join(" », « ")} ».`
            : true;
        }),
    }),
    defineField({
      name: "placesCinema",
      title: "Nombre de places de la salle de cinéma",
      type: "number",
      group: "tarifs",
      description:
        "Sert à ne jamais vendre plus de billets qu'il n'y a de sièges. Sans ce nombre, la caisse du cinéma reste fermée.",
      validation: (Rule) => Rule.min(1).integer().error("Indiquez un nombre de places."),
    }),
    defineField({
      name: "placesClub",
      title: "Jauge du club",
      type: "number",
      group: "tarifs",
      description:
        "Le nombre de billets en vente pour une soirée, quand la soirée n'en précise pas d'autre.",
      validation: (Rule) => Rule.min(1).integer().error("Indiquez une jauge."),
    }),

    /* ---------------- Radio & Instagram (propre à Minimum) ---------------- */
    defineField({
      name: "chaineYoutube",
      title: "Identifiant de la chaîne YouTube",
      type: "string",
      group: "musique",
      description:
        "La radio, ce sont des lives YouTube. L'identifiant de la chaîne commence par « UC » : il se lit dans l'adresse youtube.com/channel/UC… La page Musique du site montre alors le live en cours.",
      validation: (Rule) =>
        Rule.regex(/^UC[A-Za-z0-9_-]{22}$/, { name: "identifiant de chaîne" }).error(
          "L'identifiant commence par UC et compte 24 signes."
        ),
    }),
    defineField({
      name: "nomRadio",
      title: "Nom de la radio",
      type: "string",
      group: "musique",
      initialValue: "Minimum Radio",
    }),
    defineField({
      name: "compteInstagram",
      title: "Compte Instagram de Minimum",
      type: "string",
      group: "musique",
      description: "Écrit sur les visuels et dans les légendes des posts. Ex. @minimum.",
      validation: (Rule) => Rule.regex(/^@?[A-Za-z0-9._]{1,30}$/, { name: "compte Instagram" }),
    }),
    defineField({
      name: "hashtags",
      title: "Hashtags de toujours",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "musique",
      description: "Ajoutés à la fin de chaque légende. Tapez un mot puis Entrée, sans le #.",
      initialValue: ["minimum", "caseachocs", "neuchatel"],
    }),
    defineField({
      name: "mentionBillets",
      title: "Phrase des billets",
      type: "string",
      group: "musique",
      description: "La ligne qui dit où acheter, dans chaque légende.",
      initialValue: "Billets : cineminimum.ch (lien en bio)",
    }),

    /* ---------------- Réseaux & référencement ---------------- */
    defineField({
      name: "socialLinks",
      title: "Réseaux sociaux",
      type: "array",
      group: "reseaux",
      description: "Affichés dans le pied de page de toutes les pages.",
      of: [
        {
          type: "object",
          name: "reseau",
          fields: [
            {
              name: "label",
              title: "Réseau",
              type: "string",
              options: {
                list: [
                  { title: "Instagram", value: "Instagram" },
                  { title: "Facebook", value: "Facebook" },
                  { title: "YouTube (les lives de la radio)", value: "YouTube" },
                  { title: "LinkedIn", value: "LinkedIn" },
                  { title: "Newsletter", value: "Newsletter" },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: "url",
              title: "Adresse complète",
              type: "url",
              description: "L'adresse complète, qui commence par https://.",
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        },
      ],
    }),
    defineField({
      name: "seoDescription",
      title: "Description pour Google",
      type: "text",
      rows: 3,
      group: "reseaux",
      description:
        "Le petit texte gris sous le titre du site dans les résultats de recherche. Entre 120 et 160 signes, en disant ce qu'on trouve au cinéma.",
      validation: (Rule) =>
        Rule.max(180).warning("Au-delà de 180 signes, Google coupe la phrase."),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Réglages du cinéma" };
    },
  },
});
