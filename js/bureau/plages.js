// @ts-check
/* Minimum Radio : ce que le lecteur peut jouer, le direct puis les
   émissions. Une « plage » est une piste du lecteur du site
   (lecteur.js) accompagnée de ce que le bureau en écrit. */

import { FLUX_RADIO } from "../config.js";
import { heureCourte, jourLong, jourLongMajuscule } from "../format.js";

/** @typedef {import("../types.js").Emission} Emission */
/** @typedef {import("../types.js").Programme} Programme */
/** @typedef {import("../types.js").Piste} Piste */

/**
 * @typedef {Object} Plage
 * @property {Piste} piste
 * @property {string} ecran    Le titre, sur l'écran du lecteur.
 * @property {string} quand    La ligne du dessous : date, ou état.
 * @property {boolean} direct
 */

/** @type {Piste} */
const DIRECT = { id: "direct", titre: "Radio Minimum", etat: "Radio", audio: FLUX_RADIO };

/**
 * @param {Emission} e
 * @returns {Plage}
 */
function plageDeLEmission(e) {
  const quand = `${e.enDirect ? `En direct, ${jourLong(e.date)}` : jourLongMajuscule(e.date)}, ${heureCourte(e.heure)}`;
  return {
    piste: { id: e.id, titre: e.titre, etat: e.enDirect ? "En direct" : "À réécouter", audio: e.audio },
    ecran: e.titre,
    quand,
    direct: e.enDirect,
  };
}

/**
 * Le direct d'abord, puis les émissions en direct, puis les archives de la
 * plus récente à la plus ancienne. Sans programme (il n'a pas pu se charger),
 * il reste le direct.
 * @param {Programme | null} programme
 * @returns {Plage[]}
 */
export function plages(programme) {
  const emissions = programme?.emissions ?? [];
  const enDirect = emissions.filter((e) => e.enDirect);
  const archives = emissions.filter((e) => !e.enDirect).sort((a, b) => b.date.localeCompare(a.date));
  /** @type {Plage} */
  const direct = {
    piste: DIRECT,
    ecran: "Radio Minimum",
    quand: FLUX_RADIO ? "En continu" : "Pas encore à l’antenne",
    direct: true,
  };
  return [direct, ...enDirect.map(plageDeLEmission), ...archives.map(plageDeLEmission)];
}

/**
 * @param {Plage} plage
 * @returns {boolean}
 */
export function sonDisponible(plage) {
  return plage.piste.audio !== null;
}
