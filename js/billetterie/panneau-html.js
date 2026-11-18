// @ts-check
/* Minimum : le dessin de la billetterie. Rien que du texte HTML ; les
   clics, l'ouverture de la caisse et l'envoi sont branchés par panneau.js.

   Deux pièces :
   - sur la fiche, la liste des séances, une case chacune ; un clic sur une
     séance ouvre la caisse avec cette séance choisie ;
   - la caisse, une fenêtre par-dessus la page (<dialog>) : la séance, le
     nombre de billets par tarif, l'e-mail, puis « Payer CHF … ». Rien
     d'autre : pas de total à part, le bouton le porte. */

import { BILLETTERIE } from "../config.js";
import { echapper, prix } from "../format.js";

/** @typedef {import("../types.js").Tarif} Tarif */

/**
 * Une date qu’on peut acheter : une séance du film, ou la soirée.
 * @typedef {Object} Choix
 * @property {string} id
 * @property {string} jour    « Mercredi 11 novembre »
 * @property {string} court   « Mer. 11 nov. »
 * @property {string} heure   « 19 h »
 * @property {string | null} indisponible  « Complet », « Annulée » ; null s’il reste des places.
 * @property {string | null} mention       « En présence de la réalisatrice… »
 */

/**
 * @typedef {Object} OptionsPanneau
 * @property {"seance" | "soiree"} genre
 * @property {string} titre           Le film ou la soirée, en tête de la caisse.
 * @property {Choix[]} choix
 * @property {string | null} choisi   La séance demandée dans l’adresse, s’il y en a une.
 * @property {Tarif[]} tarifs
 * @property {string[]} notes         Phrases sous les séances (buvette, réductions…).
 */

/**
 * Vrai si un billet peut s’acheter ici : vente ouverte, un tarif, une date libre.
 * @param {OptionsPanneau} options
 * @returns {boolean}
 */
export function venteOuverte(options) {
  return BILLETTERIE !== "fermee" && options.tarifs.length > 0 && options.choix.some((c) => c.indisponible === null);
}

/**
 * La première date encore libre : celle de l’adresse, sinon la plus proche.
 * @param {OptionsPanneau} options
 * @returns {string | null}
 */
export function premierChoix(options) {
  const ouvertes = options.choix.filter((c) => c.indisponible === null);
  return (ouvertes.find((c) => c.id === options.choisi) ?? ouvertes[0])?.id ?? null;
}

/**
 * Une séance de la liste : le jour, l’heure, et « Billets » si on peut
 * l’acheter (la case est alors un bouton qui ouvre la caisse).
 * @param {Choix} choix
 * @param {boolean} vente
 * @returns {string}
 */
function seanceHTML(choix, vente) {
  const mention = choix.mention ? `<span class="seance__mention">${echapper(choix.mention)}</span>` : "";
  const quand =
    `<span class="seance__quand"><span class="seance__jour">${echapper(choix.court)}</span>` +
    `<span class="seance__heure">${echapper(choix.heure)}</span>${mention}</span>`;
  if (choix.indisponible) {
    return `<li><p class="seance seance--off">${quand}<span class="seance__action">${echapper(choix.indisponible)}</span></p></li>`;
  }
  if (!vente) return `<li><p class="seance">${quand}</p></li>`;
  return (
    `<li><button type="button" class="seance" data-acheter="${echapper(choix.id)}" aria-label="${echapper(`Billets pour ${choix.jour}, ${choix.heure}`)}">` +
    `${quand}<span class="seance__action">Billets <span aria-hidden="true">→</span></span></button></li>`
  );
}

/**
 * La case des séances, sur la fiche. Elle porte l’ancre #billets.
 * @param {OptionsPanneau} options
 * @param {string} vide  Ce qu’on lit quand rien n’est encore programmé.
 * @returns {string}
 */
export function seancesHTML(options, vide) {
  const vente = venteOuverte(options);
  const titre = options.genre === "seance" ? "Séances" : "Entrée";
  const liste = options.choix.length
    ? `<ul class="seances">${options.choix.map((c) => seanceHTML(c, vente)).join("")}</ul>`
    : `<p class="detail__vide">${echapper(vide)}</p>`;
  const notes = options.notes.length && options.choix.length
    ? `<div class="detail__notes">${options.notes.map((n) => `<p>${echapper(n)}</p>`).join("")}</div>`
    : "";
  return (
    `<section class="detail__seances" id="billets" aria-labelledby="titre-seances">` +
    `<h2 class="detail__case-titre" id="titre-seances">${titre}</h2>${liste}${notes}</section>`
  );
}

/**
 * Le choix de la séance, dans la caisse : une case par date, la choisie
 * pleine. Une seule date : elle s’affiche, sans choix à faire.
 * @param {OptionsPanneau} options
 * @returns {string}
 */
function datesHTML(options) {
  const legende = options.genre === "seance" ? "Séance" : "Soirée";
  const [seul] = options.choix;
  if (options.choix.length === 1 && seul) {
    return (
      `<div class="caisse__bloc"><p class="caisse__legende">${legende}</p>` +
      `<p class="caisse__unique">${echapper(seul.jour)}, ${echapper(seul.heure)}</p>` +
      `<input type="hidden" name="evenement" value="${echapper(seul.id)}"></div>`
    );
  }
  const cases = options.choix
    .map((c) => {
      const off = c.indisponible !== null;
      return (
        `<label class="caisse__date${off ? " caisse__date--off" : ""}">` +
        `<input class="caisse__radio" type="radio" name="evenement" value="${echapper(c.id)}"${off ? " disabled" : ""}>` +
        `<span class="caisse__jour">${echapper(c.court)}</span>` +
        `<span class="caisse__heure">${echapper(off ? `${c.heure}, ${c.indisponible}` : c.heure)}</span></label>`
      );
    })
    .join("");
  return (
    `<fieldset class="caisse__bloc caisse__bloc--cases"><legend class="caisse__legende">${legende}</legend>` +
    `<div class="caisse__dates">${cases}</div></fieldset>`
  );
}

/**
 * Une ligne de tarif : le nom (et ce qu’il couvre), le prix, le compteur.
 * @param {Tarif} tarif
 * @returns {string}
 */
function tarifHTML(tarif) {
  const nom = echapper(tarif.libelle);
  const cle = echapper(tarif.cle);
  return (
    `<div class="caisse__tarif"><p class="caisse__libelle"><span class="caisse__nom">${nom}</span>` +
    (tarif.detail ? `<span class="caisse__detail">${echapper(tarif.detail)}</span>` : "") +
    `</p><p class="caisse__prix">${prix(tarif.prix)}</p><div class="caisse__compteur">` +
    `<button type="button" class="caisse__pas" data-cle="${cle}" data-pas="-1" aria-label="Un billet ${nom} de moins" aria-disabled="true">−</button>` +
    `<output class="caisse__nombre" data-nombre="${cle}" aria-label="Billets ${nom}">0</output>` +
    `<button type="button" class="caisse__pas" data-cle="${cle}" data-pas="1" aria-label="Un billet ${nom} de plus">+</button>` +
    `</div></div>`
  );
}

/**
 * La caisse, en fenêtre par-dessus la page. Seulement quand la vente est ouverte.
 * @param {OptionsPanneau} options
 * @returns {string}
 */
export function caisseHTML(options) {
  if (!venteOuverte(options)) return "";
  return (
    `<dialog class="caisse surface-ecran" aria-labelledby="caisse-titre">` +
    `<form class="achat" novalidate data-genre="${options.genre}">` +
    `<div class="caisse__tete"><h2 class="caisse__titre" id="caisse-titre">Billets</h2>` +
    `<button type="button" class="caisse__fermer" data-fermer aria-label="Fermer"><span class="caisse__croix" aria-hidden="true"></span></button></div>` +
    `<p class="caisse__quoi">${echapper(options.titre)}</p>` +
    datesHTML(options) +
    `<fieldset class="caisse__bloc caisse__bloc--cases" aria-describedby="achat-erreur-billets"><legend class="caisse__legende">Billets</legend>` +
    `<div class="caisse__tarifs">${options.tarifs.map(tarifHTML).join("")}</div>` +
    `<p class="caisse__erreur message-probleme" id="achat-erreur-billets" data-erreur="billets" hidden></p></fieldset>` +
    `<div class="caisse__bloc"><label class="caisse__legende" for="achat-email">E-mail</label>` +
    `<input class="caisse__champ" id="achat-email" name="email" type="email" autocomplete="email" inputmode="email" ` +
    `spellcheck="false" placeholder="nom@exemple.ch" aria-describedby="achat-email-aide achat-erreur-email">` +
    `<p class="caisse__aide" id="achat-email-aide">Pour vous joindre au sujet de votre commande.</p>` +
    `<p class="caisse__erreur message-probleme" id="achat-erreur-email" data-erreur="email" hidden></p></div>` +
    `<div class="caisse__pied"><button class="caisse__payer" type="submit">Payer</button>` +
    `<p class="caisse__aide">Par carte, sur la page sécurisée de SumUp.</p>` +
    `<p class="visuellement-cache" aria-live="polite" data-annonce></p>` +
    `<div class="caisse__retour message-probleme" role="status"></div></div>` +
    `</form></dialog>`
  );
}
