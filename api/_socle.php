<?php
/* ============================================================
   Minimum : socle commun à tous les points d'entrée de l'API.
   Repris de la billetterie de Zinéma (même logique, mêmes
   garde-fous), adapté aux séances et aux soirées de Minimum.

   Règle absolue de ce dossier : aucune clé, aucun message
   d'erreur technique ne sort vers le navigateur. Les détails
   partent dans le journal du serveur ; le visiteur ne reçoit
   qu'une phrase compréhensible.
   ============================================================ */

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);
/* « Aujourd'hui » se compte à Neuchâtel, pas à Greenwich. */
date_default_timezone_set('Europe/Zurich');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

/* ---------------- Répondre ---------------- */

function reussite(array $donnees): never
{
    echo json_encode(['ok' => true] + $donnees, JSON_UNESCAPED_UNICODE);
    exit;
}

/* $interne n'est JAMAIS envoyé au visiteur : il part dans le journal. */
function echec(string $message, int $code = 400, string $interne = ''): never
{
    if ($interne !== '') {
        error_log('[minimum-billetterie] ' . $interne);
    }
    http_response_code($code);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

set_exception_handler(static function (Throwable $e): void {
    echec(
        'La billetterie est momentanément indisponible. Réessayez dans un instant.',
        500,
        $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine()
    );
});

/* ---------------- Configuration secrète ---------------- */

/* Le fichier config.php vit HORS du dossier public (voir
   serveur/config.exemple.php). On remonte jusqu'à quatre niveaux
   au-dessus de /api et on écarte toute piste située dans le dossier
   public : y déposer les clés reviendrait à les publier. */
function config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $racinePublique = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
    $pistes = [];
    for ($niveau = 1; $niveau <= 4; $niveau++) {
        $pistes[] = dirname(__DIR__, $niveau) . '/config.php';
    }
    foreach ($pistes as $piste) {
        $reel = is_readable($piste) ? realpath($piste) : false;
        if ($reel === false) {
            continue;
        }
        if ($racinePublique !== false && str_starts_with($reel, $racinePublique . DIRECTORY_SEPARATOR)) {
            error_log('[minimum-billetterie] config.php ignoré : il est dans le dossier public (' . $reel . ')');
            continue;
        }
        $config = require $reel;
        break;
    }
    if (!is_array($config)) {
        echec('La billetterie n’est pas encore configurée.', 503, 'config.php introuvable : ' . implode(' | ', $pistes));
    }
    foreach (['sumup.cle_api', 'sumup.code_marchand', 'sanity.projet', 'sanity.dataset', 'sanity.jeton_ecriture', 'site.url'] as $chemin) {
        [$a, $b] = explode('.', $chemin);
        if (empty($config[$a][$b])) {
            echec('La billetterie n’est pas encore configurée.', 503, "config.php : valeur manquante « $chemin »");
        }
    }
    return $config;
}

/* Adresse d'un service extérieur. Pour les essais sur l'ordinateur,
   config.php peut la remplacer par un faux service local, et
   seulement local : une adresse qui ne commence pas par
   http://127.0.0.1: est ignorée, on ne détourne pas les paiements. */
function adresseService(string $service, string $parDefaut): string
{
    $essai = (string) (config()['essais'][$service] ?? '');
    return str_starts_with($essai, 'http://127.0.0.1:') ? rtrim($essai, '/') : $parDefaut;
}

/* ---------------- Lire la demande ---------------- */

function corpsJson(string $methodeAttendue = 'POST'): array
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $methodeAttendue) {
        echec('Requête invalide.', 405);
    }
    /* Une commande tient en quelques centaines d'octets. */
    $brut = file_get_contents('php://input', false, null, 0, 8192) ?: '';
    $donnees = json_decode($brut, true);
    return is_array($donnees) ? $donnees : [];
}

/* ---------------- Appels HTTP sortants ---------------- */

function appelHttp(string $methode, string $url, array $entetes = [], ?array $corps = null): array
{
    $curl = curl_init($url);
    $tousEntetes = array_merge(['Accept: application/json'], $entetes);
    if ($corps !== null) {
        $tousEntetes[] = 'Content-Type: application/json';
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($corps, JSON_UNESCAPED_UNICODE));
    }
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $methode,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => $tousEntetes,
    ]);
    $reponse = curl_exec($curl);
    $statut = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $erreur = curl_error($curl);
    if ($reponse === false) {
        throw new RuntimeException("Appel $methode $url impossible : $erreur");
    }
    return [
        'statut' => $statut,
        'corps' => json_decode((string) $reponse, true) ?: [],
        'brut' => (string) $reponse,
    ];
}
