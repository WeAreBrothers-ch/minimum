/* ============================================================
   La Planification de Minimum, avec UNE salle de cinéma.

   Le code de la Planification vient du Studio de Zinéma, écrit pour
   deux salles (Salle 1, Salle 2) et le Hall-Bar. Minimum a une salle
   et le Club. Ce fichier vérifie que tout ce qui compose une semaine
   tient debout avec une seule salle :

     1. la grille compte quatorze cases (deux vagues par jour) ;
     2. une semaine tirée au sort la remplit, toujours dans « Salle » ;
     3. jamais deux séances qui se chevauchent ;
     4. 19 h puis 21 h au plus tôt ; le dimanche 17 h puis 19 h ;
     5. chaque film reçoit à peu près le même nombre de séances ;
     6. ce qui est déjà programmé n'est ni déplacé ni recouvert ;
     7. aucune « autre salle » n'est proposée : le Club n'est pas une
        salle de la grille.

   Le tirage est aléatoire : chaque cas est rejoué deux cents fois,
   avec un hasard reproductible.

   Pour lancer :  npm test
   ============================================================ */
import {build} from 'esbuild'

async function chargerModule(chemin) {
  const compile = await build({
    entryPoints: [new URL(chemin, import.meta.url).pathname],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  })
  const code = compile.outputFiles[0].text
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
}

const {SALLES} = await chargerModule('../sanity/salles.ts')
const {composerLaSemaine} = await chargerModule('../sanity/plugins/planification/utils/generation-semaine.ts')
const {CRENEAUX_PAR_SEMAINE, SALLES_STANDARD, SALLE_EVENEMENT, vagueDeLaSeance} = await chargerModule(
  '../sanity/plugins/planification/utils/creneaux-standards.ts',
)
const {intervallesSeChevauchent} = await chargerModule('../sanity/plugins/planification/utils/conflits.ts')
const {attribuerLesSalles, autreSalle} = await chargerModule('../sanity/plugins/planification/utils/salles-attitrees.ts')

function hasard(graine) {
  let etat = graine >>> 0
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MERCREDI = '2026-12-02'
const DIMANCHE = '2026-12-06'
const TIRAGES = 200
/* Des durées variées, dont deux films de plus de deux heures : ce sont eux
   qui repoussent la séance de 21 h. */
const DUREES = [96, 112, 140, 105, 163, 88]
const film = (numero) => ({_id: `film-${numero}`, titre: `Film ${numero}`, duree: DUREES[(numero - 1) % DUREES.length], statut: 'a-laffiche'})
const dureeDe = (filmId) => film(Number(filmId.replace('film-', ''))).duree
const minutes = (heure) => Number(heure.slice(0, 2)) * 60 + Number(heure.slice(3))

let echecs = 0
let reussites = 0
function verifier(intitule, condition, detail = '') {
  if (condition) {
    reussites += 1
    return
  }
  echecs += 1
  if (echecs <= 12) console.error(`✗ ${intitule}${detail ? `\n    ${detail}` : ''}`)
}

verifier('Les espaces de Minimum : la Salle et le Club', JSON.stringify(SALLES) === '["Salle","Club"]', JSON.stringify(SALLES))
verifier('La grille ne tient que la Salle', JSON.stringify(SALLES_STANDARD) === '["Salle"]' && SALLE_EVENEMENT === 'Club')
verifier('Quatorze cases par semaine : deux vagues par jour, une salle', CRENEAUX_PAR_SEMAINE === 14, String(CRENEAUX_PAR_SEMAINE))
verifier('La Salle n’a pas d’« autre salle »', autreSalle('Salle') === null, String(autreSalle('Salle')))
verifier('Le Club non plus', autreSalle('Club') === null, String(autreSalle('Club')))

for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const films = [1, 2, 3, 4].map(film)
  const semaine = composerLaSemaine({debutSemaine: MERCREDI, films, seancesExistantes: [], dejaProgrammees: {}}, hasard(graine))
  const detail = `graine ${graine}`

  verifier('La semaine est remplie entièrement', semaine.length === CRENEAUX_PAR_SEMAINE, `${detail} : ${semaine.length} séances`)
  verifier('Toutes les séances sont dans la Salle', semaine.every((s) => s.salle === 'Salle'), detail)

  const cases = new Set(semaine.map((s) => `${s.date}|${vagueDeLaSeance(s)}`))
  verifier('Une seule séance par case', cases.size === semaine.length, detail)

  let chevauchement = null
  for (let i = 0; i < semaine.length && !chevauchement; i += 1) {
    for (let j = i + 1; j < semaine.length; j += 1) {
      const a = semaine[i]
      const b = semaine[j]
      if (a.date === b.date && intervallesSeChevauchent(a.heure, dureeDe(a.filmId), b.heure, dureeDe(b.filmId))) {
        chevauchement = `${a.date} : ${a.heure} (${dureeDe(a.filmId)} min) et ${b.heure}`
      }
    }
  }
  verifier('Aucune séance n’en chevauche une autre', chevauchement === null, `${detail} : ${chevauchement}`)

  for (const date of new Set(semaine.map((s) => s.date))) {
    const duJour = semaine.filter((s) => s.date === date).sort((a, b) => a.heure.localeCompare(b.heure))
    const [premiere, seconde] = duJour
    const debut = date === DIMANCHE ? '17:00' : '19:00'
    const auPlusTot = date === DIMANCHE ? '19:00' : '21:00'
    verifier('La première vague part à l’heure (19 h, 17 h le dimanche)', premiere.heure === debut, `${detail} ${date} : ${premiere.heure}`)
    if (seconde) {
      const finDuPremier = minutes(premiere.heure) + dureeDe(premiere.filmId)
      verifier(
        'La seconde part à 21 h au plus tôt (19 h le dimanche), après la fin du premier film',
        seconde.heure >= auPlusTot && minutes(seconde.heure) >= finDuPremier && minutes(seconde.heure) - finDuPremier < 15 + Math.max(0, minutes(auPlusTot) - finDuPremier),
        `${detail} ${date} : ${premiere.heure} (${dureeDe(premiere.filmId)} min) puis ${seconde.heure}`,
      )
      verifier('Elle part au quart d’heure', minutes(seconde.heure) % 15 === 0, `${detail} ${date} : ${seconde.heure}`)
    }
  }

  const parFilm = new Map()
  for (const s of semaine) parFilm.set(s.filmId, (parFilm.get(s.filmId) ?? 0) + 1)
  const comptes = films.map((f) => parFilm.get(f._id) ?? 0)
  verifier('Chaque film reçoit à peu près le même nombre de séances', Math.max(...comptes) - Math.min(...comptes) <= 1, `${detail} : ${comptes.join(', ')}`)

  const attribuees = attribuerLesSalles(films.map((f) => f._id), {semaine: [], semainePrecedente: []}, hasard(graine))
  verifier('Chaque film est attribué à la Salle', [...attribuees.values()].every((salle) => salle === 'Salle'), detail)
}

/* Ce qui est déjà programmé reste où il est. */
for (let graine = 1; graine <= TIRAGES; graine += 1) {
  const existantes = [
    {_id: 'e1', date: MERCREDI, heure: '19:00', salle: 'Salle', filmId: 'film-5', filmTitre: 'Film 5', filmDuree: 163},
    {_id: 'e2', date: '2026-12-04', heure: '21:00', salle: 'Salle', filmId: 'film-1', filmTitre: 'Film 1', filmDuree: 96},
    /* Une projection particulière au Club : hors de la grille, jamais déplacée. */
    {_id: 'e3', date: '2026-12-05', heure: '18:00', salle: 'Club', filmId: 'film-2', filmTitre: 'Film 2', filmDuree: 112},
  ]
  const semaine = composerLaSemaine({debutSemaine: MERCREDI, films: [1, 2, 3].map(film), seancesExistantes: existantes, dejaProgrammees: {}}, hasard(graine))
  const detail = `graine ${graine}`
  verifier('Les cases déjà prises ne sont pas recouvertes', semaine.length === CRENEAUX_PAR_SEMAINE - 2, `${detail} : ${semaine.length} séances`)
  verifier(
    'Rien n’est posé sur une séance existante',
    !semaine.some((s) => (s.date === MERCREDI && vagueDeLaSeance(s) === 0) || (s.date === '2026-12-04' && vagueDeLaSeance(s) === 1)),
    detail,
  )
  const apresLeLong = semaine.find((s) => s.date === MERCREDI)
  verifier(
    'Derrière un film de 2 h 43 à 19 h, la séance suivante part à 21:45',
    apresLeLong?.heure === '21:45',
    `${detail} : ${apresLeLong?.heure}`,
  )
  verifier('Rien n’est tiré au sort dans le Club', semaine.every((s) => s.salle === 'Salle'), detail)
}

verifier('Sans film, rien n’est créé', composerLaSemaine({debutSemaine: MERCREDI, films: [], seancesExistantes: []}).length === 0)

console.log(`${reussites} vérification(s) réussie(s), ${echecs} échec(s).`)
process.exit(echecs > 0 ? 1 : 0)
