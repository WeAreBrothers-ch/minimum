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

**Retiré, pour l'instant**

- **Newsletter** et **Piqûre de rappel** : leur code est là
  (`sanity/plugins/planification/newsletter`), mais il est encore dessiné pour
  Zinéma : logo, couleurs, liens vers zinema.ch, parrains des salles, ligne de
  fondation. Leurs deux boutons ne s'affichent donc pas. Pour les rendre :
  les mettre aux couleurs et aux adresses de Minimum, puis passer
  `NEWSLETTER_ACTIVE` à `true` (`sanity/minimum/reglages-du-studio.ts`).
- **Prix particulier** et **lien SumUp** d'un film ou d'une séance : la caisse
  de Minimum ne les lit pas ; les laisser aurait fait croire à un réglage qui
  ne règle rien.

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

Essayé dans le Studio, dans un navigateur, le 26.11.2026, avec des fiches
d'essai supprimées depuis :

- le menu « Contenu » et chacune de ses listes ;
- la Planification : la grille à une salle, le changement de semaine, et
  l'ouverture de chaque assistant (Programmer un film, Remplir au hasard,
  Dupliquer la semaine, Imprimer le programme, Vider la semaine) ;
- l'onglet Posts : les aperçus, « Post » et « Story » (image enregistrée,
  légende copiée).

Vérifié par `npm test` : 6206 vérifications de la Planification à une salle
(semaine remplie, aucun chevauchement, 21 h après la fin du film de 19 h,
dimanche à 17 h, rien d'écrasé, rien au Club), et 17 sur la séance d'une
avant-première.

**Pas essayé.** Le compte disponible pour ces essais ne pouvait que lire, et
cette version du Studio n'ouvre pas une fiche sans connexion en direct :

- ouvrir, remplir et publier une fiche, et l'onglet « Instagram » d'une fiche
  (son code est celui de l'onglet Posts, essayé) ;
- tout ce qui écrit depuis la Planification : glisser une séance, programmer
  un film, remplir au hasard, dupliquer, vider, annuler ;
- les deux boutons d'une commande.

À essayer avec un vrai compte avant de s'y fier.

## À savoir

- Les 27 films recopiés de Zinéma sont marqués « Terminé » : cocher « À
  l'affiche » pour en programmer un. Plusieurs affiches ne font que 250 px de
  large : leurs posts sortiront flous tant qu'elles ne sont pas remplacées.
- Avant d'ouvrir la caisse : remplir et publier « Réglages du cinéma »
  (tarifs, places, jauge).
- Le site (`js/config.js`) lit ce projet, mais reste en démonstration : il ne
  lit pas encore les séances, les soirées ni les lives saisis ici.
