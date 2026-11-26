import type { StringRule } from "sanity";

/** Une heure sur 24 heures, « 20:30 ». */
export const MOTIF_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const heureValide = (rule: StringRule) =>
  rule.regex(MOTIF_HEURE, { name: "heure (HH:MM)" }).error("Écrivez l'heure sous la forme 20:30.");

/** « 20:30 » en minutes depuis minuit ; null si l'heure est mal écrite. */
export function minutes(heure: unknown): number | null {
  if (typeof heure !== "string" || !MOTIF_HEURE.test(heure)) return null;
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + m;
}

const JOUR = new Intl.DateTimeFormat("fr-CH", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const JOUR_COURT = new Intl.DateTimeFormat("fr-CH", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** « vendredi 13 novembre », depuis « 2026-11-13 ». */
export function jourEnLettres(date: unknown, court = false): string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  return (court ? JOUR_COURT : JOUR).format(new Date(`${date}T12:00:00Z`));
}

/** La date du jour, « 2026-11-13 », à l'heure de Neuchâtel. */
export function aujourdhui(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(new Date());
}
