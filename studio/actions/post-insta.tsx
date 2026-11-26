/* Minimum : le bouton « Post Insta » d'une fiche.
   Un clic : l'image du post est enregistrée et sa légende copiée. Pour
   choisir un autre format ou retoucher la légende : l'onglet « Instagram ». */

import { ImageIcon } from "@sanity/icons/Image";
import { useToast } from "@sanity/ui/toast";
import { useState } from "react";
import { type DocumentActionComponent, useClient } from "sanity";
import { copier, fabriquerImage, telecharger } from "../insta/partage";
import { chargerPropositions } from "../insta/requetes";
import { VERSION_API } from "../projet";

export const PostInsta: DocumentActionComponent = ({ id, type, draft, published, onComplete }) => {
  const client = useClient({ apiVersion: VERSION_API });
  const toast = useToast();
  const [occupe, setOccupe] = useState(false);

  return {
    label: occupe ? "Préparation du post…" : "Post Insta en 1 clic",
    icon: ImageIcon,
    disabled: occupe || (!draft && !published),
    title: !draft && !published ? "Remplissez d'abord la fiche." : "Enregistre l'image du post et copie sa légende.",
    onHandle: async () => {
      setOccupe(true);
      try {
        const proposition = (await chargerPropositions(client, type, id))?.[0];
        if (!proposition) {
          toast.push({ status: "warning", title: "Rien à poster pour l'instant", description: "Remplissez d'abord la fiche." });
          return;
        }
        telecharger(await fabriquerImage(proposition.visuel, "post", proposition.fichier));
        const copiee = await copier(proposition.legende);
        toast.push({
          status: "success",
          title: copiee ? "Image enregistrée, légende copiée" : "Image enregistrée",
          description: copiee
            ? "Ouvrez Instagram, choisissez l'image, puis collez la légende."
            : "Pour la légende, la story ou un post par DJ : onglet « Instagram » en haut de la fiche.",
        });
      } catch (cause) {
        console.error("Minimum : le post Instagram n'a pas pu être préparé.", cause);
        toast.push({ status: "error", title: "Le post n'a pas pu être préparé", description: "Vérifiez la connexion et réessayez." });
      } finally {
        setOccupe(false);
        onComplete();
      }
    },
  };
};
PostInsta.displayName = "PostInsta";
