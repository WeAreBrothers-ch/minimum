# Billetterie en ligne de Minimum

La caisse vend les billets des séances de cinéma et des soirées. Elle reprend
celle de Zinéma (SumUp, page de paiement hébergée), avec les mêmes garde-fous.
Ce document dit comment l'ouvrir, et ce qui doit exister avant.

## Le parcours d’un achat

| Étape | Ce qui se passe | Où |
|---|---|---|
| 1 | Le visiteur choisit la date, les billets par tarif, et donne son e-mail | Fiche du film ou de la soirée |
| 2 | Le serveur relit l'événement, les tarifs et la jauge, et **calcule le prix** | `api/creer-paiement.php` |
| 3 | La commande est enregistrée « en attente » ; elle retient ses places 30 minutes | Sanity |
| 4 | Le serveur demande une page de paiement à SumUp et y envoie le visiteur | SumUp |
| 5 | Le visiteur paie par carte, chez SumUp : aucune donnée bancaire ne passe par le site | SumUp |
| 6 | SumUp le renvoie sur `/billet/?ref=MIN-XXXXXX` | Site |
| 7 | Le serveur **redemande à SumUp** si c'est payé, et vérifie le montant encaissé | `api/statut-paiement.php` |
| 8 | Le billet s'affiche, avec sa référence à montrer à l'entrée | Site |

Le navigateur n'a jamais la clé SumUp et ne décide jamais du prix. Ouvrir une
adresse de billet à la main ne fabrique pas de billet.

## Les trois états de la caisse

Dans `js/config.js`, la ligne `BILLETTERIE` :

- `"demonstration"` (aujourd'hui) : le panneau d'achat fonctionne, et « Payer »
  mène directement au billet (référence MIN-000000), sans paiement. Rien n'est
  envoyé au serveur.
- `"ouverte"` : la vraie vente. À n'activer que quand tout ce qui suit est prêt.
- `"fermee"` : plus de panneau d'achat, seulement les infos de vente à la buvette.

## Avant d'ouvrir : la liste

### 1. Un compte SumUp au nom de Minimum

Pas celui de Zinéma : l'argent doit arriver sur le compte de Minimum. Il faut
la clé API (`sup_sk_…`, sur developer.sumup.com) et le code marchand (`M…`).

### 2. Sanity (projet de Minimum, `hvxsup1j`)

Minimum a son propre projet Sanity, indépendant de celui de Zinéma (décision
d'Eliott, 26.11.2026) : la caisse n'y lit et n'y écrit que du contenu de
Minimum. Ces types existent dans le Studio (`studio/`) :

| Type | Ce que la caisse y lit ou y écrit |
|---|---|
| `screening` (séance) | `film`, `date`, `time`, `status` |
| `soiree` | `title`, `date`, `ouverture` (HH:MM), `fin`, `status` (« disponible » pour vendre), `tarifs` (liste : `cle`, `libelle`, `detail`, `prix`), `capacite`, line-up, affiche, description, âge |
| `reglagesMinimum` (document unique, identifiant `reglagesMinimum`) | `tarifsCinema` (même forme que les tarifs des soirées), `placesCinema`, `placesClub` (jauge par défaut des soirées) |
| `commande` | les champs écrits par la caisse : `genre`, `evenement` (référence), `evenementTitre`, `evenementDate`, `evenementHeure`, `billets` (lignes), `nombreBillets`, `montant`, `email`, `statut`, `creeLe`, `payeeLe`, `sumupCheckoutId`, `reference` |

Les clés des tarifs de cinéma doivent rester `ordinaire`, `avs` et `soutien` :
la page et le serveur s'en servent pour reconnaître le tarif.

Sans tarif ou sans jauge, le serveur refuse de vendre : mieux vaut une caisse
fermée qu'une salle vendue deux fois.

Un jeton Sanity réservé à la caisse (projet `minimum`, droits « Editor ») : on
pourra le retirer sans rien couper d'autre.

### 3. L'hébergement

PHP 8.1 ou plus, avec cURL (tous les hébergements web Infomaniak). Le site
public va dans `web/`, la configuration secrète **à côté**, jamais dedans :

```
/home/clients/xxxx/sites/cineminimum.ch/
├── config.php      ← copie remplie de serveur/config.exemple.php
└── web/            ← le site : index.html, api/, billet/, film/, soiree/…
```

Ne pas envoyer en ligne : `serveur/`, `node_modules/`, les fichiers `.md`,
`package.json`, `tsconfig.json`. Le serveur refuse de lire un `config.php` posé
dans le dossier public.

### 4. Ouvrir

Passer `BILLETTERIE` à `"ouverte"`, faire un vrai achat d'un billet, vérifier
qu'il arrive sur le compte SumUp et que la commande passe « payée » dans Sanity,
puis le rembourser depuis SumUp.

## Ce que le serveur vérifie

- L'événement existe, appartient à Minimum, est en vente, n'est pas passé ;
  une séance déjà commencée ne se vend plus (une soirée, si).
- Les tarifs et les prix viennent de Sanity ; un prix envoyé par la page est ignoré.
- Entre 1 et 10 billets par commande (au-delà : cineminimum@gmail.com).
- La jauge : billets payés + commandes en attente de moins de 30 minutes. Si deux
  personnes prennent la dernière place à la même seconde, la seconde commande est
  annulée avant tout paiement.
- Le montant encaissé par SumUp doit être celui demandé ; sinon pas de billet, et
  la commande passe « à vérifier » dans Sanity.
- Au plus 20 commandes en 10 minutes par adresse, contre les paniers fantômes
  qui bloqueraient une salle.
- Les commandes sont rangées sous un identifiant `prive.…` : le projet Sanity est
  public (le site le lit sans clé), et seul ce préfixe rend un document illisible
  sans clé. L'e-mail de l'acheteur n'est jamais renvoyé à la page.
- Aucun message technique ne sort vers le visiteur : les détails vont dans le
  journal du serveur.

Tout cela a été essayé sur l'ordinateur contre un faux SumUp et un faux Sanity
(35 vérifications, dont un achat complet dans un navigateur).

## Reste à faire avant d'ouvrir

1. **E-mail de confirmation avec le billet** (à reprendre de Zinéma). Aujourd'hui,
   l'acheteur garde la page du billet ; s'il la perd, Minimum retrouve sa
   commande dans Sanity par son e-mail.
2. **Contrôle à l'entrée** : une liste des billets payés par séance et par soirée
   dans le Studio, pour cocher les références.
3. **Remboursements** : depuis SumUp, puis passer la commande en « remboursée ».
4. **Tarifs réduits** : confirmer avec Minimum qui y a droit et le justificatif
   demandé à l'entrée.
5. **Données personnelles** : mentionner la billetterie dans la politique de
   confidentialité, et décider combien de temps on garde les commandes.
6. Vérifier dans le Studio que les commandes `prive.…` apparaissent bien dans la
   liste des commandes.
