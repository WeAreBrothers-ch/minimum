/* Minimum : ce que le Studio propose de poster, à partir d'une fiche.
   Une proposition = un visuel + sa légende. Tout est calculé à partir du
   contenu saisi : rien n'est inventé, un champ vide ne produit aucune ligne. */

import { aujourdhui, jourEnLettres } from "../dates";
import type { ImageVisuel, Visuel } from "./rendu";

export interface Proposition {
  cle: string;
  /** Le nom de la proposition dans le sélecteur. */
  nom: string;
  visuel: Visuel;
  legende: string;
  /** Nom du fichier téléchargé, sans extension. */
  fichier: string;
  /** Ce qui manque pour un meilleur post. */
  conseils: string[];
}

interface ImageLue {
  url?: string | null;
  fx?: number | null;
  fy?: number | null;
  /** Largeur du fichier d'origine, en pixels. */
  largeur?: number | null;
}

/** Un post fait 1080 px de large : en dessous de cette largeur, l'image s'étire et devient floue. */
const LARGEUR_NETTE = 800;

/** Prévient quand l'image est trop petite pour sortir nette. */
function conseilNettete(lue: ImageLue | null | undefined, quoi: string): string[] {
  const largeur = lue?.largeur;
  return typeof largeur === "number" && largeur < LARGEUR_NETTE
    ? [`${quoi} ne fait que ${largeur} px de large : le post sortira flou. Remplacez-la par un fichier d'au moins 1080 px.`]
    : [];
}

export interface Reglages {
  compteInstagram?: string | null;
  hashtags?: string[] | null;
  mentionBillets?: string | null;
  nomRadio?: string | null;
}

export interface ArtisteLu {
  nom?: string | null;
  role?: string | null;
  instagram?: string | null;
  bio?: string | null;
  origine?: string | null;
  styles?: string[] | null;
  photo?: ImageLue | null;
}

export interface SoireeLue {
  title?: string | null;
  date?: string | null;
  ouverture?: string | null;
  fin?: string | null;
  age?: string | null;
  genreMusical?: string | null;
  description?: string | null;
  status?: string | null;
  affiche?: ImageLue | null;
  lineUp?: Array<{ debut?: string | null; precision?: string | null; artiste?: ArtisteLu | null }> | null;
  tarifs?: Array<{ libelle?: string | null; prix?: number | null }> | null;
}

export interface FilmLu {
  title?: string | null;
  director?: string | null;
  year?: number | null;
  country?: string | null;
  duration?: number | null;
  language?: string | null;
  ageRating?: string | null;
  typeDeFilm?: string | null;
  synopsis?: string | null;
  mention?: string | null;
  statuts?: string[] | null;
  releaseDate?: string | null;
  presence?: string | null;
  poster?: ImageLue | null;
  photo?: ImageLue | null;
  seances?: Array<{ date?: string | null; time?: string | null; versionNote?: string | null }> | null;
}

/** Un live de la radio, sur YouTube. */
export interface EmissionLue {
  title?: string | null;
  date?: string | null;
  heure?: string | null;
  description?: string | null;
  video?: string | null;
  visuel?: ImageLue | null;
  artiste?: ArtisteLu | null;
}

export interface EvenementLu {
  title?: string | null;
  typeEvenement?: string | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  excerpt?: string | null;
  image?: ImageLue | null;
}

const LIEU = "Minimum, La Case à Chocs, Neuchâtel";

/** Tant que les réglages ne sont pas publiés, les posts prennent les valeurs proposées par le Studio. */
export const REGLAGES_PAR_DEFAUT: Required<Pick<Reglages, "hashtags" | "mentionBillets" | "nomRadio">> = {
  hashtags: ["minimum", "caseachocs", "neuchatel"],
  mentionBillets: "Billets : cineminimum.ch (lien en bio)",
  nomRadio: "Minimum Radio",
};
const PIED = "La Case à Chocs · Neuchâtel";

const texte = (valeur: unknown): string | null => (typeof valeur === "string" && valeur.trim() ? valeur.trim() : null);

function image(lue: ImageLue | null | undefined, cadrage: ImageVisuel["cadrage"], noirEtBlanc = false): ImageVisuel | null {
  const url = texte(lue?.url);
  if (!url) return null;
  return {
    url,
    cadrage,
    noirEtBlanc,
    ...(typeof lue?.fx === "number" ? { fx: lue.fx } : {}),
    ...(typeof lue?.fy === "number" ? { fy: lue.fy } : {}),
  };
}

/** Le portrait d'un artiste : en plein, en noir et blanc, comme sur les flyers du site. */
const portrait = (lue: ImageLue | null | undefined) => image(lue, "couvrir", true);

/** La date et l'heure d'un flyer ; null tant que la date manque. */
function quand(date: unknown, heure: unknown): Visuel["quand"] {
  const jour = texte(date);
  return jour ? { date: jour, heure: texte(heure) } : null;
}

/** « @nom.du.compte », quelle que soit la façon dont il a été saisi. */
export function compte(valeur: unknown): string | null {
  const brut = texte(valeur)?.replace(/^@/, "");
  return brut ? `@${brut}` : null;
}

/** « #housemusic » depuis « House music ». */
export function hashtag(mot: string): string | null {
  const propre = mot
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return propre ? `#${propre}` : null;
}

function hashtags(reglages: Reglages, ...autres: Array<string[] | null | undefined>): string {
  const mots = [...(reglages.hashtags ?? []), ...autres.flatMap((liste) => liste ?? [])];
  return [...new Set(mots.map(hashtag).filter((h): h is string => h !== null))].join(" ");
}

const majuscule = (phrase: string) => phrase.charAt(0).toLocaleUpperCase("fr") + phrase.slice(1);
const pied = (reglages: Reglages) => compte(reglages.compteInstagram) ?? PIED;
const fichier = (...morceaux: Array<string | null | undefined>) =>
  ["minimum", ...morceaux]
    .map((m) => (m ? hashtag(m)?.slice(1) : null))
    .filter(Boolean)
    .join("-");

/** Assemble la légende : les paragraphes vides disparaissent. */
function legende(...paragraphes: Array<string | null | undefined | false>): string {
  return paragraphes.filter((p): p is string => typeof p === "string" && p.trim() !== "").join("\n\n");
}

const prix = (valeur: number) => `CHF ${Number.isInteger(valeur) ? `${valeur}.–` : valeur.toFixed(2)}`;

function etatSoiree(soiree: SoireeLue): Visuel["etiquette"] {
  if (soiree.status === "annule") return { texte: "Annulée", teinte: "probleme" };
  if (soiree.status === "complet") return { texte: "Complet", teinte: "probleme" };
  return null;
}

/* ------------------------------ Soirée ------------------------------ */

export function propositionsSoiree(soiree: SoireeLue, reglages: Reglages, prefixe = ""): Proposition[] {
  const titre = texte(soiree.title) ?? "Soirée";
  const jour = jourEnLettres(soiree.date);
  const passages = (soiree.lineUp ?? []).filter((p) => texte(p.artiste?.nom));
  const noms = passages.map((p) => texte(p.artiste?.nom) as string);
  const portes = texte(soiree.ouverture) ? `Portes ${soiree.ouverture}` : null;
  const tarifs = (soiree.tarifs ?? [])
    .filter((t) => texte(t.libelle) && typeof t.prix === "number")
    .map((t) => `${t.libelle} ${prix(t.prix as number)}`)
    .join(" · ");
  const billets = soiree.status === "disponible" || !soiree.status ? texte(reglages.mentionBillets) : null;
  const affiche = image(soiree.affiche, "couvrir");
  const conseils: string[] = [];
  if (!jour) conseils.push("La soirée n'a pas encore de date.");
  if (!affiche) conseils.push("Sans affiche, le visuel de la soirée est typographique : ajoutez l'affiche dans l'onglet « La soirée ».");
  if (passages.length === 0) conseils.push("Le line-up est vide : ajoutez les artistes pour avoir un post par DJ.");
  conseils.push(...conseilNettete(soiree.affiche, "L'affiche de la soirée"));

  const lineUp = passages
    .map((p) => [texte(p.debut), texte(p.artiste?.nom), compte(p.artiste?.instagram), texte(p.precision) ? `(${p.precision})` : null].filter(Boolean).join(" "))
    .join("\n");

  const propositions: Proposition[] = [
    {
      cle: `${prefixe}soiree`,
      nom: `${prefixe ? `${jour || titre} : ` : ""}La soirée entière`,
      fichier: fichier(soiree.date, titre),
      conseils,
      visuel: {
        /* Comme sur le site : l'affiche en couleur, sans étiquette, le nom et la date sur la bande noire. */
        gabarit: "flyer",
        etiquette: etatSoiree(soiree),
        image: affiche,
        titre,
        sousTitre: noms.length > 0 ? noms.join(" · ") : null,
        lignes: [],
        quand: quand(soiree.date, soiree.ouverture),
        pied: pied(reglages),
      },
      legende: legende(
        [titre.toLocaleUpperCase("fr"), [majuscule(jour), portes?.toLowerCase(), texte(soiree.fin) ? `jusqu'à ${soiree.fin}` : null].filter(Boolean).join(", "), LIEU]
          .filter(Boolean)
          .join("\n"),
        lineUp ? `Line-up\n${lineUp}` : null,
        texte(soiree.description),
        [texte(soiree.age), tarifs].filter(Boolean).join(" · "),
        billets,
        hashtags(reglages, soiree.genreMusical?.split(/[,·/]/) ?? []),
      ),
    },
  ];

  for (const [rang, p] of passages.entries()) {
    const artiste = p.artiste as ArtisteLu;
    const nom = texte(artiste.nom) as string;
    const photo = portrait(artiste.photo);
    const precision = texte(p.precision) ?? "DJ set";
    const heure = texte(p.debut) ? `À ${p.debut}` : portes;
    const manque: string[] = [];
    if (!photo) manque.push(`${nom} n'a pas de photo : le visuel reprend l'affiche de la soirée.`);
    if (!compte(artiste.instagram)) manque.push(`${nom} n'a pas de compte Instagram dans sa fiche : la légende ne le mentionne pas.`);
    manque.push(...conseilNettete(photo ? artiste.photo : soiree.affiche, photo ? `La photo de ${nom}` : "L'affiche de la soirée"));
    propositions.push({
      cle: `${prefixe}artiste-${rang}`,
      nom: `${prefixe ? `${jour || titre} : ` : ""}${nom} (${precision})`,
      fichier: fichier(soiree.date, nom),
      conseils: manque,
      visuel: {
        gabarit: "flyer",
        etiquette: etatSoiree(soiree) ?? { texte: precision, teinte: "musique" },
        image: photo ?? affiche,
        titre: nom,
        sousTitre: nom.toLocaleLowerCase("fr") === titre.toLocaleLowerCase("fr") ? texte(artiste.origine) : titre,
        lignes: [],
        quand: quand(soiree.date, texte(p.debut) ?? soiree.ouverture),
        pied: pied(reglages),
      },
      legende: legende(
        [`${nom.toLocaleUpperCase("fr")} · ${precision}`, [majuscule(jour), heure?.toLowerCase()].filter(Boolean).join(", "), `${titre}, ${LIEU}`]
          .filter(Boolean)
          .join("\n"),
        texte(artiste.bio),
        [compte(artiste.instagram), texte(artiste.origine)].filter(Boolean).join(" · "),
        billets,
        hashtags(reglages, artiste.styles, soiree.genreMusical?.split(/[,·/]/) ?? []),
      ),
    });
  }
  return propositions;
}

/* ------------------------------ Artiste ------------------------------ */

export function propositionsArtiste(artiste: ArtisteLu & { soirees?: SoireeLue[] | null }, reglages: Reglages): Proposition[] {
  const nom = texte(artiste.nom) ?? "Artiste";
  const propositions = (artiste.soirees ?? []).flatMap((soiree, rang) =>
    propositionsSoiree(soiree, reglages, `s${rang}-`).filter((p) => p.visuel.titre === nom),
  );
  if (propositions.length > 0) return propositions;
  const photo = portrait(artiste.photo);
  return [
    {
      cle: "presentation",
      nom: "Présentation (aucune soirée à venir)",
      fichier: fichier(nom),
      conseils: [
        "Cet artiste n'est au line-up d'aucune soirée à venir : le post le présente sans date. Ajoutez-le au line-up d'une soirée pour annoncer son passage.",
        ...(photo ? [] : ["Ajoutez une photo à la fiche : le visuel est typographique sans elle."]),
      ],
      visuel: {
        gabarit: "flyer",
        etiquette: { texte: texte(artiste.role) ?? "DJ", teinte: "musique" },
        image: photo,
        titre: nom,
        sousTitre: [texte(artiste.origine), ...(artiste.styles ?? [])].filter(Boolean).join(" · ") || null,
        lignes: [],
        quand: null,
        pied: pied(reglages),
      },
      legende: legende(nom.toLocaleUpperCase("fr"), texte(artiste.bio), compte(artiste.instagram), hashtags(reglages, artiste.styles)),
    },
  ];
}

/* ------------------------------ Film ------------------------------ */

const ETIQUETTES_FILM: Array<[string, string]> = [
  ["avant-premiere", "Avant-première"],
  ["premiere", "Première"],
  ["projection-extraordinaire", "Projection extraordinaire"],
  ["prochainement", "Prochainement"],
  ["cycle", "Ciné-club"],
  ["a-laffiche", "À l'affiche"],
];

export function propositionsFilm(film: FilmLu, reglages: Reglages): Proposition[] {
  const titre = texte(film.title) ?? "Film";
  const statuts = film.statuts ?? [];
  const etiquette = ETIQUETTES_FILM.find(([valeur]) => statuts.includes(valeur))?.[1] ?? "Cinéma";
  const seances = (film.seances ?? []).filter((s) => texte(s.date) && texte(s.time));
  const parJour = new Map<string, string[]>();
  for (const s of seances) parJour.set(s.date as string, [...(parJour.get(s.date as string) ?? []), s.time as string]);
  const jours = [...parJour.entries()];
  const lignesSeances = jours.slice(0, 4).map(([date, heures]) => `${jourEnLettres(date, true)} · ${heures.join(" et ")}`);
  if (jours.length > 4) lignesSeances[3] = `${lignesSeances[3]} · et ${jours.length - 3} autres dates`;
  const sortie = statuts.includes("prochainement") && texte(film.releaseDate) ? `Dès le ${jourEnLettres(film.releaseDate)}` : null;
  const lignes = lignesSeances.length > 0 ? lignesSeances : sortie ? [sortie] : [];
  const faits = [texte(film.country), film.year, film.duration ? `${film.duration} min` : null, texte(film.language)].filter(Boolean).join(" · ");
  const conseils: string[] = [];
  if (lignes.length === 0) conseils.push("Ce film n'a aucune séance à venir : le post n'annonce pas de date.");
  conseils.push(...conseilNettete(film.poster, "L'affiche du film"));
  const base = {
    gabarit: "fiche" as const,
    etiquette: { texte: etiquette, teinte: "cinema" as const },
    quand: null,
    /* Les repères de la fiche du site, dans le même ordre. */
    reperes: [
      { nom: "Durée", valeur: film.duration ? `${film.duration} min` : "" },
      { nom: "Version", valeur: texte(film.language) ?? "" },
      { nom: "Âge", valeur: texte(film.ageRating) ?? "" },
      { nom: "Genre", valeur: texte(film.typeDeFilm) ?? "" },
      { nom: "Année", valeur: film.year ? String(film.year) : "" },
      { nom: "Pays", valeur: texte(film.country) ?? "" },
    ].filter((repere) => repere.valeur !== ""),
    titre,
    sousTitre: texte(film.director) ? `de ${film.director}` : null,
    lignes,
    pied: pied(reglages),
  };
  const texteLegende = legende(
    [titre.toLocaleUpperCase("fr"), texte(film.director) ? `de ${film.director}` : null, faits].filter(Boolean).join("\n"),
    texte(film.mention),
    texte(film.synopsis),
    texte(film.presence) ? `En présence de ${film.presence}.` : null,
    jours.length > 0
      ? `Séances\n${jours.map(([date, heures]) => `${majuscule(jourEnLettres(date))} à ${heures.join(" et ")}`).join("\n")}`
      : sortie,
    LIEU,
    texte(reglages.mentionBillets),
    hashtags(reglages, ["cinema", film.typeDeFilm ?? ""]),
  );
  const propositions: Proposition[] = [
    { cle: "affiche", nom: "Avec l'affiche", fichier: fichier(titre), conseils, visuel: { ...base, image: image(film.poster, "entier") }, legende: texteLegende },
  ];
  const photo = image(film.photo, "couvrir");
  if (photo) {
    propositions.push({ cle: "photo", nom: "Avec une photo du film", fichier: fichier(titre, "photo"), conseils, visuel: { ...base, image: photo }, legende: texteLegende });
  }
  return propositions;
}

/* ------------------------------ Live YouTube (radio) ------------------------------ */

/** Le flyer d'un live, tel que le site le compose : portrait en noir et blanc, « LIVE YOUTUBE », le nom, la date, l'heure. */
export function propositionsEmission(live: EmissionLue, reglages: Reglages): Proposition[] {
  const artiste = live.artiste ?? {};
  const titre = texte(live.title) ?? texte(artiste.nom) ?? "Live";
  const jour = jourEnLettres(live.date);
  const radio = texte(reglages.nomRadio) ?? "Minimum Radio";
  const passe = typeof live.date === "string" && live.date < aujourdhui();
  const aRevoir = passe && texte(live.video) !== null;
  const visuel = portrait(live.visuel) ?? portrait(artiste.photo);
  const conseils: string[] = [];
  if (!visuel) conseils.push("Sans portrait, le flyer est typographique, tout rose : ajoutez le portrait de l'artiste.");
  if (!jour) conseils.push("Le live n'a pas encore de date.");
  conseils.push(...conseilNettete(live.visuel ?? artiste.photo, "Le portrait"));
  if (passe && !aRevoir) conseils.push("Ce live est passé et n'a pas d'adresse YouTube : le post l'annonce encore comme à venir.");
  return [
    {
      cle: "live",
      nom: aRevoir ? "Live à revoir" : "Annonce du live",
      fichier: fichier(live.date, titre, "live"),
      conseils,
      visuel: {
        gabarit: "flyer",
        etiquette: { texte: aRevoir ? "À revoir" : "Live YouTube", teinte: "musique" },
        image: visuel,
        titre,
        sousTitre: null,
        lignes: [],
        quand: quand(live.date, live.heure),
        pied: pied(reglages),
      },
      legende: legende(
        [
          `${titre.toLocaleUpperCase("fr")} · Live YouTube`,
          aRevoir
            ? `À revoir sur la chaîne YouTube de ${radio}`
            : [majuscule(jour), texte(live.heure) ? `à ${live.heure}` : null, `en direct sur la chaîne YouTube de ${radio}`].filter(Boolean).join(", "),
        ].join("\n"),
        texte(live.description) ?? texte(artiste.bio),
        compte(artiste.instagram),
        aRevoir && texte(live.video) ? `À revoir : ${live.video}` : "Lien de la chaîne en bio",
        hashtags(reglages, ["radio", "liveyoutube"], artiste.styles),
      ),
    },
  ];
}

/* ------------------------------ Événement ------------------------------ */

export function propositionsEvenement(evenement: EvenementLu, reglages: Reglages): Proposition[] {
  const titre = texte(evenement.title) ?? "Événement";
  const debut = jourEnLettres(evenement.dateDebut);
  const fin = evenement.dateFin && evenement.dateFin !== evenement.dateDebut ? jourEnLettres(evenement.dateFin) : "";
  const dates = debut && fin ? `Du ${debut} au ${fin}` : majuscule(debut);
  /* Sur le visuel, une période s'écrit en court pour tenir sur une ligne. */
  const datesCourtes = debut && fin ? `Du ${jourEnLettres(evenement.dateDebut, true)} au ${jourEnLettres(evenement.dateFin, true)}` : dates;
  return [
    {
      cle: "evenement",
      nom: "L'événement",
      fichier: fichier(evenement.dateDebut, titre),
      conseils: [],
      visuel: {
        gabarit: "fiche",
        etiquette: { texte: texte(evenement.typeEvenement) ?? "Événement", teinte: "agenda" },
        image: image(evenement.image, "couvrir"),
        titre,
        sousTitre: null,
        lignes: datesCourtes ? [datesCourtes] : [],
        quand: null,
        pied: pied(reglages),
      },
      legende: legende([titre.toLocaleUpperCase("fr"), dates, LIEU].filter(Boolean).join("\n"), texte(evenement.excerpt), hashtags(reglages)),
    },
  ];
}
