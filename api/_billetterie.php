<?php
/* ============================================================
   Minimum : les règles de la billetterie.

   Le navigateur dit seulement « tant de billets à tel tarif pour
   tel événement ». Il ne dit jamais combien ça coûte : le prix
   vient de Sanity, le montant est calculé ici.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_evenement.php';

const MAX_BILLETS_PAR_COMMANDE = 10;
/* Contre les paniers fantômes qui bloqueraient une salle entière :
   au plus tant de commandes par adresse IP et par fenêtre. */
const COMMANDES_PAR_FENETRE = 20;
const FENETRE_SECONDES = 600;
const ALPHABET_REFERENCE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genreDemande(array $corps): string
{
    $genre = (string) ($corps['genre'] ?? '');
    if (!array_key_exists($genre, GENRES)) {
        echec('Événement inconnu.', 422);
    }
    return $genre;
}

/* Un identifiant Sanity publié : lettres, chiffres, point, tiret. Jamais un brouillon. */
function idDemande(array $corps): string
{
    $id = (string) ($corps['evenement'] ?? '');
    if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/', $id) || str_starts_with($id, 'drafts.')) {
        echec('Événement manquant.', 422);
    }
    return $id;
}

/* Les nombres demandés, vérifiés AVANT de déranger Sanity. */
function billetsDemandes(array $corps): array
{
    $billets = $corps['billets'] ?? null;
    if (!is_array($billets) || $billets === [] || array_is_list($billets)) {
        echec('Choisissez au moins un billet.', 422);
    }
    $demandes = [];
    foreach ($billets as $cle => $nombre) {
        if (!is_int($nombre) || $nombre < 0 || $nombre > MAX_BILLETS_PAR_COMMANDE) {
            echec('Nombre de billets invalide.', 422);
        }
        if ($nombre > 0) {
            $demandes[(string) $cle] = $nombre;
        }
    }
    $total = array_sum($demandes);
    if ($total < 1) {
        echec('Choisissez au moins un billet.', 422);
    }
    if ($total > MAX_BILLETS_PAR_COMMANDE) {
        echec('Au-delà de ' . MAX_BILLETS_PAR_COMMANDE . ' billets, écrivez-nous : cineminimum@gmail.com.', 422);
    }
    return $demandes;
}

/* Les lignes de la commande, au prix de Sanity. Un tarif inconnu est refusé. */
function lignesCommande(array $demandes, array $tarifs): array
{
    $lignes = [];
    foreach ($demandes as $cle => $nombre) {
        if (!isset($tarifs[$cle])) {
            echec('Ce tarif n’existe pas pour cet événement.', 422);
        }
        $lignes[] = ['_key' => $cle, 'cle' => $cle, 'libelle' => $tarifs[$cle]['libelle'], 'prix' => $tarifs[$cle]['prix'], 'nombre' => $nombre];
    }
    return $lignes;
}

function emailValide(array $corps): string
{
    $email = trim((string) ($corps['email'] ?? ''));
    if ($email === '' || strlen($email) > 160 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echec('Indiquez une adresse e-mail complète, par exemple nom@exemple.ch.', 422);
    }
    return $email;
}

/* Au plus COMMANDES_PAR_FENETRE commandes par IP. Le fichier ne garde
   qu'une empreinte de l'adresse, jamais l'adresse elle-même. */
function limiterDebit(): void
{
    $dossier = sys_get_temp_dir() . '/minimum-billetterie-debit';
    if (!is_dir($dossier) && !mkdir($dossier, 0700, true) && !is_dir($dossier)) {
        throw new RuntimeException("Dossier du limiteur impossible à créer : $dossier");
    }
    $fichier = $dossier . '/' . hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? '')) . '.json';
    $flux = fopen($fichier, 'c+');
    if ($flux === false || !flock($flux, LOCK_EX)) {
        throw new RuntimeException("Limiteur illisible : $fichier");
    }
    $maintenant = time();
    $passages = json_decode((string) stream_get_contents($flux), true);
    $recents = array_values(array_filter(is_array($passages) ? $passages : [], static fn ($t) => is_int($t) && $t > $maintenant - FENETRE_SECONDES));
    $trop = count($recents) >= COMMANDES_PAR_FENETRE;
    if (!$trop) {
        $recents[] = $maintenant;
        ftruncate($flux, 0);
        rewind($flux);
        fwrite($flux, json_encode($recents));
    }
    flock($flux, LOCK_UN);
    fclose($flux);
    if ($trop) {
        echec('Trop de commandes en peu de temps. Réessayez dans quelques minutes.', 429);
    }
}

/* Un code court, lisible à voix haute : ni O ni 0, ni I ni 1. */
function nouvelleReference(): string
{
    for ($essai = 0; $essai < 5; $essai++) {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= ALPHABET_REFERENCE[random_int(0, strlen(ALPHABET_REFERENCE) - 1)];
        }
        $reference = 'MIN-' . $code;
        if ((int) sanityLire('count(*[_type == "commande" && reference == $r])', ['r' => $reference]) === 0) {
            return $reference;
        }
    }
    throw new RuntimeException('Aucune référence libre après 5 essais.');
}

/* « jeudi 12 novembre à 19:00 », pour la description du paiement. */
function libelleEvenement(array $ev): string
{
    $jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    $mois = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    $t = strtotime($ev['date'] . ' 12:00:00');
    if ($t === false) {
        return $ev['heure'];
    }
    return $jours[(int) date('w', $t)] . ' ' . (int) date('j', $t) . ' ' . $mois[(int) date('n', $t)] . ' à ' . $ev['heure'];
}
