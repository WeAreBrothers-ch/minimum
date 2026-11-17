// @ts-check
/* Minimum : le dessin du panneau d’achat. Rien que du texte HTML ;
   les clics et l’envoi sont branchés par panneau.js. */

import { BILLETTERIE } from "../config.js";
import { echapper, prix } from "../format.js";

/** @typedef {import("../types.js").Tarif} Tarif */

/**
 * Une date qu’on peut acheter : une séance du film, ou la soirée.
 * @typedef {Object} Choix
 * @property {string} id
 * @property {string} jour    « Mercredi 11 novembre »
 * @property {string} heure   « 19 h »
 * @property {string | null} indisponible  « Complet », « Annulée » ; null s’il reste des places.
 * @property {string | null} mention       « En présence de la réalisatrice… »
 */

/**
 * @typedef {Object} OptionsPanneau
 * @property {"seance" | "soiree"} genre
 * @property {Choix[]} choix
 * @property {string | null} choisi   La séance demandée dans l’adresse, s’il y en a une.
 * @property {Tarif[]} tarifs
 * @property {string[]} notes         Phrases sous le panneau (buvette, réductions…).
 */

/**
 * Le jour, avec la mention de la séance s’il y en a une.
 * @param {Choix} choix
 * @returns {string}
 */
function jourHTML(choix) {
  const mention = choix.mention ? `<span class="achat__mention">${echapper(choix.mention)}</span>` : "";
  return `<span class="achat__jour">${echapper(choix.jour)}${mention}</span>`;
}

/**
 * L’heure, suivie de « Complet » ou « Annulée » s’il n’y a plus de place.
 * @param {Choix} choix
 * @returns {string}
 */
function heureHTML(choix) {
  const etat = choix.indisponible ? `\u00a0· ${echapper(choix.indisponible)}` : "";
  return `<span class="achat__heure">${echapper(choix.heure)}${etat}</span>`;
}

/**
 * Les séances sans caisse (vente fermée, ou tout est complet) : à lire seulement.
 * @param {Choix[]} choix
 * @returns {string}
 */
function listeDesDatesHTML(choix) {
  if (choix.length === 0) return "";
  const lignes = choix
    .map((c) => `<li class="achat__date${c.indisponible ? " achat__date--off" : ""}">${jourHTML(c)}${heureHTML(c)}</li>`)
    .join("");
  return `<ul class="achat__dates achat__dates--liste">${lignes}</ul>`;
}

/**
 * @param {OptionsPanneau} options
 * @returns {string}
 */
function datesHTML(options) {
  const legende = options.genre === "seance" ? "Séance" : "Soirée";
  const [seul] = options.choix;
  if (options.choix.length === 1 && seul) {
    return (
      `<div class="achat__groupe"><p class="achat__legende">${legende}</p>` +
      `<p class="achat__unique">${echapper(seul.jour)}, ${echapper(seul.heure)}</p>` +
      (seul.mention ? `<p class="achat__mention">${echapper(seul.mention)}</p>` : "") +
      `<input type="hidden" name="evenement" value="${echapper(seul.id)}"></div>`
    );
  }
  const ouvertes = options.choix.filter((c) => c.indisponible === null);
  const choisi = ouvertes.some((c) => c.id === options.choisi) ? options.choisi : ouvertes[0]?.id;
  const lignes = options.choix
    .map((c) => {
      const off = c.indisponible !== null;
      return (
        `<label class="achat__date${off ? " achat__date--off" : ""}"><input type="radio" name="evenement" value="${echapper(c.id)}"` +
        `${c.id === choisi ? " checked" : ""}${off ? " disabled" : ""}>${jourHTML(c)}${heureHTML(c)}</label>`
      );
    })
    .join("");
  return `<fieldset class="achat__groupe"><legend class="achat__legende">${legende}</legend><div class="achat__dates">${lignes}</div></fieldset>`;
}

/**
 * @param {Tarif} tarif
 * @returns {string}
 */
function tarifHTML(tarif) {
  const nom = echapper(tarif.libelle);
  const cle = echapper(tarif.cle);
  return (
    `<div class="achat__tarif"><p class="achat__libelle"><span class="achat__nom">${nom}</span>` +
    (tarif.detail ? `<span class="achat__detail">${echapper(tarif.detail)}</span>` : "") +
    `</p><p class="achat__prix"><span class="pastille pastille--argent">${prix(tarif.prix)}</span></p><div class="achat__compteur">` +
    `<button type="button" class="achat__pas" data-cle="${cle}" data-pas="-1" aria-label="Un billet ${nom} de moins" aria-disabled="true">−</button>` +
    `<output class="achat__nombre" data-nombre="${cle}" aria-label="Billets ${nom}">0</output>` +
    `<button type="button" class="achat__pas" data-cle="${cle}" data-pas="1" aria-label="Un billet ${nom} de plus">+</button>` +
    `</div></div>`
  );
}

/** @returns {string} */
function emailHTML() {
  return (
    `<div class="achat__groupe"><label class="achat__legende" for="achat-email">E-mail</label>` +
    `<input class="achat__champ" id="achat-email" name="email" type="email" autocomplete="email" ` +
    `inputmode="email" spellcheck="false" aria-describedby="achat-email-aide achat-erreur-email">` +
    `<p class="achat__aide" id="achat-email-aide">Pour vous joindre au sujet de votre commande.</p>` +
    `<p class="achat__erreur message-probleme" id="achat-erreur-email" data-erreur="email" hidden></p></div>`
  );
}

/**
 * Le panneau complet. Si la vente en ligne est fermée, ou que tout est
 * complet, les séances restent lisibles, suivies des notes (buvette…).
 * @param {OptionsPanneau} options
 * @returns {string}
 */
export function panneauHTML(options) {
  const notes = options.notes.map((n) => `<p class="achat__note">${echapper(n)}</p>`).join("");
  const ouvertes = options.choix.filter((c) => c.indisponible === null);
  if (BILLETTERIE === "fermee" || ouvertes.length === 0 || options.tarifs.length === 0) {
    return listeDesDatesHTML(options.choix) + notes;
  }
  return (
    `<form class="achat" novalidate data-genre="${options.genre}">${datesHTML(options)}<div class="achat__suite">` +
    `<fieldset class="achat__groupe" aria-describedby="achat-erreur-billets"><legend class="achat__legende">Billets</legend>` +
    `<div class="achat__tarifs">${options.tarifs.map(tarifHTML).join("")}</div>` +
    `<p class="achat__erreur message-probleme" id="achat-erreur-billets" data-erreur="billets" hidden></p></fieldset>` +
    emailHTML() +
    `<p class="achat__total"><span>Total</span><output class="achat__montant pastille pastille--argent">${prix(0)}</output></p>` +
    `<button class="achat__payer pastille pastille--argent pastille--action" type="submit">Payer</button>` +
    `<p class="achat__aide">Paiement par carte, sur la page sécurisée de SumUp.</p>` +
    `<p class="visuellement-cache" aria-live="polite" data-annonce></p>` +
    `<div class="achat__retour message-probleme" role="status"></div></div></form>${notes}`
  );
}
