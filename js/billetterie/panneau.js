// @ts-check
/* Minimum : le panneau d’achat en marche. Compter les billets, vérifier
   l’adresse e-mail, puis emmener le visiteur payer chez SumUp (ou, en
   démonstration, passer directement au billet). */

import { BILLETTERIE, MAX_BILLETS } from "../config.js";
import { prix } from "../format.js";
import { naviguer } from "../navigation.js";
import { creerPaiement } from "./api.js";
import { changerNombre, montant, nombreDeBillets, panierEnTexte, panierVide, probleme } from "./modele.js";

/** @typedef {import("./panneau-html.js").OptionsPanneau} OptionsPanneau */
/** @typedef {import("./modele.js").Panier} Panier */
/** @typedef {import("./modele.js").Probleme} Probleme */

/**
 * @param {HTMLFormElement} form
 * @param {string} selecteur
 * @returns {HTMLElement | null}
 */
function trouver(form, selecteur) {
  const el = form.querySelector(selecteur);
  return el instanceof HTMLElement ? el : null;
}

/**
 * @param {HTMLFormElement} form
 * @param {Probleme} souci
 */
function montrerErreur(form, souci) {
  const zone = trouver(form, `[data-erreur="${souci.champ}"]`);
  if (zone) {
    zone.textContent = souci.message;
    zone.hidden = false;
  }
  const cible = souci.champ === "email" ? trouver(form, 'input[name="email"]') : trouver(form, '[data-pas="1"]');
  if (souci.champ === "email") cible?.setAttribute("aria-invalid", "true");
  cible?.focus();
}

/**
 * @param {HTMLFormElement} form
 * @param {"billets" | "email"} champ
 */
function effacerErreur(form, champ) {
  const zone = trouver(form, `[data-erreur="${champ}"]`);
  if (zone) zone.hidden = true;
  if (champ === "email") trouver(form, 'input[name="email"]')?.removeAttribute("aria-invalid");
}

/**
 * Remet chaque compteur, le total et le bouton en accord avec le panier.
 * @param {HTMLFormElement} form
 * @param {OptionsPanneau} options
 * @param {Panier} panier
 * @param {string | null} cleChangee
 */
function afficherPanier(form, options, panier, cleChangee) {
  const total = nombreDeBillets(panier);
  const somme = montant(panier, options.tarifs);
  for (const tarif of options.tarifs) {
    const n = panier[tarif.cle] ?? 0;
    const sortie = trouver(form, `[data-nombre="${tarif.cle}"]`);
    if (sortie) sortie.textContent = String(n);
    trouver(form, `[data-cle="${tarif.cle}"][data-pas="-1"]`)?.setAttribute("aria-disabled", String(n === 0));
    trouver(form, `[data-cle="${tarif.cle}"][data-pas="1"]`)?.setAttribute("aria-disabled", String(total >= MAX_BILLETS));
  }
  const montantEl = trouver(form, ".achat__montant");
  if (montantEl) montantEl.textContent = prix(somme);
  const payer = trouver(form, ".achat__payer");
  if (payer) payer.textContent = total > 0 ? `Payer ${prix(somme)}` : "Payer";
  const tarif = options.tarifs.find((t) => t.cle === cleChangee);
  const annonce = trouver(form, "[data-annonce]");
  if (annonce && tarif) {
    annonce.textContent = `${panier[tarif.cle] ?? 0} ${tarif.libelle}. Total ${prix(somme)}.`;
  }
}

/**
 * Caisse en démonstration : pas de paiement, on passe directement au billet.
 * @param {OptionsPanneau} options
 * @param {string} evenement
 * @param {Panier} panier
 */
function allerAuBilletSansPayer(options, evenement, panier) {
  const adresse = new URLSearchParams({ apercu: "1", genre: options.genre, id: evenement, b: panierEnTexte(panier) });
  naviguer(`${document.body.dataset.racine ?? ""}billet/?${adresse.toString()}`);
}

/**
 * Branche le panneau dessiné par panneauHTML. Tout se débranche avec le signal.
 * @param {HTMLElement} zone
 * @param {OptionsPanneau} options
 * @param {AbortSignal} signal
 */
export function monterPanneau(zone, options, signal) {
  const form = zone.querySelector("form.achat");
  if (!(form instanceof HTMLFormElement)) return;
  let panier = panierVide(options.tarifs);
  let envoiEnCours = false;

  form.addEventListener("click", (e) => {
    const bouton = e.target instanceof Element ? e.target.closest("[data-pas]") : null;
    if (!(bouton instanceof HTMLElement) || bouton.getAttribute("aria-disabled") === "true") return;
    const cle = bouton.dataset.cle ?? "";
    panier = changerNombre(panier, cle, bouton.dataset.pas === "1" ? 1 : -1);
    effacerErreur(form, "billets");
    afficherPanier(form, options, panier, cle);
  }, { signal });

  form.addEventListener("input", (e) => {
    if (e.target instanceof HTMLInputElement && e.target.name === "email") effacerErreur(form, "email");
  }, { signal });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (envoiEnCours) return;
    const donnees = new FormData(form);
    const email = String(donnees.get("email") ?? "").trim();
    const evenement = String(donnees.get("evenement") ?? "");
    const souci = probleme(panier, email);
    if (souci) return montrerErreur(form, souci);
    if (BILLETTERIE === "demonstration") return allerAuBilletSansPayer(options, evenement, panier);
    envoiEnCours = true;
    /* Une fois parti chez SumUp, le panneau reste bloqué : pas de second paiement. */
    void payer(form, { genre: options.genre, evenement, billets: panier, email }).then((parti) => {
      envoiEnCours = parti;
    });
  }, { signal });

  afficherPanier(form, options, panier, null);
}

/**
 * Demande la page de paiement et y emmène le visiteur.
 * @param {HTMLFormElement} form
 * @param {import("./api.js").Demande} demande
 * @returns {Promise<boolean>} Vrai si le visiteur part vers la page de paiement.
 */
async function payer(form, demande) {
  const bouton = trouver(form, ".achat__payer");
  const retour = trouver(form, ".achat__retour");
  const libelle = bouton?.textContent ?? "Payer";
  if (bouton) bouton.textContent = "Ouverture du paiement…";
  form.setAttribute("aria-busy", "true");
  if (retour) retour.textContent = "";
  try {
    location.assign(await creerPaiement(demande));
    return true;
  } catch (erreur) {
    if (retour) retour.textContent = erreur instanceof Error ? erreur.message : String(erreur);
    if (bouton) bouton.textContent = libelle;
    form.removeAttribute("aria-busy");
    return false;
  }
}
