/* Minimum : la semaine de cinéma va du mercredi au mardi. Calculs de dates, sans fuseau :
   une date est « AAAA-MM-JJ », manipulée à midi UTC pour ne jamais glisser d'un jour. */

const versDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const versIso = (date: Date) => date.toISOString().slice(0, 10);

/** Ajoute des jours à une date « AAAA-MM-JJ ». */
export function ajouterJours(iso: string, jours: number): string {
  const date = versDate(iso);
  date.setUTCDate(date.getUTCDate() + jours);
  return versIso(date);
}

/** Le mercredi qui ouvre la semaine de cinéma contenant ce jour. */
export function mercrediDe(iso: string): string {
  const jour = versDate(iso).getUTCDay(); // 0 = dimanche … 3 = mercredi
  return ajouterJours(iso, -((jour - 3 + 7) % 7));
}

/** Les sept jours de la semaine qui commence ce mercredi. */
export function joursDeLaSemaine(mercredi: string): string[] {
  return Array.from({ length: 7 }, (_, rang) => ajouterJours(mercredi, rang));
}

export interface Creneau {
  id: string;
  debut: number;
  fin: number;
}

/** Les créneaux d'une même journée qui se chevauchent dans la salle. */
export function chevauchements(creneaux: Creneau[]): Set<string> {
  const pris = new Set<string>();
  const tries = [...creneaux].sort((a, b) => a.debut - b.debut);
  for (let i = 0; i < tries.length; i += 1) {
    for (let j = i + 1; j < tries.length && tries[j].debut < tries[i].fin; j += 1) {
      pris.add(tries[i].id);
      pris.add(tries[j].id);
    }
  }
  return pris;
}
