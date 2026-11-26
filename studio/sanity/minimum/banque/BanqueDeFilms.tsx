/**
 * La banque de films : le catalogue de l'autre cinéma, où l'on pioche.
 *
 * Une ligne par film de l'autre cinéma. « Piocher » copie sa fiche et son
 * affiche ici : le film est prêt à être programmé, rien à retaper. Un film
 * déjà ici le dit, et mène à sa fiche.
 */
import {AddIcon, CheckmarkIcon, EditIcon, SearchIcon, SyncIcon} from '@sanity/icons'
import {createClient} from '@sanity/client'
import {Box, Button, Card, Flex, Spinner, Stack, Text, TextInput, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'

import {VERSION_API} from '../../projet'
import {
  type Ecrivain,
  type FilmDeLaBanque,
  type FilmDIci,
  REQUETE_BANQUE,
  REQUETE_ICI,
  dejaIci,
  piocher,
} from './piocher'
import {AUTRE, ICI, VERSION_API_BANQUE} from './reglages'

/* L'autre cinéma, en lecture seule : ni jeton, ni identifiants. On n'y lit
   que ce qui est publié, par l'API publique, comme son site. */
const banque = createClient({
  projectId: AUTRE.projet,
  dataset: AUTRE.jeu,
  apiVersion: VERSION_API_BANQUE,
  useCdn: true,
  withCredentials: false,
  perspective: 'published',
})

/** L'affiche en petit, pour la liste. */
function vignette(url: string): string {
  return `${url}?w=96&h=144&fit=crop&auto=format`
}

export function BanqueDeFilms() {
  const client = useClient({apiVersion: VERSION_API})
  const toast = useToast()
  const [films, setFilms] = useState<FilmDeLaBanque[] | null>(null)
  const [ici, setIci] = useState<FilmDIci[]>([])
  const [erreur, setErreur] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [enCours, setEnCours] = useState<string | null>(null)

  const charger = useCallback(() => {
    let annule = false
    setErreur(false)
    Promise.all([
      banque.fetch<FilmDeLaBanque[]>(REQUETE_BANQUE),
      client.fetch<FilmDIci[]>(REQUETE_ICI, {}, {perspective: 'published'}),
    ])
      .then(([deLaBanque, dIci]) => {
        if (annule) return
        setFilms(deLaBanque)
        setIci(dIci)
      })
      .catch((cause: unknown) => {
        if (annule) return
        console.error('Banque de films : le catalogue n’a pas pu être lu.', cause)
        setErreur(true)
      })
    return () => {
      annule = true
    }
  }, [client])

  useEffect(charger, [charger])

  const visibles = useMemo(() => {
    const mots = recherche.trim().toLowerCase()
    if (!films) return []
    if (!mots) return films
    return films.filter((film) =>
      [film.title, film.director, film.originalTitle].some((champ) => String(champ ?? '').toLowerCase().includes(mots)),
    )
  }, [films, recherche])

  const prendre = useCallback(
    async (film: FilmDeLaBanque) => {
      setEnCours(film._id)
      try {
        const {id, imagesManquantes} = await piocher(client as unknown as Ecrivain, film)
        setIci((avant) => [...avant, {_id: id, title: film.title, origineBanque: `${AUTRE.cle}:${film._id}`}])
        toast.push({
          status: imagesManquantes ? 'warning' : 'success',
          title: `« ${film.title ?? 'Film'} » est dans ${ICI}`,
          description: imagesManquantes
            ? 'Sa fiche est copiée, mais une image n’a pas suivi : ajoutez-la dans la fiche.'
            : 'Sa fiche et son affiche sont copiées. Il est « À l’affiche » : programmez-le dans la Planification.',
        })
      } catch (cause) {
        console.error('Banque de films : le film n’a pas pu être pioché.', cause)
        toast.push({
          status: 'error',
          title: 'Le film n’a pas pu être copié',
          description: 'Vérifiez la connexion et réessayez. Rien n’a été créé à moitié.',
        })
      } finally {
        setEnCours(null)
      }
    },
    [client, toast],
  )

  return (
    <Box padding={4} style={{height: '100%', overflow: 'auto'}}>
      <Stack space={4}>
        <Stack space={3}>
          <Text size={2} weight="semibold">
            Banque de films
          </Text>
          <Text size={1} muted>
            Les films saisis à {AUTRE.nom}. « Piocher » copie la fiche et l’affiche dans {ICI} : rien à retaper. Le
            film arrive « À l’affiche », prêt pour la Planification. Chaque cinéma garde ensuite sa propre fiche.
          </Text>
        </Stack>

        <Flex gap={2}>
          <Box flex={1}>
            <TextInput
              icon={SearchIcon}
              placeholder="Chercher un titre ou une réalisation"
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.currentTarget.value)}
            />
          </Box>
          <Button icon={SyncIcon} mode="ghost" text="Actualiser" onClick={charger} />
        </Flex>

        {erreur && (
          <Card padding={4} tone="critical" border radius={2}>
            <Flex align="center" justify="space-between" gap={3}>
              <Text size={1}>Le catalogue de {AUTRE.nom} n’a pas pu être lu. Vérifiez la connexion.</Text>
              <Button text="Réessayer" onClick={charger} />
            </Flex>
          </Card>
        )}
        {!erreur && films === null && (
          <Flex align="center" gap={3} padding={4}>
            <Spinner muted />
            <Text muted>Lecture du catalogue de {AUTRE.nom}…</Text>
          </Flex>
        )}
        {films !== null && visibles.length === 0 && (
          <Text size={1} muted>
            {films.length === 0 ? `${AUTRE.nom} n’a encore publié aucun film.` : 'Aucun film ne correspond à cette recherche.'}
          </Text>
        )}

        <Stack space={2}>
          {visibles.map((film) => {
            const present = dejaIci(film, ici)
            return (
              <Card key={film._id} border radius={2} padding={2} data-film-de-la-banque={film._id}>
                <Flex align="center" gap={3}>
                  <Box style={{width: 48, height: 72, background: '#e6e6e6', flexShrink: 0}}>
                    {film.affiche?.url && (
                      <img
                        src={vignette(film.affiche.url)}
                        alt=""
                        width={48}
                        height={72}
                        loading="lazy"
                        style={{display: 'block', width: 48, height: 72, objectFit: 'cover'}}
                      />
                    )}
                  </Box>
                  <Box flex={1}>
                    <Stack space={2}>
                      <Text size={1} weight="semibold">
                        {film.title ?? 'Film sans titre'}
                      </Text>
                      <Text size={1} muted>
                        {[film.director, film.year, film.duration ? `${film.duration} min` : null].filter(Boolean).join(' · ') ||
                          'Fiche incomplète'}
                      </Text>
                    </Stack>
                  </Box>
                  {present ? (
                    <Flex align="center" gap={2}>
                      <Flex align="center" gap={1}>
                        <Text size={1} muted>
                          <CheckmarkIcon />
                        </Text>
                        <Text size={1} muted>
                          Déjà dans {ICI}
                        </Text>
                      </Flex>
                      <Button
                        as={IntentLink}
                        {...{intent: 'edit', params: {id: present._id, type: 'film'}}}
                        icon={EditIcon}
                        mode="bleed"
                        fontSize={1}
                        padding={2}
                        text="Ouvrir"
                      />
                    </Flex>
                  ) : (
                    <Button
                      icon={AddIcon}
                      tone="primary"
                      text="Piocher"
                      loading={enCours === film._id}
                      disabled={enCours !== null}
                      onClick={() => prendre(film)}
                    />
                  )}
                </Flex>
              </Card>
            )
          })}
        </Stack>
      </Stack>
    </Box>
  )
}
