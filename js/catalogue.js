// @ts-check
/* Minimum : compléter un film du programme avec le catalogue de Minimum
   (Sanity). Ce que le programme écrit lui-même reste prioritaire ; le
   catalogue n’apporte que l’affiche, le titre original, les images du
   film et l’article de presse. */

/** @typedef {import("./types.js").Film} Film */
/** @typedef {import("./types.js").Lien} Lien */
/** @typedef {import("./sanity.js").FicheCatalogue} FicheCatalogue */

/**
 * Le titre original n’est utile que s’il diffère du titre : les deux
 * s’affichent en capitales, « Nomadland » et « NOMADLAND » sont le même.
 * @param {string} titre
 * @param {string | null} original
 * @returns {string | null}
 */
function titreOriginalUtile(titre, original) {
  if (!original) return null;
  const memes = original.toLocaleUpperCase("fr") === titre.trim().toLocaleUpperCase("fr");
  return memes ? null : original;
}

/**
 * « letemps.ch », depuis l’adresse de l’article.
 * @param {string} url
 * @returns {Lien}
 */
function lienDePresse(url) {
  return { genre: "Presse", source: new URL(url).hostname.replace(/^www\./, ""), url };
}

/**
 * @param {Film} film
 * @param {FicheCatalogue | undefined} fiche
 * @returns {Film}
 */
export function completerFilm(film, fiche) {
  if (!fiche) return film;
  const presse = fiche.presse;
  const nouvellePresse = presse !== null && !film.liens.some((l) => l.url === presse);
  return {
    ...film,
    affiche: film.affiche ?? fiche.affiche,
    titreOriginal: film.titreOriginal ?? titreOriginalUtile(film.titre, fiche.titreOriginal),
    photos: film.photos.length > 0 ? film.photos : fiche.photos,
    liens: nouvellePresse ? [...film.liens, lienDePresse(presse)] : film.liens,
  };
}
