/* Minimum : le planning de la semaine, du mercredi au mardi.
   Tout ce qui a lieu dans le lieu, jour par jour : séances, soirées, lives,
   cases sans film, événements. Un clic ouvre la fiche ; « + » en crée une
   à la bonne date. Deux séances qui se chevauchent sont signalées. */

import { AddIcon } from "@sanity/icons/Add";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { ChevronLeftIcon } from "@sanity/icons/ChevronLeft";
import { ChevronRightIcon } from "@sanity/icons/ChevronRight";
import { RefreshIcon } from "@sanity/icons/Refresh";
import { Box, Button, Card, Flex, Heading, Spinner, Stack, Text } from "@sanity/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Tool, useClient } from "sanity";
import { IntentLink } from "sanity/router";
import { VERSION_API } from "../projet";
import { aujourdhui, jourEnLettres, minutes } from "../schemaTypes/shared/heure";
import { ajouterJours, chevauchements, joursDeLaSemaine, mercrediDe } from "./semaine";

type Genre = "screening" | "soiree" | "emission" | "sansFilm" | "evenement";

interface Ligne {
  id: string;
  genre: Genre;
  date: string;
  heure: string | null;
  titre: string;
  detail: string | null;
  /** Durée en minutes, pour repérer deux séances qui se chevauchent. */
  duree: number | null;
}

interface Lu {
  seances: Array<{ _id: string; date: string; time?: string; status?: string; versionNote?: string; titre?: string; duree?: number }>;
  soirees: Array<{ _id: string; date: string; ouverture?: string; title?: string; status?: string }>;
  lives: Array<{ _id: string; date: string; heure?: string; title?: string }>;
  cases: Array<{ _id: string; date: string; time?: string; libelle?: string; room?: string }>;
  evenements: Array<{ _id: string; title?: string; dateDebut: string; dateFin?: string }>;
}

const REQUETE = `{
  "seances": *[_type == "screening" && date >= $du && date <= $au]{_id, date, time, status, versionNote, "titre": film->title, "duree": film->duration},
  "soirees": *[_type == "soiree" && date >= $du && date <= $au]{_id, date, ouverture, title, status},
  "lives": *[_type == "emission" && date >= $du && date <= $au]{_id, date, heure, title},
  "cases": *[_type == "sansFilm" && date >= $du && date <= $au]{_id, date, time, libelle, room},
  "evenements": *[_type == "evenement" && dateDebut <= $au && coalesce(dateFin, dateDebut) >= $du]{_id, title, dateDebut, dateFin}
}`;

/* Le code couleur du site : rouge le cinéma, rose la musique, jaune l'agenda. */
const GENRES: Record<Genre, { nom: string; couleur: string }> = {
  screening: { nom: "Séance", couleur: "#a72920" },
  soiree: { nom: "Soirée", couleur: "#f48fbf" },
  emission: { nom: "Live YouTube", couleur: "#f48fbf" },
  sansFilm: { nom: "Sans film", couleur: "#6b6b6b" },
  evenement: { nom: "Événement", couleur: "#f6d82b" },
};

const ETATS: Record<string, string> = { complet: "Complet", annule: "Annulée" };
const DUREE_PAR_DEFAUT = 100;

function enLignes(lu: Lu, jours: string[]): Ligne[] {
  const lignes: Ligne[] = [];
  for (const s of lu.seances) {
    lignes.push({ id: s._id, genre: "screening", date: s.date, heure: s.time ?? null, titre: s.titre ?? "Film à choisir", detail: [s.versionNote, s.status ? ETATS[s.status] : null].filter(Boolean).join(" · ") || null, duree: s.status === "annule" ? null : (s.duree ?? DUREE_PAR_DEFAUT) });
  }
  for (const s of lu.soirees) {
    lignes.push({ id: s._id, genre: "soiree", date: s.date, heure: s.ouverture ?? null, titre: s.title ?? "Soirée sans nom", detail: s.status ? (ETATS[s.status] ?? null) : null, duree: null });
  }
  for (const l of lu.lives) lignes.push({ id: l._id, genre: "emission", date: l.date, heure: l.heure ?? null, titre: l.title ?? "Live sans nom", detail: null, duree: null });
  for (const c of lu.cases) {
    const vacances = c.libelle === "Vacances";
    lignes.push({ id: c._id, genre: "sansFilm", date: c.date, heure: vacances ? null : (c.time ?? null), titre: c.libelle ?? "Case sans film", detail: vacances ? "Fermé toute la journée" : (c.room ?? null), duree: null });
  }
  /* Un événement s'affiche chaque jour de sa durée qui tombe dans la semaine. */
  for (const e of lu.evenements) {
    const fin = e.dateFin ?? e.dateDebut;
    for (const jour of jours) {
      if (jour >= e.dateDebut && jour <= fin) lignes.push({ id: e._id, genre: "evenement", date: jour, heure: null, titre: e.title ?? "Événement sans titre", detail: null, duree: null });
    }
  }
  return lignes;
}

function Planning() {
  const client = useClient({ apiVersion: VERSION_API });
  const jourJ = useMemo(aujourdhui, []);
  const [mercredi, setMercredi] = useState(() => mercrediDe(jourJ));
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [erreur, setErreur] = useState(false);
  const jours = useMemo(() => joursDeLaSemaine(mercredi), [mercredi]);

  const charger = useCallback(() => {
    let annule = false;
    setErreur(false);
    setLignes(null);
    client
      .fetch<Lu>(REQUETE, { du: jours[0], au: jours[6] }, { perspective: "drafts" })
      .then((lu) => {
        if (!annule) setLignes(enLignes(lu, jours));
      })
      .catch((cause: unknown) => {
        if (annule) return;
        console.error("Minimum : le planning n'a pas pu être lu.", cause);
        setErreur(true);
      });
    return () => {
      annule = true;
    };
  }, [client, jours]);

  useEffect(charger, [charger]);

  /* Les séances qui se chevauchent, jour par jour (une seule salle de cinéma). */
  const enConflit = useMemo(() => {
    const pris = new Set<string>();
    for (const jour of jours) {
      const creneaux = (lignes ?? [])
        .filter((l) => l.genre === "screening" && l.date === jour && l.duree !== null && minutes(l.heure) !== null)
        .map((l) => ({ id: l.id, debut: minutes(l.heure) as number, fin: (minutes(l.heure) as number) + (l.duree as number) }));
      for (const id of chevauchements(creneaux)) pris.add(id);
    }
    return pris;
  }, [lignes, jours]);

  return (
    <Box padding={4} style={{ height: "100%", overflow: "auto" }}>
      <Stack gap={5}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack gap={3}>
            <Heading as="h1" size={2}>
              Semaine du {jourEnLettres(jours[0])} au {jourEnLettres(jours[6])}
            </Heading>
            <Text size={1} muted>
              La semaine de cinéma va du mercredi au mardi. Un clic ouvre la fiche ; « + » en crée une à cette date.
            </Text>
          </Stack>
          <Flex gap={2} wrap="wrap">
            <Button icon={ChevronLeftIcon} mode="ghost" text="Semaine précédente" onClick={() => setMercredi(ajouterJours(mercredi, -7))} />
            <Button mode="ghost" text="Cette semaine" disabled={mercredi === mercrediDe(jourJ)} onClick={() => setMercredi(mercrediDe(jourJ))} />
            <Button iconRight={ChevronRightIcon} mode="ghost" text="Semaine suivante" onClick={() => setMercredi(ajouterJours(mercredi, 7))} />
            <Button icon={RefreshIcon} mode="bleed" text="Actualiser" onClick={charger} />
          </Flex>
        </Flex>

        <Flex gap={4} wrap="wrap">
          {(Object.keys(GENRES) as Genre[]).filter((g) => g !== "emission").map((genre) => (
            <Flex key={genre} align="center" gap={2}>
              <span aria-hidden="true" style={{ width: 12, height: 12, background: GENRES[genre].couleur, display: "inline-block" }} />
              <Text size={1}>{genre === "soiree" ? "Soirée et live" : GENRES[genre].nom}</Text>
            </Flex>
          ))}
        </Flex>

        {erreur && (
          <Card padding={4} tone="critical" border>
            <Flex align="center" justify="space-between" gap={3}>
              <Text>Le planning n'a pas pu être lu. Vérifiez la connexion.</Text>
              <Button icon={RefreshIcon} text="Réessayer" onClick={charger} />
            </Flex>
          </Card>
        )}
        {!erreur && lignes === null && (
          <Flex align="center" gap={3} padding={4}>
            <Spinner muted />
            <Text muted>Lecture de la semaine…</Text>
          </Flex>
        )}

        {lignes !== null && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12, alignItems: "start" }}>
            {jours.map((jour) => {
              const duJour = lignes.filter((l) => l.date === jour).sort((a, b) => (a.heure ?? "").localeCompare(b.heure ?? ""));
              return (
                <Card key={jour} border padding={3} tone={jour === jourJ ? "primary" : "default"} data-jour={jour}>
                  <Stack gap={3}>
                    <Text size={1} weight="semibold">
                      {jourEnLettres(jour).replace(/^./, (lettre) => lettre.toLocaleUpperCase("fr"))}
                      {jour === jourJ ? " · aujourd'hui" : ""}
                    </Text>
                    {duJour.length === 0 && (
                      <Text size={1} muted>
                        Rien ce jour-là.
                      </Text>
                    )}
                    {duJour.map((ligne) => (
                      <Card
                        key={`${ligne.genre}-${ligne.id}`}
                        as={IntentLink}
                        {...{ intent: "edit", params: { id: ligne.id, type: ligne.genre } }}
                        data-as="a"
                        padding={2}
                        border
                        tone={enConflit.has(ligne.id) ? "caution" : "default"}
                        style={{ borderLeft: `6px solid ${GENRES[ligne.genre].couleur}`, textDecoration: "none" }}
                      >
                        <Stack gap={2}>
                          <Text size={1} weight="semibold">
                            {[ligne.heure, ligne.titre].filter(Boolean).join(" · ")}
                          </Text>
                          <Text size={0} muted>
                            {[GENRES[ligne.genre].nom, ligne.detail, enConflit.has(ligne.id) ? "chevauche une autre séance" : null].filter(Boolean).join(" · ")}
                          </Text>
                        </Stack>
                      </Card>
                    ))}
                    <Flex gap={1} wrap="wrap">
                      <Button as={IntentLink} {...{ intent: "create", params: [{ type: "screening", template: "seance-du-jour" }, { date: jour }] }} icon={AddIcon} mode="bleed" fontSize={1} padding={2} text="Séance" />
                      <Button as={IntentLink} {...{ intent: "create", params: [{ type: "soiree", template: "soiree-du-jour" }, { date: jour }] }} icon={AddIcon} mode="bleed" fontSize={1} padding={2} text="Soirée" />
                      <Button as={IntentLink} {...{ intent: "create", params: [{ type: "emission", template: "live-du-jour" }, { date: jour }] }} icon={AddIcon} mode="bleed" fontSize={1} padding={2} text="Live" />
                    </Flex>
                  </Stack>
                </Card>
              );
            })}
          </div>
        )}
      </Stack>
    </Box>
  );
}

/** L'outil « Planning », à côté de « Structure » dans la barre du Studio. */
export const outilPlanning: Tool = {
  name: "planning",
  title: "Planning",
  icon: CalendarIcon,
  component: Planning,
};
