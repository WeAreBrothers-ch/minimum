/* Minimum : les deux gestes possibles sur une commande de billets.
   La commande est écrite par la caisse du site et ne se modifie pas à la
   main ; ces boutons ne touchent qu'au contrôle d'entrée et au remboursement. */

import { CheckmarkCircleIcon } from "@sanity/icons";
import { UndoIcon } from "@sanity/icons";
import { useToast } from "@sanity/ui";
import { useState } from "react";
import { type DocumentActionComponent, useClient } from "sanity";
import { VERSION_API } from "../../projet";

/** Coche le billet à l'entrée, ou annule la coche. */
export const BilletControle: DocumentActionComponent = ({ id, published, onComplete }) => {
  const client = useClient({ apiVersion: VERSION_API });
  const toast = useToast();
  const [occupe, setOccupe] = useState(false);
  const dejaControle = Boolean(published?.utiliseeLe);
  const payee = published?.statut === "payee";

  return {
    label: dejaControle ? "Annuler le contrôle" : "Billet contrôlé",
    icon: dejaControle ? UndoIcon : CheckmarkCircleIcon,
    tone: dejaControle ? "default" : "positive",
    disabled: occupe || !published || (!payee && !dejaControle),
    title: !payee && !dejaControle ? "Seule une commande payée donne droit à l'entrée." : undefined,
    onHandle: async () => {
      setOccupe(true);
      try {
        const patch = client.patch(id);
        await (dejaControle ? patch.unset(["utiliseeLe"]) : patch.set({ utiliseeLe: new Date().toISOString() })).commit();
        toast.push({ status: "success", title: dejaControle ? "Contrôle annulé" : "Billet contrôlé" });
      } catch (cause) {
        console.error("Minimum : le contrôle du billet n'a pas pu être enregistré.", cause);
        toast.push({ status: "error", title: "Le contrôle n'a pas pu être enregistré", description: "Vérifiez la connexion et réessayez." });
      } finally {
        setOccupe(false);
        onComplete();
      }
    },
  };
};
BilletControle.displayName = "BilletControle";

/** À cliquer APRÈS avoir remboursé l'acheteur depuis SumUp : libère les places. */
export const MarquerRemboursee: DocumentActionComponent = ({ id, published, onComplete }) => {
  const client = useClient({ apiVersion: VERSION_API });
  const toast = useToast();
  const [confirmation, setConfirmation] = useState(false);
  const remboursable = published?.statut === "payee" || published?.statut === "a-verifier";

  return {
    label: "Marquer comme remboursée",
    icon: UndoIcon,
    tone: "caution",
    disabled: !remboursable,
    title: remboursable ? undefined : "Seule une commande payée peut être remboursée.",
    onHandle: () => setConfirmation(true),
    dialog: confirmation && {
      type: "confirm",
      tone: "caution",
      message:
        "Le remboursement lui-même se fait dans SumUp : ce bouton ne rend pas l'argent, il note seulement que c'est fait et libère les places. Avez-vous déjà remboursé l'acheteur dans SumUp ?",
      onCancel: () => {
        setConfirmation(false);
        onComplete();
      },
      onConfirm: async () => {
        try {
          await client.patch(id).set({ statut: "remboursee" }).commit();
          toast.push({ status: "success", title: "Commande notée comme remboursée" });
        } catch (cause) {
          console.error("Minimum : la commande n'a pas pu être notée comme remboursée.", cause);
          toast.push({ status: "error", title: "Le changement n'a pas pu être enregistré", description: "Vérifiez la connexion et réessayez." });
        } finally {
          setConfirmation(false);
          onComplete();
        }
      },
    },
  };
};
MarquerRemboursee.displayName = "MarquerRemboursee";
