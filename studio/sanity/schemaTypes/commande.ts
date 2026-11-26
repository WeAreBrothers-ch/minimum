import { BillIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";
import { jourEnLettres } from "../minimum/dates";

export const STATUTS_COMMANDE = [
  { title: "En attente de paiement", value: "en-attente" },
  { title: "Payée", value: "payee" },
  { title: "À vérifier (montant encaissé différent)", value: "a-verifier" },
  { title: "Échouée", value: "echouee" },
  { title: "Annulée avant paiement", value: "annulee" },
  { title: "Expirée", value: "expiree" },
  { title: "Remboursée", value: "remboursee" },
];

const LIBELLE_STATUT = new Map(STATUTS_COMMANDE.map((s) => [s.value, s.title]));

/* Une commande de billets.
   ATTENTION : ces documents sont créés et mis à jour par le serveur
   (dossier /api du site), jamais à la main. Ils sont donc en lecture
   seule dans le Studio, comme à Zinéma. Les champs sont ceux qu'écrit
   la caisse de Minimum (api/creer-paiement.php) : une commande porte
   sur une séance OU sur une soirée, en lignes de billets par tarif. */
export const commande = defineType({
  name: "commande",
  type: "document",
  icon: BillIcon,
  readOnly: true,
  fields: [
    defineField({
      name: "reference",
      title: "Référence",
      type: "string",
      description: "Le code du billet, présenté à l'entrée. Ex. MIN-7K2QXA.",
    }),
    defineField({ name: "statut", type: "string", options: { list: STATUTS_COMMANDE }, initialValue: "en-attente" }),
    defineField({
      name: "genre",
      title: "Billets pour",
      type: "string",
      options: { list: [{ title: "Une séance de cinéma", value: "seance" }, { title: "Une soirée", value: "soiree" }] },
    }),
    defineField({
      name: "evenement",
      title: "Séance ou soirée",
      type: "reference",
      to: [{ type: "screening" }, { type: "soiree" }],
    }),
    defineField({ name: "evenementTitre", title: "Titre", type: "string" }),
    defineField({ name: "evenementDate", title: "Date", type: "date" }),
    defineField({ name: "evenementHeure", title: "Heure", type: "string" }),
    defineField({
      name: "billets",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "ligneBillets",
          fields: [
            defineField({ name: "cle", title: "Code du tarif", type: "string" }),
            defineField({ name: "libelle", title: "Tarif", type: "string" }),
            defineField({ name: "prix", title: "Prix (CHF)", type: "number" }),
            defineField({ name: "nombre", type: "number" }),
          ],
          preview: {
            select: { libelle: "libelle", prix: "prix", nombre: "nombre" },
            prepare: ({ libelle, prix, nombre }) => ({ title: `${nombre ?? "?"} × ${libelle ?? "billet"}`, subtitle: `CHF ${prix ?? "?"}.– pièce` }),
          },
        }),
      ],
    }),
    defineField({ name: "nombreBillets", title: "Nombre de billets", type: "number" }),
    defineField({ name: "montant", title: "Montant total (CHF)", type: "number" }),
    defineField({ name: "email", title: "E-mail de l'acheteur", type: "string" }),
    defineField({
      name: "sumupCheckoutId",
      title: "Identifiant SumUp",
      type: "string",
      description: "Sert à retrouver le paiement dans le compte SumUp.",
    }),
    defineField({ name: "creeLe", title: "Commandée le", type: "datetime" }),
    defineField({ name: "payeeLe", title: "Payée le", type: "datetime" }),
    defineField({
      name: "billetEnvoyeLe",
      title: "Billet envoyé par e-mail le",
      type: "datetime",
      description: "Rempli par le serveur quand l'e-mail de confirmation est parti.",
    }),
    defineField({
      name: "utiliseeLe",
      title: "Billet contrôlé le",
      type: "datetime",
      description: "Rempli au contrôle à l'entrée (bouton « Billet contrôlé » en bas de la page). Vide : billet pas encore utilisé.",
    }),
  ],
  orderings: [{ name: "recentes", title: "Les plus récentes d'abord", by: [{ field: "creeLe", direction: "desc" }] }],
  preview: {
    select: { reference: "reference", statut: "statut", titre: "evenementTitre", date: "evenementDate", nombre: "nombreBillets", email: "email", utilisee: "utiliseeLe" },
    prepare: ({ reference, statut, titre, date, nombre, email, utilisee }) => ({
      title: `${reference ?? "Sans référence"} · ${nombre ?? "?"} billet${nombre > 1 ? "s" : ""}${utilisee ? " · CONTRÔLÉ" : ""}`,
      subtitle: [LIBELLE_STATUT.get(statut) ?? statut, titre, jourEnLettres(date), email].filter(Boolean).join(" · "),
    }),
  },
});
