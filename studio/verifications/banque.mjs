/* ============================================================
   Les films partagés, vérifiés.

   Un film créé chez l'autre cinéma arrive ici tout seul. Cinq
   promesses :

     1. un film déjà ici est reconnu — par sa marque, par son
        identifiant, ou par son titre — et n'arrive pas deux fois ;
     2. seule la fiche du FILM est copiée : pas l'état du film chez
        l'autre, ni sa date de sortie, ni son invité ; et il arrive
        PAS à l'affiche ;
     3. une image qui ne se laisse pas copier n'empêche pas la fiche
        d'être créée, et c'est dit ;
     4. un film supprimé ici ne revient pas tout seul ;
     5. rien n'est jamais modifié ni supprimé : on ne fait que créer
        ce qui manque.

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

const {arriveeDesFilms, dejaIci, faireVenir, ficheAPartirDe, origineDe, trier} = await chargerModule('../sanity/minimum/banque/partage.ts')

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
verifier('par son identifiant (un film arrive avec celui qu’il a chez l’autre)', dejaIci(FILM, [{_id: 'abc', title: 'Autre'}])?._id, 'abc')
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
verifier('le film arrive PAS à l’affiche, quel que soit son état chez l’autre', [fiche.status, fiche.statuts], ['passe', ['passe']])
verifier('la fiche garde l’identifiant du film chez l’autre', fiche._id, 'abc')
verifier('ni date de sortie, ni invité, ni projection de l’autre cinéma', ['releaseDate' in fiche, 'presence' in fiche, 'projectionDate' in fiche], [false, false, false])
verifier('la marque est posée', fiche.origineBanque, 'zinema:abc')
verifier('sans affiche copiée, pas de champ affiche', 'poster' in ficheAPartirDe(FILM, null, []), false)

console.log('Faire venir un film')
/* Un faux projet Sanity : il garde ses fiches, et note tout ce qu'on lui demande d'écrire. */
function fauxClient({films = [], carnet = null, refuserImage = false, refuserFiche = () => false, refuserCarnet = false} = {}) {
  const fiches = new Map(films.map((film) => [film._id, film]))
  if (carnet) fiches.set('banque.zinema', {_id: 'banque.zinema', _type: 'journalBanque', films: [...carnet]})
  const gestes = []
  return {
    gestes,
    fiches,
    carnet: () => fiches.get('banque.zinema')?.films ?? null,
    fetch: async (requete, parametres) => {
      if (parametres?.id) return fiches.get(parametres.id)?.films ?? null
      return [...fiches.values()].filter((fiche) => fiche._type === 'film').map(({_id, title, origineBanque}) => ({_id, title, origineBanque}))
    },
    assets: {
      upload: async (type, corps, options) => {
        if (refuserImage) throw new Error('refus')
        gestes.push(['upload', type, options.filename])
        return {_id: `image-${options.filename}`}
      },
    },
    createIfNotExists: async (doc) => {
      if (doc._type === 'film' && refuserFiche(doc)) throw new Error('refus')
      if (doc._type !== 'film' && refuserCarnet) throw new Error('refus')
      gestes.push(['createIfNotExists', doc])
      if (!fiches.has(doc._id)) fiches.set(doc._id, doc)
      return {_id: doc._id}
    },
    patch: (id) => {
      const retouche = {
        setIfMissing: () => retouche,
        insert: (ou, chemin, elements) => {
          retouche.elements = [ou, chemin, elements]
          return retouche
        },
        commit: async () => {
          if (refuserCarnet) throw new Error('refus')
          gestes.push(['patch', id, retouche.elements])
          fiches.get(id).films.push(...retouche.elements[2])
        },
      }
      return retouche
    },
  }
}
const telecharger = async (url) => new Blob([url])
const sansBruit = async (action) => {
  /* Un refus est noté dans la console du Studio : ici, on le fait taire. */
  const noter = console.error
  console.error = () => undefined
  try {
    return await action()
  } finally {
    console.error = noter
  }
}

let client = fauxClient()
let resultat = await faireVenir(client, FILM, telecharger)
verifier('rend la fiche, sous l’identifiant du film, sans image manquante', resultat, {id: 'abc', imagesManquantes: 0})
verifier('copie l’affiche, puis la photo, puis crée la fiche', client.gestes.map((ligne) => ligne[0]), ['upload', 'upload', 'createIfNotExists'])
verifier('la fiche créée porte l’affiche copiée', client.gestes[2][1].poster.asset._ref, 'image-affiche.jpg')

client = fauxClient({refuserImage: true})
resultat = await sansBruit(() => faireVenir(client, FILM, telecharger))
verifier('une image refusée n’empêche pas la fiche', [resultat.id, resultat.imagesManquantes], ['abc', 2])
verifier('la fiche est alors créée sans affiche', 'poster' in client.gestes[0][1], false)

client = fauxClient()
resultat = await faireVenir(client, {...FILM, affiche: null, photos: null}, telecharger)
verifier('un film sans affiche vient quand même', [resultat.id, client.gestes.map((l) => l[0])], ['abc', ['createIfNotExists']])

client = fauxClient({films: [{_id: 'abc', _type: 'film', title: 'Corrigé ici', status: 'a-laffiche'}]})
await faireVenir(client, FILM, telecharger)
verifier('une fiche qui existe déjà sous cet identifiant n’est pas écrasée', [client.fiches.get('abc').title, client.fiches.get('abc').status], ['Corrigé ici', 'a-laffiche'])

console.log('Trier les films de l’autre cinéma')
const A = {...FILM, _id: 'a', title: 'Film A'}
const B = {...FILM, _id: 'b', title: 'Film B'}
const C = {...FILM, _id: 'c', title: 'Film C'}
const D = {...FILM, _id: 'd', title: 'Film D'}
let tri = trier([A, B, C, D], [{_id: 'a', title: 'Film A'}, {_id: 'x', title: 'film b'}], ['a', 'c'])
verifier('à faire venir : ni ici, ni au carnet', tri.aFaireVenir.map((f) => f._id), ['d'])
verifier('à noter : ici, pas encore au carnet (même reconnu par son titre)', tri.aNoter, ['b'])
verifier('retiré exprès : au carnet, plus ici', tri.retires.map((f) => f._id), ['c'])
verifier('sans carnet, tout ce qui manque vient', trier([A, B], [], null).aFaireVenir.map((f) => f._id), ['a', 'b'])

console.log('L’arrivée des films')
const autre = (films) => ({fetch: async () => films})

client = fauxClient({films: [{_id: 'a', _type: 'film', title: 'Film A'}]})
let bilan = await arriveeDesFilms(client, autre([A, B, C]), telecharger)
verifier('les films qui manquent arrivent, pas les autres', [bilan.arrives, bilan.rates, bilan.imagesManquantes], [[{id: 'b', titre: 'Film B'}, {id: 'c', titre: 'Film C'}], 0, 0])
verifier('ils sont ici, pas à l’affiche, avec leur marque', ['b', 'c'].map((id) => [client.fiches.get(id).status, client.fiches.get(id).origineBanque]), [['passe', 'zinema:b'], ['passe', 'zinema:c']])
verifier('le film déjà ici n’a pas été touché', client.fiches.get('a'), {_id: 'a', _type: 'film', title: 'Film A'})
verifier('le carnet note les trois', [...client.carnet()].sort(), ['a', 'b', 'c'])
verifier('seules des créations (et le carnet) ont été écrites', [...new Set(client.gestes.map((g) => g[0]))].sort(), ['createIfNotExists', 'patch', 'upload'])

const avant = client.gestes.length
bilan = await arriveeDesFilms(client, autre([A, B, C]), telecharger)
verifier('une deuxième arrivée ne fait rien : rien de neuf', [bilan.arrives, client.gestes.length - avant], [[], 0])

client.fiches.delete('b')
bilan = await arriveeDesFilms(client, autre([A, B, C]), telecharger)
verifier('un film supprimé ici ne revient pas tout seul', [bilan.arrives, client.fiches.has('b')], [[], false])
await faireVenir(client, B, telecharger)
verifier('mais il se remet à la demande', client.fiches.has('b'), true)

bilan = await arriveeDesFilms(client, autre([A, B, C, D]), telecharger)
verifier('un film créé ensuite chez l’autre arrive à son tour', bilan.arrives, [{id: 'd', titre: 'Film D'}])

client = fauxClient({refuserFiche: (doc) => doc._id === 'b'})
bilan = await sansBruit(() => arriveeDesFilms(client, autre([A, B]), telecharger))
verifier('un film qui rate n’empêche pas les autres', [bilan.arrives.map((f) => f.id), bilan.rates], [['a'], 1])
verifier('et n’est pas noté au carnet : il sera retenté', client.carnet(), ['a'])
client = fauxClient({films: [...client.fiches.values()].filter((f) => f._type === 'film'), carnet: client.carnet()})
bilan = await arriveeDesFilms(client, autre([A, B]), telecharger)
verifier('la fois suivante, il arrive', bilan.arrives.map((f) => f.id), ['b'])

client = fauxClient({refuserCarnet: true})
bilan = await sansBruit(() => arriveeDesFilms(client, autre([A]), telecharger))
verifier('un carnet qui ne s’écrit pas ne fait pas perdre l’arrivée', [bilan.arrives.map((f) => f.id), client.fiches.has('a')], [['a'], true])

client = fauxClient({films: [{_id: 'a', _type: 'film', title: 'Film A'}], carnet: ['a']})
bilan = await arriveeDesFilms(client, autre([]), telecharger)
verifier('l’autre cinéma illisible ou vide : rien ne bouge ici', [bilan.arrives, client.gestes.length, client.fiches.has('a')], [[], 0, true])

console.log(`${reussites} vérification(s) réussie(s), ${echecs} échec(s).`)
process.exit(echecs > 0 ? 1 : 0)
