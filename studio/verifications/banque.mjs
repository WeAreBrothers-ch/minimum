/* ============================================================
   Les films partagés, vérifiés.

   Un film créé chez l'autre cinéma arrive ici tout seul, et ses
   corrections aussi. Sept promesses :

     1. un film déjà ici est reconnu — par sa marque, par son
        identifiant, ou par son titre — et n'arrive pas deux fois ;
     2. seule la fiche du FILM est copiée : pas l'état du film chez
        l'autre, ni sa date de sortie, ni son invité ; et il arrive
        PAS à l'affiche ;
     3. une image qui ne se laisse pas copier n'empêche pas la fiche
        d'être créée, et c'est dit ;
     4. un film supprimé ici ne revient pas tout seul ;
     5. rien n'est jamais supprimé, et rien n'est écrit chez l'autre ;
     6. une fiche corrigée chez l'autre est corrigée ici, si celle
        d'ici n'a pas bougé : seule la description du film change,
        pas ce qui tient à ce cinéma ;
     7. une fiche modifiée ICI n'est jamais écrasée toute seule.

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

const {arriveeDesFilms, comparer, dejaIci, empreinte, faireVenir, ficheAPartirDe, ficheLiee, memeFiche, origineDe, reprendre, trier} = await chargerModule('../sanity/minimum/banque/partage.ts')

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
  affiche: {id: 'image-aaa-400x570-jpg', url: 'https://cdn.exemple/affiche.jpg', nom: 'affiche.jpg', alt: 'Affiche', hotspot: {x: 0.5, y: 0.3}, crop: null},
  photos: [{id: 'image-bbb-800x450-jpg', url: 'https://cdn.exemple/photo.jpg', nom: 'photo.jpg', alt: null, hotspot: null, crop: null}],
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

verifier('la fiche porte son repère : celle de l’autre, et celle d’ici', /^[a-z0-9]+:[a-z0-9]+$/.test(fiche.banqueEmpreinte), true)

console.log('Faire venir un film')
/* Un faux projet Sanity : il garde ses fiches comme Sanity les garde, les rend comme le
   partage les lit, et note tout ce qu'on lui demande d'écrire. Une image déposée garde
   l'identifiant qu'elle a chez l'autre (le même fichier : la même empreinte). */
const ID_IMAGE = {'https://cdn.exemple/affiche.jpg': 'image-aaa-400x570-jpg', 'https://cdn.exemple/photo.jpg': 'image-bbb-800x450-jpg', 'https://cdn.exemple/nouvelle.jpg': 'image-ccc-1000x1400-jpg'}
function lu(doc) {
  const image = (i) => (i?.asset ? {id: i.asset._ref, url: `https://ici/${i.asset._ref}`, nom: null, alt: i.alt ?? null, hotspot: i.hotspot ?? null, crop: i.crop ?? null} : null)
  const {poster, stillImages, slug, _type, status, statuts, releaseDate, presence, ...reste} = doc
  return {
    title: null, director: null, duration: null, year: null, country: null, originalTitle: null, language: null, subtitles: null,
    ageRating: null, typeDeFilm: null, synopsis: null, trailerUrl: null, presseUrl: null,
    ...reste,
    slug: slug?.current ?? null,
    affiche: image(poster),
    photos: stillImages ? stillImages.map(image) : null,
  }
}
function fauxClient({films = [], carnet = null, refuserImage = false, refuserFiche = () => false, refuserCarnet = false, refuserRetouche = false} = {}) {
  const fiches = new Map(films.map((film) => [film._id, {_type: 'film', ...film}]))
  if (carnet) fiches.set('banque.zinema', {_id: 'banque.zinema', _type: 'journalBanque', films: [...carnet]})
  const gestes = []
  return {
    gestes,
    fiches,
    carnet: () => fiches.get('banque.zinema')?.films ?? null,
    fetch: async (requete, parametres) => {
      if (parametres?.id && requete.includes('.films')) return fiches.get(parametres.id)?.films ?? null
      if (parametres?.id) return fiches.has(parametres.id) ? parametres.id : null
      return [...fiches.values()].filter((f) => f._type === 'film' && !f._id.startsWith('drafts.')).map(lu)
    },
    assets: {
      upload: async (type, corps, options) => {
        if (refuserImage) throw new Error('refus')
        gestes.push(['upload', type, options.filename])
        return {_id: ID_IMAGE[await corps.text()] ?? `image-${options.filename}`}
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
        aEcrire: {}, aVider: [], aAjouter: null,
        set: (valeurs) => (Object.assign(retouche.aEcrire, valeurs), retouche),
        unset: (champs) => (retouche.aVider.push(...champs), retouche),
        setIfMissing: () => retouche,
        insert: (ou, chemin, elements) => ((retouche.aAjouter = elements), retouche),
        commit: async () => {
          if (id === 'banque.zinema' ? refuserCarnet : refuserRetouche) throw new Error('refus')
          gestes.push(['patch', id, {set: Object.keys(retouche.aEcrire).sort(), unset: [...retouche.aVider].sort()}])
          const fiche = fiches.get(id)
          if (retouche.aAjouter) fiche.films.push(...retouche.aAjouter)
          Object.assign(fiche, retouche.aEcrire)
          for (const champ of retouche.aVider) delete fiche[champ]
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
const ecritures = (client) => client.gestes.filter((g) => g[0] !== 'upload').length

let client = fauxClient()
let resultat = await faireVenir(client, FILM, telecharger)
verifier('rend la fiche, sous l’identifiant du film, sans image manquante', resultat, {id: 'abc', imagesManquantes: 0})
verifier('copie l’affiche, puis la photo, puis crée la fiche', client.gestes.map((ligne) => ligne[0]), ['upload', 'upload', 'createIfNotExists'])
verifier('la fiche créée porte l’affiche copiée', client.gestes[2][1].poster.asset._ref, 'image-aaa-400x570-jpg')

client = fauxClient({refuserImage: true})
resultat = await sansBruit(() => faireVenir(client, FILM, telecharger))
verifier('une image refusée n’empêche pas la fiche', [resultat.id, resultat.imagesManquantes], ['abc', 2])
verifier('la fiche est alors créée sans affiche', 'poster' in client.gestes[0][1], false)

client = fauxClient()
resultat = await faireVenir(client, {...FILM, affiche: null, photos: null}, telecharger)
verifier('un film sans affiche vient quand même', [resultat.id, client.gestes.map((l) => l[0])], ['abc', ['createIfNotExists']])

client = fauxClient({films: [{_id: 'abc', title: 'Corrigé ici', status: 'a-laffiche'}]})
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
verifier('une fiche du même titre n’est pas une fiche liée', [dejaIci(B, [{_id: 'x', title: 'film b'}])?._id, ficheLiee(B, [{_id: 'x', title: 'film b'}])], ['x', null])

console.log('L’arrivée des films')
const autre = (films) => ({fetch: async () => films})

client = fauxClient({films: [{_id: 'x', title: 'film a'}]})
let bilan = await arriveeDesFilms(client, autre([A, B, C]), telecharger)
verifier('les films qui manquent arrivent, pas les autres', [bilan.arrives, bilan.misesAJour, bilan.rates, bilan.imagesManquantes], [[{id: 'b', titre: 'Film B'}, {id: 'c', titre: 'Film C'}], [], 0, 0])
verifier('ils sont ici, pas à l’affiche, avec leur marque', ['b', 'c'].map((id) => [client.fiches.get(id).status, client.fiches.get(id).origineBanque]), [['passe', 'zinema:b'], ['passe', 'zinema:c']])
verifier('la fiche du même titre, saisie ici à part, n’a pas été touchée', client.fiches.get('x'), {_type: 'film', _id: 'x', title: 'film a'})
verifier('le carnet note les trois', [...client.carnet()].sort(), ['a', 'b', 'c'])

let avant = ecritures(client)
bilan = await arriveeDesFilms(client, autre([A, B, C]), telecharger)
verifier('une deuxième arrivée ne fait rien : rien de neuf', [bilan.arrives, bilan.misesAJour, ecritures(client) - avant], [[], [], 0])

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

client = fauxClient({films: [{_id: 'a', title: 'Film A'}], carnet: ['a']})
bilan = await arriveeDesFilms(client, autre([]), telecharger)
verifier('l’autre cinéma illisible ou vide : rien ne bouge ici', [bilan.arrives, client.gestes.length, client.fiches.has('a')], [[], 0, true])

client = fauxClient({refuserFiche: () => true})
bilan = await sansBruit(() => arriveeDesFilms(client, autre([A, B, C, D, {...A, _id: 'e'}, {...A, _id: 'f'}]), telecharger))
verifier('un compte qui ne peut que lire : on s’arrête au troisième refus', bilan.rates, 3)

console.log('Une correction faite chez l’autre cinéma')
/* Le film est arrivé ; ici, on l'a mis à l'affiche, daté, et on lui a donné un invité. */
client = fauxClient()
await arriveeDesFilms(client, autre([A]), telecharger)
Object.assign(client.fiches.get('a'), {status: 'a-laffiche', statuts: ['a-laffiche'], releaseDate: '2026-12-02', presence: 'la réalisatrice'})
let ici = (await client.fetch(''))[0]
verifier('rien n’a changé depuis l’arrivée : à jour', comparer(A, ici), 'a-jour')
verifier('mettre le film à l’affiche ici n’est pas une modification de sa fiche', empreinte(ici) === empreinte(lu({...client.fiches.get('a'), status: 'passe'})), true)

const A2 = {...A, synopsis: 'Deux plongeurs, et la mer.', duration: 170, country: null, affiche: {...A.affiche, id: 'image-ccc-1000x1400-jpg', url: 'https://cdn.exemple/nouvelle.jpg'}}
verifier('l’autre cinéma corrige sa fiche : à reprendre', comparer(A2, ici), 'a-reprendre')
avant = ecritures(client)
bilan = await arriveeDesFilms(client, autre([A2]), telecharger)
let apres = client.fiches.get('a')
verifier('la correction est reprise, et annoncée', [bilan.misesAJour, bilan.arrives, bilan.rates], [[{id: 'a', titre: 'Film A'}], [], 0])
verifier('le synopsis, la durée et l’affiche sont ceux de l’autre cinéma', [apres.synopsis, apres.duration, apres.poster.asset._ref], ['Deux plongeurs, et la mer.', 170, 'image-ccc-1000x1400-jpg'])
verifier('un champ vidé là-bas est vidé ici', 'country' in apres, false)
verifier('ce qui tient à ce cinéma n’a pas bougé', [apres.status, apres.statuts, apres.releaseDate, apres.presence, apres.slug, apres.origineBanque], ['a-laffiche', ['a-laffiche'], '2026-12-02', 'la réalisatrice', {_type: 'slug', current: 'le-grand-bleu'}, 'zinema:a'])
verifier('une seule écriture, sur la fiche (pas de brouillon ici)', client.gestes.slice(-1)[0].slice(0, 2), ['patch', 'a'])
verifier('la photo, déjà ici, n’a pas été renvoyée ; la nouvelle affiche, oui', client.gestes.filter((g) => g[0] === 'upload').length, 3)
avant = ecritures(client)
bilan = await arriveeDesFilms(client, autre([A2]), telecharger)
verifier('ensuite, plus rien à faire', [bilan.misesAJour, ecritures(client) - avant, comparer(A2, (await client.fetch(''))[0])], [[], 0, 'a-jour'])

client.fiches.set('drafts.a', {...client.fiches.get('a'), _id: 'drafts.a', synopsis: 'Brouillon en cours'})
const A3 = {...A2, director: 'L. Besson'}
await arriveeDesFilms(client, autre([A3]), telecharger)
verifier('un brouillon ouvert reçoit la même correction', [client.fiches.get('a').director, client.fiches.get('drafts.a').director, client.fiches.get('drafts.a').synopsis], ['L. Besson', 'L. Besson', 'Deux plongeurs, et la mer.'])
client.fiches.delete('drafts.a')

console.log('Une fiche modifiée ici n’est jamais écrasée toute seule')
client.fiches.get('a').synopsis = 'Notre texte, écrit ici.'
ici = (await client.fetch(''))[0]
verifier('modifiée ici, pas chez l’autre : on n’y touche pas', comparer(A3, ici), 'modifiee-ici')
const A4 = {...A3, year: 1989}
verifier('modifiée des deux côtés : une personne décide', comparer(A4, ici), 'differente')
avant = ecritures(client)
bilan = await arriveeDesFilms(client, autre([A4]), telecharger)
verifier('l’arrivée n’écrit rien dessus', [bilan.misesAJour, ecritures(client) - avant, client.fiches.get('a').synopsis, client.fiches.get('a').year], [[], 0, 'Notre texte, écrit ici.', 1988])
await reprendre(client, A4, ici, telecharger)
verifier('à la demande, la fiche de l’autre cinéma est reprise', [client.fiches.get('a').synopsis, client.fiches.get('a').year, comparer(A4, (await client.fetch(''))[0])], ['Deux plongeurs, et la mer.', 1989, 'a-jour'])

/* Dans l'autre sens, plus tard : l'autre cinéma reprend NOTRE correction. Les deux fiches ont changé, pour dire la même chose. */
client.fiches.get('a').synopsis = 'Corrigé ici.'
const A5 = {...A4, synopsis: 'Corrigé ici.'}
ici = (await client.fetch(''))[0]
verifier('l’autre cinéma a repris notre correction : c’est accordé, sans rien réécrire', comparer(A5, ici), 'a-noter')
await arriveeDesFilms(client, autre([A5]), telecharger)
verifier('et c’est noté', [comparer(A5, (await client.fetch(''))[0]), client.fiches.get('a').synopsis], ['a-jour', 'Corrigé ici.'])

console.log('Les films recopiés avant le partage (sans repère)')
const copie = {_id: 'a', title: 'Film A', director: 'Luc Besson', duration: 168, year: 1988, country: 'France', language: 'VF', ageRating: '12/12 ans', typeDeFilm: 'Fiction', synopsis: 'Deux plongeurs.', trailerUrl: 'https://exemple.ch/ba', slug: {_type: 'slug', current: 'le-grand-bleu'},
  poster: {_type: 'imageMinimum', asset: {_ref: 'image-zzz-400x570-jpg'}, alt: 'Affiche'}, stillImages: [{_type: 'imageMinimum', asset: {_ref: 'image-yyy-800x450-jpg'}}], status: 'passe'}
verifier('mêmes textes, images de mêmes dimensions réenregistrées : la même fiche', [memeFiche(A, lu(copie), true), memeFiche(A, lu(copie), false), comparer(A, lu(copie))], [true, false, 'a-noter'])
client = fauxClient({films: [copie], carnet: ['a']})
bilan = await arriveeDesFilms(client, autre([A]), telecharger)
verifier('elle reçoit son repère, sans rien changer d’autre', [bilan.misesAJour, client.gestes.map((g) => [g[0], g[1], g[2]?.set]), client.fiches.get('a').poster.asset._ref], [[], [['patch', 'a', ['banqueEmpreinte']]], 'image-zzz-400x570-jpg'])
bilan = await arriveeDesFilms(client, autre([{...A, synopsis: 'Corrigé là-bas.'}]), telecharger)
verifier('et reçoit ensuite les corrections de l’autre cinéma', [bilan.misesAJour.map((f) => f.id), client.fiches.get('a').synopsis], [['a'], 'Corrigé là-bas.'])
verifier('une fiche réécrite ici avant le partage : différente, laissée telle quelle', comparer(A, lu({...copie, synopsis: 'Le texte du site.', poster: {asset: {_ref: 'image-site-607x865-jpg'}}})), 'differente')

console.log('Quand ça rate')
client = fauxClient({refuserImage: true})
client.fiches.set('a', {...ficheAPartirDe(A, 'image-aaa-400x570-jpg', ['image-bbb-800x450-jpg'])})
bilan = await sansBruit(() => arriveeDesFilms(client, autre([A2]), telecharger))
verifier('une affiche qui ne se laisse pas copier : le texte est repris, l’ancienne affiche reste', [bilan.misesAJour.length, bilan.imagesManquantes, client.fiches.get('a').synopsis, client.fiches.get('a').poster.asset._ref], [1, 1, 'Deux plongeurs, et la mer.', 'image-aaa-400x570-jpg'])
client = fauxClient({refuserRetouche: true})
client.fiches.set('a', {...ficheAPartirDe(A, 'image-aaa-400x570-jpg', ['image-bbb-800x450-jpg'])})
bilan = await sansBruit(() => arriveeDesFilms(client, autre([A2]), telecharger))
verifier('une écriture refusée : rien n’est annoncé, la fiche est intacte', [bilan.misesAJour, bilan.rates, client.fiches.get('a').synopsis], [[], 1, 'Deux plongeurs.'])

console.log(`${reussites} vérification(s) réussie(s), ${echecs} échec(s).`)
process.exit(echecs > 0 ? 1 : 0)
