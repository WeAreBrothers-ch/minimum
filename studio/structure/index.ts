/* Minimum : le menu du Studio, rangé comme le site : Cinéma, Musique (soirées et lives), puis le lieu. */

import { BillIcon } from "@sanity/icons/Bill";
import { BlockElementIcon } from "@sanity/icons/BlockElement";
import { BookIcon } from "@sanity/icons/Book";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { ClockIcon } from "@sanity/icons/Clock";
import { CogIcon } from "@sanity/icons/Cog";
import { CreditCardIcon } from "@sanity/icons/CreditCard";
import { DocumentVideoIcon } from "@sanity/icons/DocumentVideo";
import { HomeIcon } from "@sanity/icons/Home";
import { ImageIcon } from "@sanity/icons/Image";
import { MoonIcon } from "@sanity/icons/Moon";
import { PlayIcon } from "@sanity/icons/Play";
import { StarIcon } from "@sanity/icons/Star";
import { UsersIcon } from "@sanity/icons/Users";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import type { ComponentType } from "react";
import type { DefaultDocumentNodeResolver, StructureBuilder, StructureResolver } from "sanity/structure";
import { TYPES_INSTAGRAM } from "../insta/requetes";
import { VueInstagram } from "../insta/vue-instagram";
import { VERSION_API } from "../projet";
import { aujourdhui } from "../schemaTypes/shared/heure";

const PROCHAINES = [{ field: "date", direction: "asc" as const }];
const RECENTES = [{ field: "date", direction: "desc" as const }];

/** Un document unique : un seul exemplaire, ouvert directement. */
function unique(S: StructureBuilder, type: string, titre: string, icone: ComponentType) {
  return S.listItem()
    .id(type)
    .title(titre)
    .icon(icone)
    .child(S.document().schemaType(type).documentId(type).initialValueTemplate(type).title(titre));
}

/** Une liste filtrée d'un type de fiche. */
function liste(
  S: StructureBuilder,
  options: { id: string; titre: string; icone: ComponentType; type: string; filtre?: string; params?: Record<string, unknown>; ordre?: Array<{ field: string; direction: "asc" | "desc" }> },
) {
  const { id, titre, icone, type, filtre, params, ordre } = options;
  let documents = S.documentTypeList(type)
    .id(id)
    .title(titre)
    .apiVersion(VERSION_API)
    .filter(`_type == $type${filtre ? ` && ${filtre}` : ""}`)
    .params({ type, ...params });
  if (ordre) documents = documents.defaultOrdering(ordre);
  return S.listItem().id(id).title(titre).icon(icone).child(documents);
}

export const structure: StructureResolver = (S) => {
  const jour = aujourdhui();
  return S.list()
    .title("Minimum")
    .items([
      S.listItem()
        .id("cinema")
        .title("Cinéma")
        .icon(DocumentVideoIcon)
        .child(
          S.list()
            .title("Cinéma")
            .items([
              liste(S, { id: "films-en-cours", titre: "Films en cours et annoncés", icone: DocumentVideoIcon, type: "film", filtre: '!("passe" in statuts)', ordre: [{ field: "title", direction: "asc" }] }),
              liste(S, { id: "films", titre: "Tous les films", icone: DocumentVideoIcon, type: "film", ordre: [{ field: "_createdAt", direction: "desc" }] }),
              S.divider(),
              liste(S, { id: "seances-a-venir", titre: "Séances à venir", icone: CalendarIcon, type: "screening", filtre: "date >= $jour", params: { jour }, ordre: [...PROCHAINES, { field: "time", direction: "asc" }] }),
              liste(S, { id: "seances-passees", titre: "Séances passées", icone: ClockIcon, type: "screening", filtre: "date < $jour", params: { jour }, ordre: RECENTES }),
              S.divider(),
              liste(S, { id: "sans-film", titre: "Cases sans film (privé, vacances)", icone: BlockElementIcon, type: "sansFilm", ordre: RECENTES }),
            ]),
        ),
      S.listItem()
        .id("musique")
        .title("Musique")
        .icon(MoonIcon)
        .child(
          S.list()
            .title("Musique")
            .items([
              liste(S, { id: "soirees-a-venir", titre: "Soirées à venir", icone: MoonIcon, type: "soiree", filtre: "date >= $jour", params: { jour }, ordre: PROCHAINES }),
              liste(S, { id: "soirees-passees", titre: "Soirées passées", icone: ClockIcon, type: "soiree", filtre: "date < $jour", params: { jour }, ordre: RECENTES }),
              S.divider(),
              liste(S, { id: "lives-a-venir", titre: "Lives YouTube à venir", icone: PlayIcon, type: "emission", filtre: "date >= $jour", params: { jour }, ordre: [...PROCHAINES, { field: "heure", direction: "asc" }] }),
              liste(S, { id: "lives-passes", titre: "Lives passés (à revoir)", icone: ClockIcon, type: "emission", filtre: "date < $jour", params: { jour }, ordre: RECENTES }),
              S.divider(),
              liste(S, { id: "artistes", titre: "Artistes et DJ", icone: UsersIcon, type: "artiste", ordre: [{ field: "nom", direction: "asc" }] }),
            ]),
        ),
      liste(S, { id: "evenements", titre: "Événements", icone: StarIcon, type: "evenement", ordre: [{ field: "dateDebut", direction: "desc" }] }),
      S.divider(),
      S.listItem()
        .id("billetterie")
        .title("Billetterie")
        .icon(BillIcon)
        .child(
          S.list()
            .title("Billetterie")
            .items([
              liste(S, { id: "billets-entree", titre: "Contrôle à l'entrée (billets payés à venir)", icone: CheckmarkCircleIcon, type: "commande", filtre: 'statut == "payee" && evenementDate >= $jour', params: { jour }, ordre: [{ field: "evenementDate", direction: "asc" }, { field: "reference", direction: "asc" }] }),
              liste(S, { id: "commandes-payees", titre: "Toutes les commandes payées", icone: BillIcon, type: "commande", filtre: 'statut == "payee"', ordre: [{ field: "creeLe", direction: "desc" }] }),
              liste(S, { id: "commandes-a-verifier", titre: "À vérifier", icone: WarningOutlineIcon, type: "commande", filtre: 'statut == "a-verifier"', ordre: [{ field: "creeLe", direction: "desc" }] }),
              liste(S, { id: "commandes-remboursees", titre: "Remboursées", icone: BillIcon, type: "commande", filtre: 'statut == "remboursee"', ordre: [{ field: "creeLe", direction: "desc" }] }),
              liste(S, { id: "commandes", titre: "Toutes les commandes", icone: BillIcon, type: "commande", ordre: [{ field: "creeLe", direction: "desc" }] }),
            ]),
        ),
      S.divider(),
      S.listItem()
        .id("lieu")
        .title("Le lieu")
        .icon(HomeIcon)
        .child(
          S.list()
            .title("Le lieu")
            .items([
              unique(S, "reglagesMinimum", "Réglages (contact, tarifs, YouTube, Instagram)", CogIcon),
              unique(S, "abonnements", "Cartes de membre et paiement", CreditCardIcon),
              unique(S, "location", "Projections privées et location", HomeIcon),
              unique(S, "histoire", "Histoire du lieu", BookIcon),
            ]),
        ),
    ]);
};

/** Les fiches qui peuvent devenir un post ont un onglet « Instagram » à côté du formulaire. */
export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) =>
  TYPES_INSTAGRAM.includes(schemaType)
    ? S.document().views([S.view.form().title("Fiche"), S.view.component(VueInstagram).title("Instagram").icon(ImageIcon)])
    : S.document().views([S.view.form()]);
