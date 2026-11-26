/* Minimum : l'onglet « Instagram » d'une fiche (soirée, artiste, live, film, événement).
   Il montre le post tel qu'il sortira, dans les trois formats, avec sa légende.
   Un bouton enregistre l'image et copie la légende d'un coup. */

import { CopyIcon } from "@sanity/icons/Copy";
import { DownloadIcon } from "@sanity/icons/Download";
import { ShareIcon } from "@sanity/icons/Share";
import { Box, Button, Card, Flex, Select, Spinner, Stack, Text, TextArea } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import type { UserViewComponent } from "sanity/structure";
import { VERSION_API } from "../projet";
import { copier, fabriquerImage, partagePossible, partager, telecharger } from "./partage";
import type { Proposition } from "./propositions";
import { chargerPropositions } from "./requetes";
import { FORMATS, type Format, dessiner } from "./rendu";

const LISTE_FORMATS = Object.keys(FORMATS) as Format[];

export const VueInstagram: UserViewComponent = ({ documentId, schemaType, document }) => {
  const client = useClient({ apiVersion: VERSION_API });
  const toast = useToast();
  const canevas = useRef<HTMLCanvasElement>(null);
  const [propositions, setPropositions] = useState<Proposition[] | null | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cle, setCle] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>("post");
  const [legendes, setLegendes] = useState<Record<string, string>>({});
  const [occupe, setOccupe] = useState(false);
  const peutPartager = useMemo(partagePossible, []);

  /* Relit la fiche quand elle change, un peu après la dernière frappe.
     Une simple relecture : aucune écoute permanente n'est ouverte. */
  const revision = document.displayed._rev ?? document.displayed._updatedAt ?? "";
  useEffect(() => {
    let annule = false;
    const attente = setTimeout(() => {
      chargerPropositions(client, schemaType.name, documentId)
        .then((liste) => {
          if (annule) return;
          setPropositions(liste);
          setErreur(null);
        })
        .catch((cause: unknown) => {
          if (annule) return;
          console.error("Minimum : le post Instagram n'a pas pu être préparé.", cause);
          setErreur("Le post n'a pas pu être préparé. Vérifiez la connexion, puis rouvrez cet onglet.");
        });
    }, 700);
    return () => {
      annule = true;
      clearTimeout(attente);
    };
  }, [client, schemaType.name, documentId, revision]);

  const proposition = propositions?.find((p) => p.cle === cle) ?? propositions?.[0] ?? null;
  const legende = proposition ? (legendes[proposition.cle] ?? proposition.legende) : "";

  useEffect(() => {
    if (!proposition || !canevas.current) return;
    dessiner(canevas.current, proposition.visuel, format).catch((cause: unknown) => {
      console.error("Minimum : le visuel n'a pas pu être dessiné.", cause);
      setErreur("Le visuel n'a pas pu être dessiné dans ce navigateur.");
    });
  }, [proposition, format]);

  const avecImage = useCallback(
    async (suite: (fichier: File) => Promise<void> | void) => {
      if (!proposition) return;
      setOccupe(true);
      try {
        await suite(await fabriquerImage(proposition.visuel, format, proposition.fichier));
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        console.error("Minimum : l'image du post n'a pas pu être enregistrée.", cause);
        toast.push({ status: "error", title: "L'image n'a pas pu être enregistrée", description: "Réessayez, ou changez de navigateur." });
      } finally {
        setOccupe(false);
      }
    },
    [proposition, format, toast],
  );

  const unClic = () =>
    avecImage(async (fichier) => {
      telecharger(fichier);
      const copiee = await copier(legende);
      toast.push({
        status: copiee ? "success" : "warning",
        title: copiee ? "Image enregistrée, légende copiée" : "Image enregistrée",
        description: copiee
          ? "Ouvrez Instagram, choisissez l'image, puis collez la légende."
          : "Le navigateur a refusé de copier la légende : utilisez « Copier la légende ».",
      });
    });

  if (erreur) {
    return (
      <Card padding={4} tone="critical" margin={4}>
        <Text>{erreur}</Text>
      </Card>
    );
  }
  if (propositions === undefined) {
    return (
      <Flex align="center" justify="center" padding={6} gap={3}>
        <Spinner muted />
        <Text muted>Préparation du post…</Text>
      </Flex>
    );
  }
  if (propositions === null || !proposition) {
    return (
      <Card padding={4} margin={4} tone="caution">
        <Text>Remplissez d'abord la fiche (au moins son nom) : le post se prépare à partir d'elle.</Text>
      </Card>
    );
  }

  const { largeur, hauteur } = FORMATS[format];
  return (
    <Box padding={4}>
      <Stack gap={5}>
        {propositions.length > 1 && (
          <Stack gap={3}>
            <Text size={1} weight="medium">
              Quel post ?
            </Text>
            <Select value={proposition.cle} onChange={(evenement) => setCle(evenement.currentTarget.value)}>
              {propositions.map((p) => (
                <option key={p.cle} value={p.cle}>
                  {p.nom}
                </option>
              ))}
            </Select>
          </Stack>
        )}

        <Flex gap={2} wrap="wrap">
          {LISTE_FORMATS.map((f) => (
            <Button key={f} text={FORMATS[f].nom} mode={f === format ? "default" : "ghost"} selected={f === format} onClick={() => setFormat(f)} />
          ))}
        </Flex>

        <Flex gap={5} wrap="wrap" align="flex-start">
          <Box style={{ flex: "0 1 360px", minWidth: 240 }}>
            <canvas
              ref={canevas}
              width={largeur}
              height={hauteur}
              role="img"
              aria-label={`Aperçu du visuel : ${proposition.visuel.titre}`}
              style={{ display: "block", width: "100%", height: "auto", border: "1px solid var(--card-border-color)" }}
            />
          </Box>

          <Stack gap={4} style={{ flex: "1 1 320px" }}>
            <Button icon={DownloadIcon} tone="primary" fontSize={2} padding={4} text="Image + légende en 1 clic" disabled={occupe} onClick={unClic} />
            {peutPartager && (
              <Button
                icon={ShareIcon}
                mode="ghost"
                text="Envoyer vers Instagram (téléphone)"
                disabled={occupe}
                onClick={() =>
                  avecImage(async (fichier) => {
                    await copier(legende);
                    await partager(fichier, legende);
                  })
                }
              />
            )}
            <Flex gap={2} wrap="wrap">
              <Button icon={DownloadIcon} mode="ghost" text="Image seule" disabled={occupe} onClick={() => avecImage(telecharger)} />
              <Button
                icon={CopyIcon}
                mode="ghost"
                text="Copier la légende"
                onClick={async () => {
                  const copiee = await copier(legende);
                  toast.push(
                    copiee
                      ? { status: "success", title: "Légende copiée" }
                      : { status: "warning", title: "Copie refusée par le navigateur", description: "Sélectionnez le texte ci-dessous et copiez-le à la main." },
                  );
                }}
              />
            </Flex>

            <Stack gap={3}>
              <Text size={1} weight="medium">
                Légende (modifiable avant de copier)
              </Text>
              <TextArea
                rows={14}
                value={legende}
                onChange={(evenement) => {
                  const valeur = evenement.currentTarget.value;
                  setLegendes((avant) => ({ ...avant, [proposition.cle]: valeur }));
                }}
              />
              <Text size={1} muted>
                {legende.length} signes sur 2200 autorisés par Instagram.
              </Text>
            </Stack>

            {proposition.conseils.length > 0 && (
              <Card padding={3} tone="caution" border>
                <Stack gap={3}>
                  {proposition.conseils.map((conseil) => (
                    <Text key={conseil} size={1}>
                      {conseil}
                    </Text>
                  ))}
                </Stack>
              </Card>
            )}
          </Stack>
        </Flex>
      </Stack>
    </Box>
  );
};
