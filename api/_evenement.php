<?php
/* ============================================================
   Minimum : ce qu'on vend : une séance de cinéma ou une soirée.

   Tout ce qui décide d'une vente est lu ICI, dans Sanity : la
   date, l'état de la vente, les tarifs, le nombre de places et
   les billets déjà pris. Rien ne vient de la page.

   Ce que le serveur attend de Sanity (à créer dans le Studio
   commun, voir BILLETTERIE.md) :
     - screening : le champ « lieu » (« minimum » ou « zinema ») ;
     - soiree    : lieu, title, date, ouverture, status, tarifs,
                   capacite ;
     - reglagesMinimum (document unique) : tarifsCinema,
                   placesCinema, placesClub ;
     - commande  : les champs écrits par creer-paiement.php.
   ============================================================ */

declare(strict_types=1);

require_once __DIR__ . '/_sanity.php';

/* Une commande non payée retient ses places pendant ce délai. */
const MINUTES_RESERVATION = 30;

const GENRES = [
    'seance' => '*[_type == "screening" && _id == $id && lieu == $lieu][0]{
        _id, date, "heure": time, status, "titre": film->title}',
    'soiree' => '*[_type == "soiree" && _id == $id && lieu == $lieu][0]{
        _id, date, "heure": ouverture, status, "titre": title,
        "tarifs": tarifs[]{cle, libelle, prix}, "places": capacite}',
];

/* Les billets qui comptent encore : payés, ou en attente récente. */
function requetePrises(): string
{
    return '*[_type == "commande" && lieu == $lieu && evenement._ref == $id
        && (statut == "payee" || (statut == "en-attente" && creeLe > $limite))].nombreBillets';
}

function parametresPrises(string $id): array
{
    return ['id' => $id, 'lieu' => LIEU, 'limite' => gmdate('Y-m-d\TH:i:s\Z', time() - MINUTES_RESERVATION * 60)];
}

/* Garde les tarifs complets : clé, libellé, prix positif. Clé : la clé du tarif. */
function tarifsValides(mixed $liste): array
{
    $tarifs = [];
    foreach (is_array($liste) ? $liste : [] as $t) {
        $cle = (string) ($t['cle'] ?? '');
        $prix = (float) ($t['prix'] ?? 0);
        if (preg_match('/^[a-z0-9-]{1,40}$/', $cle) && $prix > 0 && !empty($t['libelle'])) {
            $tarifs[$cle] = ['libelle' => (string) $t['libelle'], 'prix' => round($prix, 2)];
        }
    }
    return $tarifs;
}

/* Le nombre de billets déjà pris pour cet événement. */
function billetsPris(string $id): int
{
    $prises = sanityLire(requetePrises(), parametresPrises($id));
    return array_sum(array_map('intval', is_array($prises) ? $prises : []));
}

/* Charge l'événement en une requête et refuse tout ce qui ne se vend pas. */
function chargerEvenement(string $genre, string $id): array
{
    $d = sanityLire(
        '{"evenement": ' . GENRES[$genre] . ',
          "reglages": *[_id == "reglagesMinimum"][0]{"tarifs": tarifsCinema[]{cle, libelle, prix}, placesCinema, placesClub},
          "prises": ' . requetePrises() . '}',
        parametresPrises($id)
    );
    $ev = $d['evenement'] ?? null;
    if (!is_array($ev)) {
        echec('Cet événement n’existe pas, ou n’est plus au programme.', 404);
    }
    if (($ev['status'] ?? '') !== 'disponible') {
        echec('Les billets de cet événement ne sont plus en vente en ligne.', 409);
    }
    if ((string) ($ev['date'] ?? '') < date('Y-m-d')) {
        echec('Cet événement est passé.', 409);
    }
    /* Une soirée se vend encore après l'ouverture des portes ; une séance,
       plus une fois le film commencé. */
    $debut = strtotime((string) $ev['date'] . ' ' . (string) ($ev['heure'] ?? ''));
    if ($genre === 'seance' && $debut !== false && $debut <= time()) {
        echec('Cette séance a déjà commencé.', 409);
    }
    $reglages = is_array($d['reglages'] ?? null) ? $d['reglages'] : [];
    $tarifs = tarifsValides($genre === 'seance' ? ($reglages['tarifs'] ?? []) : ($ev['tarifs'] ?? []));
    $places = (int) ($genre === 'seance' ? ($reglages['placesCinema'] ?? 0) : ($ev['places'] ?? $reglages['placesClub'] ?? 0));
    /* Sans tarif ni jauge, on ne vend pas : mieux vaut une caisse
       fermée qu'une salle vendue deux fois. */
    if ($tarifs === [] || $places <= 0) {
        echec('La vente en ligne n’est pas ouverte pour cet événement.', 503, "Tarifs ou jauge manquants : $genre $id");
    }
    $prises = array_sum(array_map('intval', is_array($d['prises'] ?? null) ? $d['prises'] : []));
    return [
        'id' => (string) $ev['_id'],
        'genre' => $genre,
        'titre' => (string) ($ev['titre'] ?? ($genre === 'seance' ? 'Séance' : 'Soirée')),
        'date' => (string) ($ev['date'] ?? ''),
        'heure' => (string) ($ev['heure'] ?? ''),
        'tarifs' => $tarifs,
        'places' => $places,
        'restantes' => max(0, $places - $prises),
    ];
}
