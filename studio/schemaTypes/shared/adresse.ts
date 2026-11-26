import { defineField } from "sanity";

/** Le champ « adresse de la page », commun aux films, soirées et événements. */
export const champAdresse = (source: string) =>
  defineField({
    name: "slug",
    title: "Adresse de la page",
    type: "slug",
    fieldset: "adresse",
    description:
      "Vous pouvez ignorer ce champ : le site fabrique l'adresse tout seul. « Generate » donne simplement une adresse plus jolie. À ne plus modifier une fois la page en ligne, sinon les liens déjà partagés cesseraient de fonctionner.",
    options: { source, maxLength: 96 },
  });

export const FIELDSET_ADRESSE = {
  name: "adresse",
  title: "Adresse de la page sur le site (facultatif)",
  options: { collapsible: true, collapsed: true },
};
