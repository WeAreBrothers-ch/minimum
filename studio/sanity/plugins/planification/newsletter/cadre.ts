/**
 * Le cadre commun aux deux envois — la newsletter du lundi et la piqûre de
 * rappel du milieu de semaine : le logo en tête, la case bleue qui annonce,
 * l'appel au site, le pied, et la largeur du message. Une seule écriture :
 * l'abonné reconnaît Minimum au premier coup d'œil, quel que soit l'envoi.
 */
import {
  BLANC, BLEU, ENCRE, LARGEUR, PAPIER, POLICE, SITE, SUR_VERT, TAILLE, VERT,
  capitales, cellule, echapper,
} from './html'
import type {ReglagesNewsletter} from './types'

/**
 * Le logo du cinéma, tel qu'il est dessiné : noir sur blanc. Servi par le
 * site lui-même, à une adresse que toute messagerie peut aller chercher.
 *
 * Le cinéma a demandé qu'il soit « plus frontal et toujours noir sur blanc »
 * (22 septembre 2026) : l'ancienne version blanche sur l'encre ne passait
 * ni à l'écran ni à l'impression, où le fond noir sortait en gris.
 */
/* Le logo de Minimum (le grand M au-dessus de INIMUM), déposé une fois dans
   le projet Sanity de Minimum : une adresse fixe, que toute messagerie peut
   aller chercher, et qui ne dépend pas de la mise en ligne du site. */
const LOGO = 'https://cdn.sanity.io/images/hvxsup1j/production/f29a69ac0bb5d4f9787ecdab2154b2e386f70eb0-604x745.png?w=360'
const MARGE_LOGO = 16
/* Le logo de Minimum est en hauteur : sur toute la largeur du message, il
   prendrait l'écran entier. Il garde une largeur de logo, au centre. */
const LARGEUR_LOGO = 150

/**
 * L'en-tête : le logo seul, sur toute la largeur du message, en noir sur
 * blanc. Si la messagerie bloque les images, le texte de remplacement
 * s'écrit à sa place, en noir.
 */
export function entete(): string {
  return `<tr>${cellule(
    `<a href="${SITE}" style="display:block;color:${ENCRE};text-decoration:none;">` +
      `<img src="${LOGO}" width="${LARGEUR_LOGO}" alt="MINIMUM" style="display:block;width:100%;` +
      `max-width:${LARGEUR_LOGO}px;height:auto;border:0;margin:0 auto;color:${ENCRE};font-family:${POLICE};` +
      `font-size:${TAILLE.titre};font-weight:bold;text-align:center;"></a>`,
    `background-color:${BLANC};padding:${MARGE_LOGO + 8}px ${MARGE_LOGO}px;text-align:center;`,
    'align="center"',
  )}</tr>`
}

/**
 * La case bleue qui annonce le message, en capitales : « PROGRAMME DU
 * MERCREDI 16 SEPTEMBRE AU MARDI 22 SEPTEMBRE 2026 (38) » le lundi, le titre
 * choisi pour une piqûre de rappel.
 */
export function bandeBleue(texte: string): string {
  return `<tr>${cellule(
    echapper(capitales(texte)),
    `background-color:${BLEU};color:${BLANC};padding:10px 14px;` +
      `font-size:${TAILLE.titre};line-height:1.25;font-weight:bold;text-transform:uppercase;`,
  )}</tr>`
}

/** L'agenda du site : là où l'on choisit parmi tous les films de la semaine. */
export const AGENDA = `${SITE}/agenda/`

/**
 * L'appel au site : toute la case est cliquable. Le vert ne sert qu'à
 * acheter une place. Il mène à l'agenda, sauf quand le message ne parle
 * que d'un film : il mène alors à sa fiche (voir piqure/gabarit.ts).
 * La destination arrive déjà échappée, comme celle de lienDuFilm.
 */
export function appelAuSite(destination: string = AGENDA): string {
  return `<tr>${cellule(
    /* « CINEMINIMUM.CH &rarr; » ne se coupe pas : l'adresse et la flèche restent
       ensemble, sur la même ligne, quelle que soit la largeur. */
    `<a href="${destination}" style="display:block;color:${SUR_VERT};text-decoration:none;">` +
      `ACHETER UN BILLET SUR <span style="white-space:nowrap;">CINEMINIMUM.CH &rarr;</span></a>`,
    `background-color:${VERT};color:${SUR_VERT};padding:13px 14px;font-size:${TAILLE.titre};` +
      `line-height:1.25;font-weight:bold;text-transform:uppercase;`,
  )}</tr>`
}

/** Le pied : les contacts, l'IBAN, et l'adresse du lieu. */
export function pied(reglages: ReglagesNewsletter): string {
  const contacts = [
    reglages.telephone ? `${echapper(reglages.telephone)} (cinéma)` : null,
    reglages.telephoneBis ? `${echapper(reglages.telephoneBis)} (bureau)` : null,
    reglages.email
      ? `<a href="mailto:${echapper(reglages.email)}" style="color:${BLANC};font-weight:bold;">${echapper(reglages.email)}</a>`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return `<tr>${cellule(
    contacts +
      (reglages.iban ? `<br>IBAN ${echapper(reglages.iban)}` : '') +
      `<br>Cinéma Minimum, salle Anaïs Emery, La Case à Chocs` +
      (reglages.adresse ? `<br>${echapper(reglages.adresse.replace(/\s*\n\s*/g, ', '))}` : ''),
    `background-color:${ENCRE};color:${BLANC};padding:14px;font-size:${TAILLE.petit};line-height:1.7;`,
  )}</tr>`
}

/**
 * Le message entier autour de ses lignes. Il prend toute la largeur d'un
 * téléphone, et s'arrête à 600 px ailleurs. Outlook, qui ignore max-width,
 * reçoit sa largeur fixe par un tableau qu'il est seul à lire.
 */
export function envelopper(lignes: string): string {
  return (
    `<!--[if mso]><table role="presentation" width="${LARGEUR}" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="center" ` +
    `style="width:100%;max-width:${LARGEUR}px;margin:0 auto;border-collapse:collapse;` +
    `background-color:${PAPIER};color:${ENCRE};font-family:${POLICE};">${lignes}</table>` +
    `<!--[if mso]></td></tr></table><![endif]-->`
  )
}
