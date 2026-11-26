<?php
/* ============================================================
   Minimum : étape 1 de l'achat : créer le paiement.

   Reçoit : le genre (séance ou soirée), l'événement, le nombre
   de billets par tarif et l'e-mail. Vérifie tout, calcule le
   montant, enregistre la commande, demande à SumUp une page de
   paiement et en renvoie l'adresse. Le navigateur n'a jamais vu
   la clé SumUp, ni eu son mot à dire sur le prix.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_billetterie.php';
require_once __DIR__ . '/_sumup.php';

$corps = corpsJson('POST');
/* Caisse non configurée : on le dit tout de suite, avant toute autre vérification. */
config();

/* ---------------- Ce que demande le visiteur ---------------- */

$genre = genreDemande($corps);
$id = idDemande($corps);
$demandes = billetsDemandes($corps);
$email = emailValide($corps);
limiterDebit();

/* ---------------- Ce que dit Sanity ---------------- */

$ev = chargerEvenement($genre, $id);
$lignes = lignesCommande($demandes, $ev['tarifs']);
$nombre = array_sum(array_column($lignes, 'nombre'));

if ($ev['restantes'] < $nombre) {
    echec(
        $ev['restantes'] === 0
            ? 'Complet : il ne reste plus de place en ligne.'
            : ($ev['restantes'] === 1 ? 'Il ne reste qu’une place en ligne.' : 'Il ne reste que ' . $ev['restantes'] . ' places en ligne.'),
        409
    );
}

$montant = round(array_sum(array_map(static fn (array $l): float => $l['nombre'] * $l['prix'], $lignes)), 2);

/* ---------------- Enregistrer, vérifier, encaisser ---------------- */

$reference = nouvelleReference();

/* La commande est écrite AVANT le paiement : si SumUp ou le réseau
   flanche, il reste une trace. Non payée, elle rend ses places au
   bout de MINUTES_RESERVATION.

   Son identifiant commence par « prive. » : le projet Sanity est
   public (le site le lit sans clé), et un document rangé sous un
   chemin ne se lit qu'avec une clé, comme les brouillons. Sans ce
   préfixe, l'e-mail de l'acheteur serait lisible par n'importe qui. */
$idCommande = sanityCreer([
    '_id' => 'prive.minimum-commande-' . bin2hex(random_bytes(10)),
    '_type' => 'commande',
    'reference' => $reference,
    'statut' => 'en-attente',
    'genre' => $genre,
    'evenement' => ['_type' => 'reference', '_ref' => $ev['id']],
    'evenementTitre' => $ev['titre'],
    'evenementDate' => $ev['date'],
    'evenementHeure' => $ev['heure'],
    'billets' => $lignes,
    'nombreBillets' => $nombre,
    'montant' => $montant,
    'email' => $email,
    'creeLe' => gmdate('Y-m-d\TH:i:s\Z'),
]);

/* Deux visiteurs peuvent viser la dernière place à la même seconde.
   On recompte avec la commande enregistrée : si la jauge déborde, on
   annule la nôtre avant d'avoir encaissé quoi que ce soit. */
if (billetsPris($ev['id']) > $ev['places']) {
    sanityModifier($idCommande, ['statut' => 'annulee']);
    echec('Les dernières places viennent de partir. Rien n’a été encaissé.', 409);
}

$description = $nombre . ' billet' . ($nombre > 1 ? 's' : '') . ' Minimum, ' . $ev['titre'] . ', ' . libelleEvenement($ev);
$urlRetour = rtrim((string) config()['site']['url'], '/') . '/billet/?ref=' . rawurlencode($reference);
$checkout = sumupCreerCheckout($reference, $montant, $description, $urlRetour);
sanityModifier($idCommande, ['sumupCheckoutId' => $checkout['id']]);

reussite([
    'reference' => $reference,
    'montant' => $montant,
    'pagePaiement' => $checkout['page'],
]);
