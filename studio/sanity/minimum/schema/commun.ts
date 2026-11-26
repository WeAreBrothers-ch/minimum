/* Minimum : ce que les fiches de la Musique ont en commun avec celles du cinéma. */

import { defineField, type StringRule } from "sanity";

import { MOTIF_HEURE } from "../dates";

/** Une heure s'écrit « 20:30 », comme dans les séances. */
export const heureValide = (rule: StringRule) =>
  rule.regex(MOTIF_HEURE, { name: "heure (HH:MM)" }).error("Écrivez l'heure sous la forme 20:30.");

/** Les mêmes états que ceux d'une séance (schemaTypes/screening.ts). */
export const ETATS_VENTE = [
  { title: "Places disponibles", value: "disponible" },
  { title: "Complet", value: "complet" },
  { title: "Annulée", value: "annule" },
];

/** Le champ « adresse de la page », rangé dans son encadré replié, comme sur la fiche d'un film. */
export const champAdresse = (source: string) =>
  defineField({
    name: "slug",
    title: "Adresse de la page",
    type: "slug",
    fieldset: "adresse",
    description:
      "Vous pouvez ignorer ce champ : le site sait fabriquer l'adresse tout seul. Cliquer sur « Generate » donne simplement une adresse plus jolie. À ne plus modifier une fois la page en ligne, sinon les liens déjà partagés cesseraient de fonctionner.",
    options: { source, maxLength: 96 },
  });

export const FIELDSET_ADRESSE = {
  name: "adresse",
  title: "Adresse de la page sur le site (facultatif)",
  options: { collapsible: true, collapsed: true },
};
