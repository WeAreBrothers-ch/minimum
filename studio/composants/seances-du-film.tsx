/* Minimum : les séances d'un film, dans la fiche du film.
   On les voit, on en ouvre une, on en ajoute une, sans quitter la fiche. */

import { AddIcon } from "@sanity/icons/Add";
import { RefreshIcon } from "@sanity/icons/Refresh";
import { Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { useCallback, useEffect, useState } from "react";
import { type StringInputProps, useClient, useFormValue } from "sanity";
import { IntentLink } from "sanity/router";
import { VERSION_API } from "../projet";
import { aujourdhui, jourEnLettres } from "../schemaTypes/shared/heure";

interface SeanceLue {
  _id: string;
  date?: string;
  time?: string;
  status?: string;
  versionNote?: string;
}

const ETATS: Record<string, string> = { complet: "Complet", annule: "Annulée" };

export function SeancesDuFilm(_props: StringInputProps) {
  const client = useClient({ apiVersion: VERSION_API });
  const idBrut = useFormValue(["_id"]);
  const filmId = typeof idBrut === "string" ? idBrut.replace(/^drafts\./, "") : null;
  const [seances, setSeances] = useState<SeanceLue[] | null>(null);
  const [publie, setPublie] = useState(false);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    if (!filmId) return;
    setErreur(false);
    Promise.all([
      client.fetch<SeanceLue[]>(
        '*[_type == "screening" && film._ref == $film && date >= $jour] | order(date asc, time asc){_id, date, time, status, versionNote}',
        { film: filmId, jour: aujourdhui() },
        { perspective: "drafts" },
      ),
      client.fetch<boolean>("defined(*[_id == $film][0]._id)", { film: filmId }, { perspective: "published" }),
    ])
      .then(([liste, existe]) => {
        setSeances(liste);
        setPublie(existe);
      })
      .catch((cause: unknown) => {
        console.error("Minimum : les séances du film n'ont pas pu être lues.", cause);
        setErreur(true);
      });
  }, [client, filmId]);

  useEffect(charger, [charger]);

  if (!filmId || !publie) {
    return (
      <Card padding={3} tone="caution" border>
        <Text size={1}>Publiez d'abord la fiche du film : vous pourrez ensuite lui ajouter des séances ici.</Text>
      </Card>
    );
  }
  if (erreur) {
    return (
      <Card padding={3} tone="critical" border>
        <Flex align="center" justify="space-between" gap={3}>
          <Text size={1}>Les séances n'ont pas pu être lues.</Text>
          <Button icon={RefreshIcon} mode="ghost" text="Réessayer" onClick={charger} />
        </Flex>
      </Card>
    );
  }

  return (
    <Stack gap={3}>
      {seances === null ? (
        <Text size={1} muted>
          Lecture des séances…
        </Text>
      ) : seances.length === 0 ? (
        <Text size={1} muted>
          Aucune séance à venir pour ce film.
        </Text>
      ) : (
        <Stack gap={1}>
          {seances.map((seance) => (
            <Card key={seance._id} as={IntentLink} {...{ intent: "edit", params: { id: seance._id, type: "screening" } }} padding={3} border data-as="a">
              <Text size={1}>
                {[jourEnLettres(seance.date), seance.time, seance.versionNote, seance.status ? ETATS[seance.status] : null].filter(Boolean).join(" · ")}
              </Text>
            </Card>
          ))}
        </Stack>
      )}
      <Flex gap={2} wrap="wrap">
        <Button
          as={IntentLink}
          {...{ intent: "create", params: [{ type: "screening", template: "seance-du-film" }, { filmId }] }}
          icon={AddIcon}
          mode="ghost"
          text="Ajouter une séance"
        />
        <Button icon={RefreshIcon} mode="bleed" text="Actualiser" onClick={charger} />
      </Flex>
    </Stack>
  );
}
