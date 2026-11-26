# Minimum : cinéma, club et radio

Site de Minimum, à La Case à Chocs, Neuchâtel. Même famille que Zinéma
(`../Zinema/nouveau-site`) : mêmes exploitants, mais **un projet Sanity à part**
(`hvxsup1j`, Studio dans `studio/`) : rien n'est partagé avec celui de Zinéma.
Direction artistique : `DIRECTION-ARTISTIQUE.md`.

## Voir le site

```
npm run servir        # puis ouvrir http://localhost:8000
```

En ouvrant le fichier directement (`file://`), rien ne se charge : il faut passer par ce serveur.

## Après avoir ajouté ou retiré un module JavaScript

```
npm run precharger    # annonce en tête de chaque page les modules dont elle a besoin
```

Chaque page charge son propre code à la demande (`js/main.js`) ; ses modules
sont annoncés dans son HTML pour arriver tous ensemble. Chaque page ne charge
aussi que ses feuilles de style ; en changeant de page, `js/navigation.js`
ajoute celles qui manquent.

## Vérifier

```
npm run verifier      # TypeScript relit tout le code (aucune erreur attendue)
node ~/.claude/skills/anti-slop/scripts/scan.mjs .
node ~/.claude/skills/principes/scripts/verifier.mjs tout . --paires paires.txt --css css/jetons.css --convention romand
```

## Comment c'est construit

- HTML, CSS et JavaScript sans étape de construction. Le code est typé par
  TypeScript (`// @ts-check` et annotations JSDoc, `tsconfig.json` en mode strict).
- `js/main.js` lance la page affichée. `js/navigation.js` change de page sans
  recharger. Pas de barre de menu : on circule par les rectangles de l'accueil,
  le nom MINIMUM en haut de chaque page et la rangée des rubriques du pied de
  page (`css/acces.css`).
- `js/mur.js` : un mur d'affiches par moitié de l'accueil (Musique, Cinéma), fait de
  colonnes qui défilent chacune seule et sans fin (`js/colonne.js`) : 1 colonne
  par mur sur téléphone, 2 sur ordinateur, soit 4 colonnes indépendantes.
- `js/donnees.js` charge le programme une seule fois pour tout le site.
- Fiches détaillées : `film/?id=…` et `soiree/?id=…` (une seule page chacune,
  remplie selon l'adresse), en cases jointes d'un trait, sur le modèle de la
  fiche Zinéma : le retour, le titre et la case Billets verte ; l'affiche et
  ses repères ; les séances (une case chacune) ; le texte. Deux colonnes sur
  téléphone ; sur ordinateur, quatre colonnes alignées sur la barre du haut,
  l'affiche, les repères et le texte sur une rangée, les séances dessous. Un clic sur
  Billets ou sur une séance ouvre la caisse, une fenêtre par-dessus la page
  (`<dialog>`) ; l'adresse `…#billets` l'ouvre dès l'arrivée. La grille est
  dans `css/detail-grille.css`, le contenu des cases dans `css/detail.css`,
  la caisse dans `css/achat.css` et `css/achat-paiement.css`.
  Le billet : `billet/`.
- Fiche film : toutes les infos de la fiche Zinéma (année, pays, durée, genre,
  version, âge, synopsis, bande-annonce, liens, séances), puis les images du
  film. Le catalogue commun (`js/catalogue.js`) apporte l'affiche,
  le titre original, les images du film et l'article de presse ; jamais l'invité·e
  d'une séance de Zinéma. « En présence de… » et les séances complètes ou annulées
  sont prêts, à remplir quand les séances de Minimum seront dans Sanity.
- Billetterie : la liste des séances et la caisse sont dans `js/billetterie/`
  (`panneau-html.js` pour le dessin, `panneau.js` pour la marche), le serveur dans
  `api/` (PHP). Mode d'emploi et liste avant ouverture : `BILLETTERIE.md`.
- Page Musique : soirées du club et lives YouTube sur une seule page
  (`js/pages/musique.js`, `css/musique.css`) : le lecteur pendant un live (live
  en cours de la chaîne), puis soirées et lives à venir au même format
  d'affiche, puis les lives à revoir. Chaque live a son nom d'artiste
  (`titre`), son portrait (`visuel`) et son adresse YouTube (`video`).
  `radio/` renvoie vers `musique/`.
- Machine à flyers : `js/flyer.js` compose le flyer d'un live (portrait, nom,
  date, heure) et celui d'une soirée, pour le mur de l'accueil et la page
  Musique.
- Design : celui de Zinéma, déguisé (tableau de cases, `css/cases.css`,
  `css/acces.css`) ; voir `DIRECTION-ARTISTIQUE.md`.
- Toutes les valeurs de style sont dans `css/jetons.css`.

## État : démonstration

`js/config.js`, `DEMONSTRATION = true` :
- **Cinéma** : programme réel de la semaine du 11 au 17 novembre 2026, repris de
  cineminimum.ch, complété par le catalogue Sanity de Minimum (titre original, presse).
- **Musique et Radio** : soirées et lives d'essai, sans mention « exemple » à
  l'écran (choix d'Eliott, 16.11.2026). Les affiches de soirée viennent d'images
  du Bureau d'Eliott, pas de Minimum : **à remplacer avant la mise en ligne**
  (droits d'auteur). Avec `DEMONSTRATION = false`, aucune n'est plus utilisée.

## Reste à faire

1. **Sanity de Minimum, indépendant de Zinéma** (décision d'Eliott,
   26.11.2026 : rien n'est partagé avec le projet de Zinéma, qui ne doit pas
   être modifié). Le Studio est dans `studio/` (voir `studio/LISEZ-MOI.md`).
   Fait le 26.11.2026 : projet `hvxsup1j` créé, les 27 films de Zinéma copiés
   une fois (marqués « Terminé », hors pages publiques), le site et la caisse
   lisent ce projet. Reste à mettre le Studio en ligne (`npm run deploy` dans
   `studio/`, avec un compte qui a les droits sur le projet).
2. Brancher `donnees.js` sur Sanity, puis `DEMONSTRATION = false`.
3. Billetterie : construite et essayée, en mode démonstration. Avant de
   l'ouvrir : compte SumUp au nom de Minimum, champs Sanity, e-mail de
   confirmation. Tout est listé dans `BILLETTERIE.md`.
4. Chaîne YouTube de la radio (`CHAINE_YOUTUBE` dans `config.js`, l'identifiant
   « UC… ») et l'adresse YouTube de chaque live.
5. Matière à fournir par le client : voir `DIRECTION-ARTISTIQUE.md`.
6. Avant la mise en ligne : ajouter l'adresse définitive aux origines autorisées
   (CORS) du projet Sanity, sinon le contenu ne se charge pas ; favicon à partir
   du logo vectoriel.
