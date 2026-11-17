<?php
/* ============================================================
   Minimum : lecture et écriture dans Sanity depuis le serveur.
   Le projet est partagé avec Zinéma : toute lecture de séance,
   de soirée ou de commande filtre sur lieu == "minimum".
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_socle.php';

const SANITY_VERSION_API = '2024-01-01';
const LIEU = 'minimum';

function sanityBase(string $usage): string
{
    $c = config()['sanity'];
    $racine = adresseService('sanity', "https://{$c['projet']}.api.sanity.io");
    return $racine . '/v' . SANITY_VERSION_API . "/data/$usage/{$c['dataset']}";
}

/* Les paramètres voyagent à part de la requête : rien de ce que tape
   un visiteur ne peut modifier la requête elle-même. */
function sanityLire(string $groq, array $parametres = []): mixed
{
    $url = sanityBase('query') . '?perspective=published&query=' . rawurlencode($groq);
    foreach ($parametres as $nom => $valeur) {
        $url .= '&$' . rawurlencode($nom) . '=' . rawurlencode(json_encode($valeur, JSON_UNESCAPED_UNICODE));
    }
    $r = appelHttp('GET', $url, ['Authorization: Bearer ' . config()['sanity']['jeton_ecriture']]);
    if ($r['statut'] !== 200) {
        throw new RuntimeException('Sanity lecture ' . $r['statut'] . ' : ' . $r['brut']);
    }
    return $r['corps']['result'] ?? null;
}

function sanityMuter(array $mutations): array
{
    $r = appelHttp(
        'POST',
        sanityBase('mutate') . '?returnIds=true&visibility=sync',
        ['Authorization: Bearer ' . config()['sanity']['jeton_ecriture']],
        ['mutations' => $mutations]
    );
    if ($r['statut'] < 200 || $r['statut'] >= 300) {
        throw new RuntimeException('Sanity écriture ' . $r['statut'] . ' : ' . $r['brut']);
    }
    return $r['corps'];
}

function sanityCreer(array $document): string
{
    $id = (string) (sanityMuter([['create' => $document]])['results'][0]['id'] ?? '');
    if ($id === '') {
        throw new RuntimeException('Sanity : document créé sans identifiant.');
    }
    return $id;
}

function sanityModifier(string $id, array $champs): void
{
    sanityMuter([['patch' => ['id' => $id, 'set' => $champs]]]);
}
