<?php
/* ============================================================
   Minimum : dialogue avec SumUp (Hosted Checkout).

     1. le serveur crée un « checkout » (une intention de paiement) ;
     2. SumUp renvoie l'adresse d'une page de paiement sécurisée ;
     3. le visiteur y saisit sa carte, chez SumUp, jamais ici ;
     4. SumUp le renvoie sur /billet/, et le serveur REDEMANDE à
        SumUp si c'est payé. On ne croit jamais le navigateur.

   Référence : https://developer.sumup.com, POST /v0.1/checkouts
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_socle.php';

function sumupBase(): string
{
    return adresseService('sumup', 'https://api.sumup.com') . '/v0.1';
}

function sumupEntetes(): array
{
    return ['Authorization: Bearer ' . config()['sumup']['cle_api']];
}

/* Crée le paiement ; renvoie son identifiant et la page de paiement. */
function sumupCreerCheckout(string $reference, float $montant, string $description, string $urlRetour): array
{
    $r = appelHttp('POST', sumupBase() . '/checkouts', sumupEntetes(), [
        'checkout_reference' => $reference,
        'amount' => round($montant, 2),
        'currency' => 'CHF',
        'merchant_code' => config()['sumup']['code_marchand'],
        'description' => $description,
        'hosted_checkout' => ['enabled' => true],
        'redirect_url' => $urlRetour,
    ]);
    if ($r['statut'] < 200 || $r['statut'] >= 300) {
        throw new RuntimeException('SumUp création ' . $r['statut'] . ' : ' . $r['brut']);
    }
    $id = (string) ($r['corps']['id'] ?? '');
    $page = (string) ($r['corps']['hosted_checkout_url'] ?? '');
    if ($id === '' || $page === '') {
        throw new RuntimeException('SumUp : réponse sans id ou sans page de paiement : ' . $r['brut']);
    }
    return ['id' => $id, 'page' => $page];
}

/* Où en est ce paiement ? Statuts : PENDING, PAID, FAILED, EXPIRED. */
function sumupLireCheckout(string $id): array
{
    $r = appelHttp('GET', sumupBase() . '/checkouts/' . rawurlencode($id), sumupEntetes());
    if ($r['statut'] !== 200) {
        throw new RuntimeException('SumUp lecture ' . $r['statut'] . ' : ' . $r['brut']);
    }
    return $r['corps'];
}

function sumupStatutVersCommande(string $statutSumUp): string
{
    return match (strtoupper($statutSumUp)) {
        'PAID' => 'payee',
        'FAILED' => 'echouee',
        'EXPIRED' => 'expiree',
        default => 'en-attente',
    };
}
