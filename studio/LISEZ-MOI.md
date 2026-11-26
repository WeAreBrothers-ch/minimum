# Studio Sanity de Minimum

**C'est le Studio de Zinéma**, sur un projet Sanity indépendant : même menu
« Contenu », même onglet « Planification », mêmes fiches, mêmes gestes. La
même personne gère les deux cinémas ; elle ne doit pas avoir à réapprendre.
S'y ajoute ce qui n'existe qu'à Minimum : la Musique et les posts Instagram.

- Studio en ligne : <https://cine-minimum.sanity.studio>
- Projet Sanity : `hvxsup1j` (« minimum »), jeu `production`. Le projet de
  Zinéma (`vle63mzm`) reste à part : ce Studio refuse d'y démarrer
  (`sanity/projet.ts`) et n'y écrit jamais ; il y LIT seulement les films,
  pour les faire arriver ici (voir « Les films partagés »).
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
| `sanity/minimum/banque` | Les films partagés avec Zinéma |

## Ce qui diffère de Zinéma

**En plus**

- **Musique**, dans le menu « Contenu », après l'Agenda : soirées à venir,
  soirées passées, lives de la radio, artistes et DJ.
- **Les films de Zinéma arrivent tout seuls.** Un film créé (et publié) à
  Zinéma apparaît dans « Films » et dans la Planification de Minimum, fiche
  et affiche copiées, sans rien cliquer. L'écran **Films partagés (Zinéma)**,
  juste sous « Films », montre où en est cette arrivée. Voir « Les films
  partagés » plus bas.
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

## Les films partagés

Les deux cinémas ont les mêmes exploitants et passent souvent les mêmes
films. Chacun garde son projet Sanity, mais la liste des films doit être la
même des deux côtés : un film créé dans un cinéma est disponible dans l'autre
sans rien retaper (demande d'Eliott, 26.11.2026).

**Comment ça marche.** Dès que le Studio de Minimum est ouvert, puis toutes
les cinq minutes, il lit les films publiés de Zinéma et crée ici ceux qui
manquent (`sanity/minimum/banque`). Un mot l'annonce : « « Titre » est arrivé
de Zinéma ».

- **Ce qui est copié** : ce qui décrit le film (titre, réalisation, durée,
  année, pays, version, âge, type, synopsis, bande-annonce, presse, affiche,
  photos). **Ce qui ne l'est pas** : ce qui tient à un cinéma (où en est le
  film là-bas, ses séances, sa date de sortie, son invité).
- **Le film arrive PAS à l'affiche** : un film créé à Zinéma ne doit pas se
  montrer au public de Minimum sans qu'on l'ait décidé. Il est dans « Films »
  (« Pas à l'affiche (fiche de Zinéma) ») et la Planification le propose ; sa
  fiche le dit en une phrase. Cocher « À l'affiche » ou « Prochainement » pour
  le montrer.
- **Le même film a le même identifiant des deux côtés** : il ne peut pas être
  créé deux fois. Un film saisi à la main dans les deux cinémas est reconnu
  par son titre.
- **Rien n'est jamais modifié ni supprimé** par l'arrivée, ni ici ni à
  Zinéma : elle ne fait que créer ce qui manque. Une correction faite ensuite
  dans un cinéma n'arrive donc pas chez l'autre.
- **Un film supprimé ici ne revient pas tout seul** : le Studio tient un
  carnet des films déjà venus (fiche `banque.zinema`, dans aucun menu). Sur
  l'écran « Films partagés », il est marqué « Retiré de Minimum », avec un
  bouton « Remettre ».
- **Seul un film publié arrive** : un brouillon de Zinéma reste à Zinéma.
- **Zinéma est lu sans jeton ni identifiants**, par son API publique, comme
  le fait son site : rien ne peut y être écrit d'ici. Le seul réglage fait
  chez Zinéma : l'adresse `https://cine-minimum.sanity.studio` est autorisée
  à le LIRE (CORS, sans identifiants), avec l'accord d'Eliott.
- Pour couper l'arrivée automatique : `ARRIVEE_AUTOMATIQUE = false` dans
  `sanity/minimum/banque/reglages.ts` (l'écran garde alors ses boutons).

**Dans l'autre sens, rien n'est fait.** Un film créé à Minimum n'arrive PAS
encore à Zinéma : il faut pour cela ajouter ce même dossier au Studio de
Zinéma (donc modifier son code et le remettre en ligne) et autoriser
`https://cincin-zinema.sanity.studio` à lire le projet de Minimum. Le dossier
`sanity/minimum/banque` est écrit pour y servir tel quel : seul `reglages.ts`
change (qui est « ici », qui est « l'autre », le type des images) ; s'y
ajoutent le type `journalBanque`, le champ `origineBanque` du film et la ligne
`studio.components.layout` de `sanity.config.ts`. À ne faire qu'avec l'accord
d'Eliott : la consigne est de ne rien toucher à Zinéma.

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
- les films partagés : les 27 films de Zinéma listés avec leurs affiches,
  tous reconnus comme déjà dans Minimum (« À jour ») ; avec un film de plus
  dans la réponse de Zinéma et des écritures simulées, le film arrive tout
  seul (fiche complète, pas à l'affiche, affiche copiée, carnet tenu) et le
  mot s'affiche ; avec des écritures refusées, rien ne casse et l'écran
  propose « Faire venir ». Zinéma n'est lu que sans identifiants ;
- l'onglet Posts : 34 posts composés, « Post » et « Story » (image
  enregistrée, légende copiée).

Vérifié par `npm test` : 6206 vérifications de la Planification à une salle
(semaine remplie, aucun chevauchement, 21 h après la fin du film de 19 h,
dimanche à 17 h, rien d'écrasé, rien au Club), 17 sur la séance d'une
avant-première, 42 sur les films partagés, et celles de Zinéma sur l'historique, la feuille à imprimer
et les actions du Studio.

**Pas essayé.** Le compte disponible pour ces essais ne pouvait que lire, et
cette version du Studio n'ouvre pas une fiche sans connexion en direct :

- ouvrir, remplir et publier une fiche, et l'onglet « Instagram » d'une fiche
  (son code est celui de l'onglet Posts, essayé) ;
- tout ce qui écrit depuis la Planification : glisser une séance, programmer
  un film, remplir au hasard, dupliquer, vider, annuler ;
- les deux boutons d'une commande ;
- une vraie arrivée de film écrite dans le projet (les écritures ont été
  simulées dans le navigateur) et la phrase affichée dans la fiche d'un film
  arrivé.

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
