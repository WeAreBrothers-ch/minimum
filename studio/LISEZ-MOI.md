# Studio Sanity de Minimum

Le Studio où Minimum saisit son contenu : films, séances, soirées, lives de la
radio, artistes, événements, billets, réglages.

**Projet indépendant de celui de Zinéma** (décision d'Eliott, 26.11.2026) :
son propre projet Sanity, son propre catalogue de films, ses propres jetons.
`projet.ts` refuse de démarrer sur le projet de Zinéma (`vle63mzm`).

## État (26.11.2026)

- Projet Sanity **`hvxsup1j`** (« minimum »), jeu `production`, dans la même
  organisation que celui de Zinéma, à côté de lui. Le projet de Zinéma n'a
  pas été modifié.
- Les 27 films de Zinéma y ont été copiés une fois, avec leurs affiches
  (lecture seule chez Zinéma). Ils arrivent marqués « Terminé », hors pages
  publiques : cocher « À l'affiche » pour en programmer un. L'invité·e, les
  prix et les séances de Zinéma n'ont pas été copiés.
- Le site (`js/config.js`, `.htaccess`) et la caisse (`api/`,
  `serveur/config.exemple.php`) lisent ce projet.
- Adresses autorisées à lire le projet (CORS) : `localhost:8000`,
  `localhost:3333` et `cine-minimum.sanity.studio` (Studio),
  `wearebrothers-ch.github.io`, `cineminimum.ch` et `www.cineminimum.ch`.
- **Le Studio est en ligne : https://cine-minimum.sanity.studio** (mis en
  ligne le 26.11.2026). On s'y connecte avec un compte Sanity membre du
  projet « minimum ». Il apparaît aussi dans le tableau de bord sanity.io.
- À remplir dans le Studio avant d'ouvrir la caisse : « Le lieu → Réglages »
  (tarifs, nombre de places, jauge du club), puis le publier.

## Lancer

```
cd studio
npm install
npm run dev        # http://localhost:3333
npm run verifier   # TypeScript
npx sanity login   # une fois, avec le compte du projet
npm run deploy     # met le Studio en ligne (sanity.studio) ; choisir son adresse
npm run schema     # facultatif : publie le modèle pour les outils Sanity
```

`package-lock.json` fixe les versions qui marchent : préférer `npm ci`.

## Ce qu'il contient

| Rubrique du menu | Fiches |
|---|---|
| Cinéma | Films, séances (avec alerte si deux séances se chevauchent), cases sans film (privé, vacances) |
| Musique | Soirées (line-up, tarifs, jauge), lives YouTube de la radio, artistes et DJ |
| Événements | Festivals, cycles, rendez-vous en plusieurs soirs |
| Billetterie | Commandes écrites par la caisse du site ; contrôle à l'entrée et remboursement en un bouton |
| Le lieu | Réglages (contact, tarifs, jauges, chaîne YouTube, Instagram), cartes de membre, location, histoire |

Repris de Zinéma : films, séances, cases sans film, événements, commandes,
abonnements, location, histoire, réglages. Les noms des champs des films et
des séances sont les mêmes (`title`, `poster`, `director`, `time`…), pour
pouvoir copier le catalogue une fois.

Les noms attendus par la caisse (`api/_evenement.php`, `BILLETTERIE.md`) sont
respectés : `screening`, `soiree` (`title`, `date`, `ouverture`, `status`,
`tarifs`, `capacite`), `reglagesMinimum` (`tarifsCinema`, `placesCinema`,
`placesClub`), `commande`.

## Le post Instagram en un clic

Sur une soirée, un artiste, un live, un film ou un événement :

- le bouton **« Post Insta en 1 clic »** (menu des actions, en bas de la
  fiche) enregistre l'image du post et copie sa légende ;
- l'onglet **« Instagram »** montre le visuel avant, en trois formats (post
  4:5, story 9:16, carré), avec la légende modifiable. Sur une soirée, il
  propose un post pour la soirée entière et un par artiste du line-up. Sur
  téléphone, « Envoyer vers Instagram » ouvre la feuille de partage.

Les visuels reprennent la machine à flyers du site (`js/flyer.js`,
`css/flyer.css`) : la photo en plein, l'étiquette rose, le nom en très grand
sur une bande noire, la date et l'heure en rose ; portrait d'artiste en noir
et blanc, affiche de soirée en couleur, flyer tout rose sans image. Les films
et les événements sont sur fond blanc, avec l'étiquette rouge du cinéma.

Le code : `insta/rendu.ts` (le dessin), `insta/propositions.ts` (ce qu'on
poste et la légende), `insta/requetes.ts` (ce qu'on lit), `insta/vue-instagram.tsx`
(l'onglet), `actions/post-insta.tsx` (le bouton).

La publication se fait à la main dans Instagram : le Studio prépare l'image
et la légende. Publier directement demanderait un compte Instagram
professionnel relié à une page Facebook et une application Meta.

## Pas repris de Zinéma

Le code du Studio de Zinéma n'est dans aucun dépôt lu ici : seul son modèle
de contenu a servi de référence. Ne sont donc pas repris ses réglages
internes (planification, création automatique d'une séance à la publication
d'une avant-première, newsletter).
