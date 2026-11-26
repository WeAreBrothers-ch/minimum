<?php
/* ============================================================
   Minimum : clés secrètes de la billetterie.

   ATTENTION : CE FICHIER NE DOIT JAMAIS ÊTRE ACCESSIBLE DEPUIS INTERNET.
   Sur Infomaniak, le site public est le dossier « web/ ». Ce
   fichier se dépose À CÔTÉ de « web/ », jamais dedans :

       /home/clients/xxxx/sites/cineminimum.ch/
       ├── config.php      ←  ce fichier, renommé (secret)
       └── web/            ←  le site public
           ├── index.html
           ├── api/
           └── …

   Marche à suivre :
     1. copier ce fichier en « config.php » au bon endroit ;
     2. remplir les valeurs ci-dessous ;
     3. ne JAMAIS le mettre sur GitHub ni dans le dossier web/.

   Si une clé fuite, quelqu'un peut encaisser ou rembourser à la
   place de Minimum : la régénérer depuis SumUp ou Sanity.
   ============================================================ */

return [
    /* SumUp : compte AU NOM DE MINIMUM (pas celui de Zinéma).
       Clé sur https://developer.sumup.com → API keys (« sup_sk_… »),
       code marchand dans SumUp → Profil → Paramètres (« MXXXXXXX »). */
    'sumup' => [
        'cle_api' => 'sup_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        'code_marchand' => 'MXXXXXXX',
    ],

    /* Sanity : le projet de Minimum (indépendant de celui de Zinéma).
       Un jeton réservé à la caisse (sanity.io → projet minimum → API →
       Tokens, droits « Editor »), pour pouvoir le retirer sans rien
       couper d'autre. */
    'sanity' => [
        'projet' => 'hvxsup1j',
        'dataset' => 'production',
        'jeton_ecriture' => 'skXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    ],

    /* Adresse publique du site, SANS barre finale : SumUp y renvoie
       le visiteur après le paiement (page /billet/). */
    'site' => [
        'url' => 'https://www.cineminimum.ch',
    ],

    /* Essais sur l'ordinateur seulement : faux Sanity et faux SumUp
       locaux. Ignoré pour toute adresse autre que http://127.0.0.1:…
       À NE PAS remplir sur le serveur en ligne.
    'essais' => [
        'sanity' => 'http://127.0.0.1:8200/sanity',
        'sumup' => 'http://127.0.0.1:8200/sumup',
    ],
    */
];
