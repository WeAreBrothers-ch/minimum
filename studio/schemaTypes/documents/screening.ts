import { CalendarIcon } from "@sanity/icons/Calendar";
import { defineField, defineType } from "sanity";
import { VERSION_API } from "../../projet";
import { heureValide, jourEnLettres, minutes } from "../shared/heure";
import { ETATS_VENTE } from "../shared/lieux";

interface Voisine {
  time?: string;
  duree?: number;
  titre?: string;
}

const PROJECTIONS_DU_FILM = [
  { title: "Avant-première", value: "avant-premiere" },
  { title: "Première", value: "premiere" },
  { title: "Projection extraordinaire", value: "projection-extraordinaire" },
];

/** Une séance annoncée par la fiche du film se règle là-bas : ici, son film, son jour et son heure sont figés. */
const regleeDansLeFilm = ({ document }: { document?: Record<string, unknown> }) => Boolean(document?.evenementDuFilm);

/** Durée retenue quand la fiche du film n'en donne pas. */
const DUREE_PAR_DEFAUT = 100;

export const screening = defineType({
  name: "screening",
  title: "Séance",
  type: "document",
  icon: CalendarIcon,
  /* Une seule salle : deux films ne peuvent pas s'y chevaucher. */
  validation: (rule) =>
    rule.custom(async (seance, contexte) => {
      const debut = minutes(seance?.time);
      const filmRef = (seance?.film as { _ref?: string } | undefined)?._ref;
      if (!seance?.date || debut === null || !filmRef || seance.status === "annule") return true;
      const client = contexte.getClient({ apiVersion: VERSION_API });
      const id = String(seance._id).replace(/^drafts\./, "");
      const { duree, voisines } = await client.fetch<{ duree: number | null; voisines: Voisine[] }>(
        `{"duree": *[_id == $film][0].duration,
          "voisines": *[_type == "screening" && date == $date && status != "annule" && !(_id in [$id, "drafts." + $id])]{
            time, "duree": film->duration, "titre": film->title}}`,
        { film: filmRef, date: seance.date, id },
      );
      const fin = debut + (duree ?? DUREE_PAR_DEFAUT);
      for (const voisine of voisines) {
        const autreDebut = minutes(voisine.time);
        if (autreDebut === null) continue;
        const autreFin = autreDebut + (voisine.duree ?? DUREE_PAR_DEFAUT);
        if (debut < autreFin && autreDebut < fin) {
          return `Cette séance chevauche « ${voisine.titre ?? "un autre film"} » à ${voisine.time} le même jour.`;
        }
      }
      return true;
    }).warning(),
  fields: [
    defineField({
      name: "film",
      title: "Quel film ?",
      type: "reference",
      to: [{ type: "film" }],
      description: "Le titre, l'affiche, la durée et la version sont repris de la fiche du film : rien à recopier ici.",
      readOnly: regleeDansLeFilm,
      validation: (rule) => rule.required().error("Choisissez le film projeté."),
    }),
    defineField({
      name: "date",
      title: "Date de la séance",
      type: "date",
      options: { dateFormat: "DD.MM.YYYY" },
      readOnly: regleeDansLeFilm,
      validation: (rule) => rule.required().error("Indiquez la date de la séance."),
    }),
    defineField({
      name: "time",
      title: "Heure de début",
      type: "string",
      placeholder: "19:00",
      description: "Sur 24 heures, avec deux points. Ex. 20:30 pour 20 h 30.",
      readOnly: regleeDansLeFilm,
      validation: (rule) => heureValide(rule.required()),
    }),
    defineField({
      name: "status",
      title: "État de la séance",
      type: "string",
      options: { list: ETATS_VENTE, layout: "radio" },
      initialValue: "disponible",
      description: "« Complet » et « Annulée » s'affichent sur l'agenda et ferment la vente en ligne.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "evenementDuFilm",
      title: "Projection annoncée par la fiche du film",
      type: "string",
      options: { list: PROJECTIONS_DU_FILM },
      description:
        "Cette séance est une avant-première, une première ou une projection extraordinaire : son jour et son heure se règlent dans la fiche du film (« Jour et heure de la projection »).",
      readOnly: true,
      hidden: ({ value }) => !value,
    }),
    defineField({
      name: "versionNote",
      title: "Mention particulière",
      type: "string",
      description:
        "S'affiche à côté de l'heure. Ex. « Séance suivie d'une rencontre », « Ciné-goûter dès 6 ans ». Laissez vide pour une séance normale.",
    }),
  ],
  orderings: [
    { name: "prochaines", title: "Les plus proches d'abord", by: [{ field: "date", direction: "asc" }, { field: "time", direction: "asc" }] },
    { name: "recentes", title: "Les plus récentes d'abord", by: [{ field: "date", direction: "desc" }, { field: "time", direction: "desc" }] },
  ],
  preview: {
    select: { titre: "film.title", date: "date", heure: "time", etat: "status", media: "film.poster" },
    prepare: ({ titre, date, heure, etat, media }) => ({
      title: titre ?? "Film à choisir",
      subtitle: [jourEnLettres(date), heure, etat === "complet" ? "COMPLET" : etat === "annule" ? "ANNULÉE" : null]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
