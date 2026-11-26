// @ts-check
/* Minimum : la page du billet. SumUp y renvoie le visiteur après le
   paiement ; le serveur redemande à SumUp si c’est bien payé avant de
   montrer quoi que ce soit. Adresse : billet/?ref=MIN-XXXXXX
   En démonstration, billet/?apercu=1&… montre le billet sans paiement.
   Sa référence, MIN-000000, sort de l’alphabet des vraies (jamais de 0) :
   elle ne peut pas passer pour un billet payé à l’entrée. */

import { lireBillet } from "../billetterie/api.js";
import { panierDepuisTexte } from "../billetterie/modele.js";
import { ADRESSE_BILLET, BILLETTERIE } from "../config.js";
import { chargerProgramme, filmParId, soireeParId } from "../donnees.js";
import { echapper, heureCourte, jourLongMajuscule, prix } from "../format.js";
import { afficherErreur, nommerPage, zoneAremplir } from "./commun.js";

/** @typedef {import("../billetterie/api.js").Billet} Billet */
/** @typedef {import("../billetterie/api.js").EtatBillet} EtatBillet */
/** @typedef {import("../types.js").Programme} Programme */

const FORME_REFERENCE = /^MIN-[A-HJ-NP-Z2-9]{6}$/;
const ESSAIS = 5;
const ATTENTE_ENTRE_ESSAIS = 3000;

/**
 * @param {Billet} billet
 * @returns {string}
 */
function billetHTML(billet) {
  /** Chaque valeur, déjà échappée. @type {Array<[string, string]>} */
  const lignes = [
    [billet.genre === "seance" ? "Film" : "Soirée", echapper(billet.titre)],
    ["Quand", billet.date ? echapper(`${jourLongMajuscule(billet.date)}, ${heureCourte(billet.heure)}`) : ""],
    ["Où", echapper(ADRESSE_BILLET)],
    ["Billets", echapper(billet.lignes.map((l) => `${l.nombre} ${l.libelle}`).join(", "))],
    ["Payé", `<span class="pastille pastille--argent">${prix(billet.montant)}</span>`],
  ];
  return (
    `<article class="billet">` +
    `<h1 class="page__titre">Votre billet</h1><p class="billet__reference">${echapper(billet.reference)}</p>` +
    `<span class="tirets" aria-hidden="true"></span><dl class="fiche__reperes billet__reperes">${lignes
      .filter(([, v]) => v)
      .map(([t, v]) => `<div><dt>${echapper(t)}</dt><dd>${v}</dd></div>`)
      .join("")}</dl>` +
    `<p class="billet__consigne">Montrez cette référence à l’entrée, sur votre téléphone ou imprimée. Gardez cette page.</p>` +
    `<p><button class="billet__imprimer" type="button">Imprimer le billet</button></p></article>`
  );
}

/**
 * @param {string} titre
 * @param {string} texte
 * @param {string} [action]  HTML d’un lien ou d’un bouton.
 * @returns {string}
 */
function messageHTML(titre, texte, action = "") {
  return `<h1 class="page__titre">${echapper(titre)}</h1><p class="page__intro">${echapper(texte)}</p>${action}`;
}

/**
 * Le billet d’aperçu, reconstruit à partir de l’adresse.
 * @param {Programme} programme
 * @param {URLSearchParams} params
 * @returns {Billet | null}
 */
function billetApercu(programme, params) {
  const id = params.get("id") ?? "";
  const seance = params.get("genre") === "seance" ? programme.seances.find((s) => s.id === id) : undefined;
  const soiree = params.get("genre") === "soiree" ? soireeParId(programme, id) : undefined;
  const titre = seance ? filmParId(programme, seance.filmId)?.titre : soiree?.titre;
  const tarifs = seance ? programme.tarifsCinema : (soiree?.tarifs ?? []);
  const quand = seance ?? soiree;
  if (!titre || !quand) return null;
  const panier = panierDepuisTexte(params.get("b") ?? "", tarifs);
  const lignes = tarifs.filter((t) => (panier[t.cle] ?? 0) > 0).map((t) => ({ libelle: t.libelle, nombre: panier[t.cle] ?? 0, prix: t.prix }));
  return {
    reference: "MIN-000000", genre: seance ? "seance" : "soiree", evenement: id, titre,
    date: quand.date, heure: quand.heure, lignes, montant: lignes.reduce((s, l) => s + l.nombre * l.prix, 0),
  };
}

/**
 * Affiche l’état d’une vraie commande, en redemandant tant que SumUp n’a pas tranché.
 * @param {HTMLElement} zone
 * @param {string} reference
 * @param {AbortSignal} signal
 * @param {number} essai
 */
async function suivreCommande(zone, reference, signal, essai) {
  const racine = document.body.dataset.racine ?? "";
  let etat;
  try {
    etat = await lireBillet(reference);
  } catch (erreur) {
    if (signal.aborted) return;
    zone.innerHTML = messageHTML("Billet indisponible", erreur instanceof Error ? erreur.message : String(erreur));
    return;
  }
  if (signal.aborted) return;
  if (etat.statut === "payee") {
    zone.innerHTML = billetHTML(etat.billet);
    return;
  }
  if (etat.statut === "en-attente") {
    const encore = essai < ESSAIS;
    zone.innerHTML = messageHTML(
      "Paiement en vérification",
      encore ? "SumUp confirme le paiement. Cela prend quelques secondes." : "SumUp n’a pas encore confirmé le paiement.",
      encore ? "" : `<p><button class="billet__verifier" type="button">Vérifier à nouveau</button></p>`
    );
    if (encore) setTimeout(() => void suivreCommande(zone, reference, signal, essai + 1), ATTENTE_ENTRE_ESSAIS);
    return;
  }
  const rubrique = etat.billet.genre === "seance" ? "cinema/" : "musique/";
  zone.innerHTML = messageHTML(
    "Paiement non abouti",
    "Rien n’a été débité. Vous pouvez reprendre votre achat.",
    `<p class="page__intro"><a href="${racine}${rubrique}">Reprendre l’achat</a></p>`
  );
}

/**
 * @param {HTMLElement} zone
 * @param {AbortSignal} signal
 */
function brancherBoutons(zone, signal) {
  zone.addEventListener("click", (e) => {
    const cible = e.target instanceof Element ? e.target : null;
    if (cible?.closest(".billet__imprimer")) window.print();
    if (cible?.closest(".billet__verifier")) {
      const reference = new URLSearchParams(location.search).get("ref") ?? "";
      void suivreCommande(zone, reference.toUpperCase(), signal, 1);
    }
  }, { signal });
}

/**
 * Remplit la page du billet.
 * @returns {() => void} Débranche la page.
 */
export function initBillet() {
  const fin = new AbortController();
  const zone = zoneAremplir();
  if (!zone) return () => fin.abort();
  const params = new URLSearchParams(location.search);
  const reference = (params.get("ref") ?? "").trim().toUpperCase();
  nommerPage("Votre billet, Minimum Neuchâtel", "Votre billet pour le cinéma ou le club Minimum, à Neuchâtel.");
  brancherBoutons(zone, fin.signal);
  if (params.has("apercu") && BILLETTERIE === "demonstration") {
    chargerProgramme()
      .then((programme) => {
        if (fin.signal.aborted) return;
        const billet = billetApercu(programme, params);
        zone.innerHTML = billet ? billetHTML(billet) : messageHTML("Billet introuvable", "Ce billet ne correspond à aucun événement.");
      })
      .catch((/** @type {unknown} */ erreur) => afficherErreur(zone, erreur));
  } else if (FORME_REFERENCE.test(reference)) {
    zone.innerHTML = messageHTML("Votre billet", "Vérification du paiement…");
    void suivreCommande(zone, reference, fin.signal, 1);
  } else {
    zone.innerHTML = messageHTML("Billet introuvable", "Cette adresse ne contient pas de référence de billet valable.");
  }
  return () => fin.abort();
}
