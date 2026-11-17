<?php
/* ============================================================
   Minimum : étape 2 de l'achat : le billet.

   Appelé par la page /billet/ quand SumUp y renvoie le visiteur,
   puis chaque fois qu'il rouvre son billet. Le serveur ne croit
   pas le navigateur : il redemande à SumUp où en est le paiement.
   Ouvrir /billet/?ref=… à la main ne fabrique donc aucun billet.

   La réponse ne contient jamais l'e-mail de l'acheteur : la
   référence suffit à afficher le billet, pas à savoir qui l'a pris.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_billetterie.php';
require_once __DIR__ . '/_sumup.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    echec('Requête invalide.', 405);
}
config();

$reference = strtoupper(trim((string) ($_GET['ref'] ?? '')));
if (!preg_match('/^MIN-[A-HJ-NP-Z2-9]{6}$/', $reference)) {
    echec('Référence de billet invalide.', 422);
}

$commande = sanityLire(
    '*[_type == "commande" && lieu == $lieu && reference == $r][0]{
       _id, reference, statut, genre, "evenement": evenement._ref, evenementTitre, evenementDate,
       evenementHeure, billets, montant, sumupCheckoutId
     }',
    ['r' => $reference, 'lieu' => LIEU]
);
if (!is_array($commande)) {
    echec('Billet introuvable.', 404);
}

$statut = (string) ($commande['statut'] ?? 'en-attente');
$aVerifier = 'Ce paiement demande une vérification. Minimum vous recontacte au plus vite.';

/* Tant que rien n'est tranché, on redemande à SumUp. Une fois payée
   ou échouée, la commande ne change plus : inutile de rappeler SumUp. */
if ($statut === 'en-attente' && !empty($commande['sumupCheckoutId'])) {
    $checkout = sumupLireCheckout((string) $commande['sumupCheckoutId']);
    $nouveau = sumupStatutVersCommande((string) ($checkout['status'] ?? ''));
    if ($nouveau !== $statut) {
        $champs = ['statut' => $nouveau];
        if ($nouveau === 'payee') {
            $champs['payeeLe'] = gmdate('Y-m-d\TH:i:s\Z');
            /* Le montant encaissé doit être celui qu'on a demandé. Sinon,
               pas de billet, et une trace bien visible dans le Studio. */
            $encaisse = round((float) ($checkout['amount'] ?? 0), 2);
            $attendu = round((float) ($commande['montant'] ?? 0), 2);
            if (abs($encaisse - $attendu) > 0.001) {
                sanityModifier((string) $commande['_id'], ['statut' => 'a-verifier']);
                echec($aVerifier, 409, "Montant divergent pour $reference : encaissé $encaisse, attendu $attendu");
            }
        }
        sanityModifier((string) $commande['_id'], $champs);
        $statut = $nouveau;
    }
}

if ($statut === 'a-verifier') {
    echec($aVerifier, 409);
}

$lignes = array_map(
    static fn (array $l): array => ['libelle' => (string) ($l['libelle'] ?? ''), 'nombre' => (int) ($l['nombre'] ?? 0), 'prix' => (float) ($l['prix'] ?? 0)],
    is_array($commande['billets'] ?? null) ? $commande['billets'] : []
);

reussite([
    /* Une commande annulée (jauge pleine) se lit comme un paiement non abouti. */
    'statut' => $statut === 'annulee' ? 'echouee' : $statut,
    'billet' => [
        'reference' => (string) $commande['reference'],
        'genre' => (string) ($commande['genre'] ?? 'seance'),
        'evenement' => (string) ($commande['evenement'] ?? ''),
        'titre' => (string) ($commande['evenementTitre'] ?? ''),
        'date' => (string) ($commande['evenementDate'] ?? ''),
        'heure' => (string) ($commande['evenementHeure'] ?? ''),
        'lignes' => $lignes,
        'montant' => (float) ($commande['montant'] ?? 0),
    ],
]);
