// @ts-check
/* Minimum : parler au serveur de la billetterie (dossier api/).

   Le navigateur ne fait que demander « ces billets, pour cet événement ».
   Il n’annonce jamais un prix et ne voit jamais la clé SumUp : le serveur
   vérifie, calcule, enregistre, puis renvoie l’adresse de la page de
   paiement hébergée par SumUp. */

/** @typedef {import("./modele.js").Panier} Panier */

/**
 * @typedef {Object} Demande
 * @property {"seance" | "soiree"} genre
 * @property {string} evenement   Identifiant de la séance ou de la soirée.
 * @property {Panier} billets
 * @property {string} email
 */

/**
 * @typedef {Object} LigneBillet
 * @property {string} libelle
 * @property {number} nombre
 * @property {number} prix
 */

/**
 * @typedef {Object} Billet
 * @property {string} reference
 * @property {"seance" | "soiree"} genre
 * @property {string} evenement
 * @property {string} titre
 * @property {string} date
 * @property {string} heure
 * @property {LigneBillet[]} lignes
 * @property {number} montant
 */

/** @typedef {"payee" | "en-attente" | "echouee" | "expiree"} Statut */

/**
 * @typedef {Object} EtatBillet
 * @property {Statut} statut
 * @property {Billet} billet
 */

const PANNE = "La billetterie ne répond pas. Réessayez dans un instant.";
const STATUTS = ["payee", "en-attente", "echouee", "expiree"];

/** @returns {string} */
function adresseApi() {
  return `${document.body.dataset.racine ?? ""}api/`;
}

/**
 * Lit la réponse JSON du serveur ; une réponse « ok: false » devient une
 * erreur portant la phrase du serveur, déjà écrite pour le visiteur.
 * @param {Response} reponse
 * @returns {Promise<Record<string, unknown>>}
 */
async function lireReponse(reponse) {
  /** @type {unknown} */
  let corps = null;
  try {
    corps = await reponse.json();
  } catch {
    throw new Error(PANNE);
  }
  if (!corps || typeof corps !== "object") throw new Error(PANNE);
  const donnees = /** @type {Record<string, unknown>} */ (corps);
  if (donnees.ok !== true) {
    throw new Error(typeof donnees.message === "string" && donnees.message ? donnees.message : PANNE);
  }
  return donnees;
}

/**
 * La page de paiement ne peut être qu’une adresse HTTPS (HTTP seulement
 * pour les essais sur l’ordinateur, avec le faux SumUp local).
 * @param {unknown} page
 * @returns {string}
 */
function verifierPagePaiement(page) {
  if (typeof page !== "string") throw new Error(PANNE);
  const url = new URL(page);
  const essaiLocal = url.hostname === "127.0.0.1" && location.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !essaiLocal) throw new Error(PANNE);
  return url.toString();
}

/**
 * Demande au serveur une page de paiement pour ces billets.
 * @param {Demande} demande
 * @returns {Promise<string>} L’adresse de la page de paiement SumUp.
 */
export async function creerPaiement(demande) {
  let reponse;
  try {
    reponse = await fetch(`${adresseApi()}creer-paiement.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(demande),
    });
  } catch {
    throw new Error(PANNE);
  }
  const donnees = await lireReponse(reponse);
  return verifierPagePaiement(donnees.pagePaiement);
}

/**
 * @param {unknown} valeur
 * @returns {LigneBillet[]}
 */
function lireLignes(valeur) {
  if (!Array.isArray(valeur)) return [];
  return valeur.flatMap((l) =>
    l && typeof l.libelle === "string" && typeof l.nombre === "number" && typeof l.prix === "number"
      ? [{ libelle: l.libelle, nombre: l.nombre, prix: l.prix }]
      : []
  );
}

/**
 * Vérifie la forme du billet renvoyé par le serveur.
 * @param {Record<string, unknown>} donnees
 * @returns {EtatBillet}
 */
function lireEtat(donnees) {
  const b = /** @type {Record<string, unknown>} */ (donnees.billet ?? {});
  const statut = STATUTS.find((s) => s === donnees.statut);
  const genre = b.genre === "seance" || b.genre === "soiree" ? b.genre : null;
  if (!statut || !genre || typeof b.reference !== "string" || typeof b.titre !== "string") throw new Error(PANNE);
  return {
    statut: /** @type {Statut} */ (statut),
    billet: {
      reference: b.reference,
      genre,
      evenement: typeof b.evenement === "string" ? b.evenement : "",
      titre: b.titre,
      date: typeof b.date === "string" ? b.date : "",
      heure: typeof b.heure === "string" ? b.heure : "",
      lignes: lireLignes(b.lignes),
      montant: typeof b.montant === "number" ? b.montant : 0,
    },
  };
}

/**
 * Où en est cette commande ? Le serveur redemande à SumUp avant de répondre.
 * @param {string} reference
 * @returns {Promise<EtatBillet>}
 */
export async function lireBillet(reference) {
  let reponse;
  try {
    reponse = await fetch(`${adresseApi()}statut-paiement.php?ref=${encodeURIComponent(reference)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new Error(PANNE);
  }
  return lireEtat(await lireReponse(reponse));
}
