/**
 * Le bloc « Infos » : tarifs, billets, salles.
 */
import type {ReglagesNewsletter} from './types'
import {ENCRE, GRIS, JAUNE, SITE, TAILLE, bandeau, cellule, echapper, sansLienAutomatique, tableau} from './html'

function ligneDeTarif(montant: number | null, libelle: string): string {
  if (montant === null) return ''
  return `<tr>${cellule(
    `${echapper(montant)}.–`,
    `background-color:${JAUNE};color:${ENCRE};padding:8px;width:56px;` +
      `font-size:${TAILLE.texte};line-height:1.3;font-weight:bold;text-align:center;`,
    'width="56"',
  )}${cellule(echapper(libelle), `padding:8px 12px;font-size:${TAILLE.texte};line-height:1.45;`)}</tr>`
}

export function blocPratique(reglages: ReglagesNewsletter): string {
  /* Minimum a une salle de cinéma, sans parrain : une ligne, son nombre de
     places quand il est renseigné dans les réglages. */
  const salles = reglages.places
    ? `<b style="color:${ENCRE};">Salle Anaïs Emery</b> — ${sansLienAutomatique(echapper(`${reglages.places} places`))}`
    : ''

  const billets = `<tr>${cellule(
    `<b>Billets en ligne sur <a href="${SITE}" style="color:${ENCRE};">cineminimum.ch</a></b>, ` +
      `ou à la buvette 15 minutes avant les séances.`,
    `padding:8px 12px;font-size:${TAILLE.texte};line-height:1.5;`,
    'colspan="2"',
  )}</tr>`

  const lignesDesSalles = salles
    ? `<tr>${cellule(
        salles,
        `padding:8px 12px;font-size:${TAILLE.petit};line-height:1.65;color:${GRIS};`,
        'colspan="2"',
      )}</tr>`
    : ''

  return (
    bandeau('Infos') +
    `<tr>${cellule(
      tableau(
        /* Une ligne par tarif des réglages : « Ordinaire », « AVS, AI… », « Réduit — à qui ». */
        (reglages.tarifs ?? [])
          .map((tarif) =>
            ligneDeTarif(tarif?.prix ?? null, [tarif?.libelle, tarif?.detail].filter(Boolean).join(' — ') || 'Tarif'),
          )
          .join('') +
          billets +
          lignesDesSalles,
      ),
      'padding:0;',
    )}</tr>`
  )
}
