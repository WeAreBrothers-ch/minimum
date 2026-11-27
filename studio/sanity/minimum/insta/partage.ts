/* Minimum : faire sortir un post du Studio : enregistrer l'image, copier la légende, partager. */

import { type Format, type Visuel, dessiner, versFichier } from "./rendu";

/** Dessine le visuel hors écran et le rend en fichier JPEG. */
export async function fabriquerImage(visuel: Visuel, format: Format, nom: string): Promise<File> {
  const canevas = document.createElement("canvas");
  await dessiner(canevas, visuel, format);
  return versFichier(canevas, `${nom}-${format}`);
}

/** Enregistre le fichier dans les téléchargements. */
export function telecharger(fichier: File): void {
  const adresse = URL.createObjectURL(fichier);
  const lien = document.createElement("a");
  lien.href = adresse;
  lien.download = fichier.name;
  document.body.append(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(adresse), 10_000);
}

/** Copie la légende. false si le navigateur refuse (il faut alors la copier à la main). */
export async function copier(texte: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    return false;
  }
}

/** Sur téléphone : le navigateur sait-il envoyer une image à une autre application ? */
export function partagePossible(): boolean {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  return navigator.canShare({ files: [new File([""], "essai.jpg", { type: "image/jpeg" })] });
}

/** Ouvre la feuille de partage du téléphone (Instagram y figure s'il est installé). */
export async function partager(fichier: File, legende: string): Promise<void> {
  await navigator.share({ files: [fichier], text: legende });
}
