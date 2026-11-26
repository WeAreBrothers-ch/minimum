/* ============================================================
   La banque de films, vérifiée.

   « Piocher » copie un film de l'autre cinéma ici. Trois promesses :

     1. un film déjà ici est reconnu — par sa marque, par son
        identifiant, ou par son titre — et ne se pioche pas deux fois ;
     2. seule la fiche du FILM est copiée : pas l'état du film chez
        l'autre, ni sa date de sortie, ni son invité ;
     3. une image qui ne se laisse pas copier n'empêche pas la fiche
        d'être créée, et c'est dit.

   Rien n'est lu ni écrit dans Sanity ici : un faux client note ce
   qu'on lui demande.

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
  return import(`data:text/javascript;base64,${Buffer.from(compile.outputFiles[0].text).toString('base64')}`)
}

const {dejaIci, ficheAPartirDe, origineDe, piocher} = await chargerModule('../sanity/minimum/banque/piocher.ts')

let echecs = 0
let reussites = 0
function verifier(intitule, obtenu, attendu) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu)
  if (ok) reussites += 1
  else {
    echecs += 1
    console.error(`✗ ${intitule}\n    obtenu  : ${JSON.stringify(obtenu)}\n    attendu : ${JSON.stringify(attendu)}`)
  }
}

const FILM = {
  _id: 'abc',
  title: '  LE GRAND BLEU ',
  director: 'Luc Besson',
  duration: 168,
  year: 1988,
  country: 'France',
  originalTitle: null,
  language: 'VF',
  subtitles: '',
  ageRating: '12/12 ans',
  typeDeFilm: 'Fiction',
  synopsis: 'Deux plongeurs.',
  trailerUrl: 'https://exemple.ch/ba',
  presseUrl: null,
  slug: 'le-grand-bleu',
  affiche: {url: 'https://cdn.exemple/affiche.jpg', nom: 'affiche.jpg', alt: 'Affiche', hotspot: {x: 0.5, y: 0.3}, crop: null},
  photos: [{url: 'https://cdn.exemple/photo.jpg', nom: 'photo.jpg', alt: null, hotspot: null, crop: null}],
  /* Ce qui tient au cinéma d'en face : ne doit PAS traverser. */
  status: 'passe',
  statuts: ['passe'],
  releaseDate: '2026-01-01',
  presence: 'le réalisateur',
  projectionDate: '2026-02-02',
}

console.log('Reconnaître un film déjà ici')
verifier('la marque « zinema:… »', origineDe(FILM), 'zinema:abc')
verifier('par sa marque', dejaIci(FILM, [{_id: 'x', title: 'Autre titre', origineBanque: 'zinema:abc'}])?._id, 'x')
verifier('par son identifiant (films recopiés le 26.11.2026)', dejaIci(FILM, [{_id: 'abc', title: 'Autre'}])?._id, 'abc')
verifier('par son titre, malgré la casse, les accents et la ponctuation', dejaIci({...FILM, title: 'Mr. Nobody Against Pûtin'}, [{_id: 'y', title: 'MR NOBODY AGAINST PUTIN'}])?._id, 'y')
verifier('un autre film n’est pas pris pour lui', dejaIci(FILM, [{_id: 'z', title: 'Le Petit Bleu'}]), null)
verifier('un film sans titre ne correspond à aucun film sans titre', dejaIci({...FILM, title: null}, [{_id: 'z', title: null}]), null)

console.log('Ce qui est copié, et ce qui ne l’est pas')
const fiche = ficheAPartirDe(FILM, 'image-affiche', ['image-photo'])
verifier('le titre est repris, sans ses espaces', fiche.title, 'LE GRAND BLEU')
verifier('la fiche du film est reprise', [fiche.director, fiche.duration, fiche.year, fiche.country, fiche.language, fiche.ageRating, fiche.typeDeFilm, fiche.synopsis, fiche.trailerUrl], ['Luc Besson', 168, 1988, 'France', 'VF', '12/12 ans', 'Fiction', 'Deux plongeurs.', 'https://exemple.ch/ba'])
verifier('l’affiche est celle d’ici, avec sa description et son point d’intérêt', fiche.poster, {_type: 'imageMinimum', asset: {_type: 'reference', _ref: 'image-affiche'}, alt: 'Affiche', hotspot: {x: 0.5, y: 0.3}})
verifier('les photos suivent', fiche.stillImages, [{_type: 'imageMinimum', _key: 'photo0', asset: {_type: 'reference', _ref: 'image-photo'}}])
verifier('l’adresse de la page suit', fiche.slug, {_type: 'slug', current: 'le-grand-bleu'})
verifier('un champ vide n’est pas écrit', ['subtitles' in fiche, 'originalTitle' in fiche, 'presseUrl' in fiche], [false, false, false])
verifier('le film arrive « À l’affiche », quel que soit son état chez l’autre', [fiche.status, fiche.statuts], ['a-laffiche', ['a-laffiche']])
verifier('ni date de sortie, ni invité, ni projection de l’autre cinéma', ['releaseDate' in fiche, 'presence' in fiche, 'projectionDate' in fiche], [false, false, false])
verifier('la marque est posée', fiche.origineBanque, 'zinema:abc')
verifier('sans affiche copiée, pas de champ affiche', 'poster' in ficheAPartirDe(FILM, null, []), false)

console.log('Piocher')
function fauxClient({refuserImage = false} = {}) {
  const journal = []
  return {
    journal,
    assets: {
      upload: async (type, corps, options) => {
        if (refuserImage) throw new Error('refus')
        journal.push(['upload', type, options.filename])
        return {_id: `image-${options.filename}`}
      },
    },
    create: async (doc) => {
      journal.push(['create', doc])
      return {_id: 'nouveau'}
    },
  }
}
const telecharger = async (url) => new Blob([url])

let client = fauxClient()
let resultat = await piocher(client, FILM, telecharger)
verifier('rend la nouvelle fiche, sans image manquante', resultat, {id: 'nouveau', imagesManquantes: 0})
verifier('copie l’affiche, puis la photo, puis crée la fiche', client.journal.map((ligne) => ligne[0]), ['upload', 'upload', 'create'])
verifier('la fiche créée porte l’affiche copiée', client.journal[2][1].poster.asset._ref, 'image-affiche.jpg')

client = fauxClient({refuserImage: true})
/* Le refus est noté dans la console du Studio : ici, on le fait taire. */
const noter = console.error
console.error = () => undefined
resultat = await piocher(client, FILM, telecharger)
console.error = noter
verifier('une image refusée n’empêche pas la fiche', [resultat.id, resultat.imagesManquantes], ['nouveau', 2])
verifier('la fiche est alors créée sans affiche', 'poster' in client.journal[0][1], false)

client = fauxClient()
resultat = await piocher(client, {...FILM, affiche: null, photos: null}, telecharger)
verifier('un film sans affiche se pioche quand même', [resultat.id, client.journal.map((l) => l[0])], ['nouveau', ['create']])

console.log(`${reussites} vérification(s) réussie(s), ${echecs} échec(s).`)
process.exit(echecs > 0 ? 1 : 0)
