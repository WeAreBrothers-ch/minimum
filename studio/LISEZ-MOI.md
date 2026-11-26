# Studio Sanity de Minimum

**C'est le Studio de Zinéma**, sur un projet Sanity indépendant : même menu
« Contenu », même onglet « Planification », mêmes fiches, mêmes gestes. La
même personne gère les deux cinémas ; elle ne doit pas avoir à réapprendre.
S'y ajoute ce qui n'existe qu'à Minimum : la Musique et les posts Instagram.

- Studio en ligne : <https://cine-minimum.sanity.studio>
- Projet Sanity : `hvxsup1j` (« minimum »), jeu `production`. Rien n'est
  partagé avec le projet de Zinéma (`vle63mzm`), sur lequel ce Studio refuse
  de démarrer (`sanity/projet.ts`).
- Mode d'emploi : celui de Zinéma (`SANITY.md` du dépôt Cin-Cin-), à ceci
  près — voir « Ce qui diffère de Zinéma ».

## D'où vient le code

`sanity/` est une copie du Studio de Zinéma (dépôt `Mouknardine/Cin-Cin-`,
commit `70bb203`, 18.11.2026), avec les mêmes versions (Sanity 3.99, React 18),
adaptée le moins possible. Ce qui est propre à Minimum est dans
`sanity/minimum/`.

| Dossier | Ce que c'est |
|---|---|
| `sanity/schemaTypes`, `sanity/deskStructure.ts`, `sanity/salles.ts`… | Le Studio de Zinéma, adapté |
| `sanity/plugins/planification` | L'onglet Planification de Zinéma, tel quel ou presque |
| `sanity/minimum/schema` | Soirées, lives de la radio, artistes |
| `sanity/minimum/insta` | Les visuels et les légendes Instagram |
| `sanity/minimum/posts` | L'onglet « Posts » |
| `sanity/minimum/actions` | Post en un clic ; contrôle et remboursement d'un billet |

## Ce qui diffère de Zinéma

**En plus**

- **Musique**, dans le menu « Contenu », après l'Agenda : soirées à venir,
  soirées passées, lives de la radio, artistes et DJ.
- **Posts**, en haut, à côté de « Planification » : tout ce qui peut se poster
  dans les quatre semaines qui viennent (soirées, DJ, lives, films qui ont une
  séance, événements), avec le visuel déjà composé. « Post » ou « Story » :
  l'image est enregistrée et la légende copiée.
- **Onglet « Instagram »** sur une fiche (film, soirée, live, artiste,
  événement), et **« Post Insta en 1 clic »** dans le menu ⋮ à côté de
  Publish : la même chose pour une fiche, avec la légende modifiable et le
  format carré.
- **Billets vendus** : deux boutons sur une commande, « Billet contrôlé » et
  « Marquer comme remboursée » (à Zinéma, une commande ne se touche pas).
- **Réglages du cinéma** : un groupe « Radio & Instagram » (chaîne YouTube,
  compte Instagram, hashtags, phrase des billets).

**Adapté**

- **Une salle au lieu de deux.** La grille de la Planification tient la
  « Salle » (19 h et 21 h, 17 h et 19 h le dimanche : quatorze cases par
  semaine). Le « Club » joue le rôle du Hall-Bar : ses séances s'affichent
  sous la grille et aucun assistant n'en invente. Le menu « Passer ce film en
  Salle 2 » n'existe donc pas.
- **Tarifs** : une liste (Ordinaire, AVS, Réduit) au lieu de plein tarif et
  tarif réduit, et deux nombres (places de la salle, jauge du club). Ce sont
  les champs que lit la caisse du site (`api/_evenement.php`). La fiche des
  réglages a l'identifiant `reglagesMinimum`.
- **Commandes** : les champs qu'écrit la caisse de Minimum (une séance ou une
  soirée, des lignes de billets par tarif).

- **Newsletter** et **Piqûre de rappel** : les mêmes qu'à Zinéma, mises au
  nom de Minimum — son logo, ses couleurs (rouge du cinéma, jaune, grenat,
  vert de l'argent avec un texte noir), ses liens vers cineminimum.ch, ses
  tarifs, son pied. Une seule salle : le programme n'écrit plus « SALLE » au
  bout de chaque ligne, seulement « CLUB » quand c'en est une. Elles ne
  parlent que du cinéma et des événements, comme à Zinéma : les soirées et les
  lives n'y sont pas.
- **Imprimer le programme** : le logo de Minimum.

**Retiré**

- **Prix particulier** et **lien SumUp** d'un film ou d'une séance : la caisse
  de Minimum ne les lit pas ; les laisser aurait fait croire à un réglage qui
  ne règle rien.
- Le lien d'un événement, dans la newsletter, mène à l'agenda : le site de
  Minimum n'a pas de page par événement.

## Les exemples (26.11.2026)

Pour voir le rendu, le projet contient ce que le site montre aujourd'hui en
démonstration, avec ses images :

- **8 films** du programme du site (6 à l'affiche, 2 « Prochainement »), avec
  les affiches du site ; 5 étaient déjà dans le catalogue copié de Zinéma et
  ont reçu l'affiche du site.
- **28 séances** : les semaines du 25 novembre et du 2 décembre, 19 h et 21 h
  (17 h et 19 h le dimanche), comme le programme du site.
- **3 artistes** « DJ Exemple 1, 2, 3 », **7 soirées** « Soirée club » (du 27
  novembre au 18 décembre) et **4 lives**, avec les images d'exemple du site.
  Ces images ne viennent pas de Minimum (voir `LISEZ-MOI.md` à la racine) :
  **à remplacer avant toute mise en ligne**.
- **Réglages du cinéma** et **Membership** : ce ne sont pas des exemples, mais
  les vraies infos de la page Infos du site (adresse, téléphones, e-mail,
  tarifs, remerciements, carte de membre, IBAN). Le nombre de places et la
  jauge du club restent à remplir.

Le site reste en démonstration : il ne lit pas ces fiches, elles ne sont donc
visibles que dans le Studio. À supprimer (ou à remplacer par le vrai
programme) avant de brancher le site.

## Lancer

```
cd studio
npm ci
npm run dev         # Studio local sur http://localhost:3333
npm run typecheck   # vérifie les schémas
npm test            # vérifie la Planification à une salle, la projection
                    # d'une avant-première, l'historique, l'impression
npm run deploy      # met en ligne https://cine-minimum.sanity.studio
```

`npm run deploy` demande un compte qui a les droits sur le projet
(`npx sanity login`), ou un jeton « Deploy Studio » dans `SANITY_AUTH_TOKEN`.

## Ce qui a été essayé, et ce qui ne l'a pas été

Essayé dans le Studio, dans un navigateur, le 26.11.2026, sur les exemples :

- le menu « Contenu » et chacune de ses listes ;
- la Planification : la grille à une salle remplie de ses 14 séances, le
  changement de semaine, et l'ouverture de chaque assistant (Programmer un
  film, Remplir au hasard, Dupliquer la semaine, Vider la semaine) ;
- la Newsletter et la Piqûre de rappel : générées sur le programme d'exemple,
  relues (aucune mention de Zinéma, liens vers cineminimum.ch, tarifs des
  réglages) et affichées ;
- la feuille à imprimer : le logo de Minimum, pas de « Salle » répété ;
- l'onglet Posts : 34 posts composés, « Post » et « Story » (image
  enregistrée, légende copiée).

Vérifié par `npm test` : 6206 vérifications de la Planification à une salle
(semaine remplie, aucun chevauchement, 21 h après la fin du film de 19 h,
dimanche à 17 h, rien d'écrasé, rien au Club), 17 sur la séance d'une
avant-première, et celles de Zinéma sur l'historique, la feuille à imprimer
et les actions du Studio.

**Pas essayé.** Le compte disponible pour ces essais ne pouvait que lire, et
cette version du Studio n'ouvre pas une fiche sans connexion en direct :

- ouvrir, remplir et publier une fiche, et l'onglet « Instagram » d'une fiche
  (son code est celui de l'onglet Posts, essayé) ;
- tout ce qui écrit depuis la Planification : glisser une séance, programmer
  un film, remplir au hasard, dupliquer, vider, annuler ;
- les deux boutons d'une commande.

À essayer avec un vrai compte avant de s'y fier.

## À savoir

- Les films recopiés de Zinéma qui ne sont pas au programme du site restent
  marqués « Terminé » : cocher « À l'affiche » pour en programmer un. Leurs
  affiches ne font souvent que 250 px de large : leurs posts sortiront flous
  tant qu'elles ne sont pas remplacées.
- Les vérifications de la newsletter écrites pour Zinéma (elles comparent
  avec le site de Zinéma) ne sont pas reprises : la newsletter de Minimum a
  été relue à la main sur le programme d'exemple, pas vérifiée
  automatiquement.
- Avant d'ouvrir la caisse : remplir et publier « Réglages du cinéma »
  (tarifs, places, jauge).
- Le site (`js/config.js`) lit ce projet, mais reste en démonstration : il ne
  lit pas encore les séances, les soirées ni les lives saisis ici.
