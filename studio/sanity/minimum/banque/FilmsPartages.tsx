/**
 * Les films partagés : où en est l'arrivée des films de l'autre cinéma.
 *
 * Les films arrivent tout seuls (ArriveeDesFilms) ; cet écran le montre.
 * Une ligne par film de l'autre cinéma : il est ici (et mène à sa fiche),
 * ou il a été retiré d'ici exprès (et peut être remis), ou il n'est pas
 * encore arrivé (et peut être demandé tout de suite).
 */
import {AddIcon, CheckmarkIcon, EditIcon, SearchIcon, SyncIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Spinner, Stack, Text, TextInput, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'

import {VERSION_API} from '../../projet'
import {annonce, autreCinema, lancerArrivee} from './arrivee'
import {
  type Ecrivain,
  type FilmDeLaBanque,
  type FilmDIci,
  REQUETE_BANQUE,
  REQUETE_ICI,
  REQUETE_JOURNAL,
  dejaIci,
  faireVenir,
  noterAuJournal,
} from './partage'
import {AUTRE, ICI, ID_JOURNAL} from './reglages'

/** L'affiche en petit, pour la liste. */
function vignette(url: string): string {
  return `${url}?w=96&h=144&fit=crop&auto=format`
}

export function FilmsPartages() {
  const client = useClient({apiVersion: VERSION_API})
  const toast = useToast()
  const [films, setFilms] = useState<FilmDeLaBanque[] | null>(null)
  const [ici, setIci] = useState<FilmDIci[]>([])
  const [journal, setJournal] = useState<string[]>([])
  const [erreur, setErreur] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [enCours, setEnCours] = useState<string | null>(null)
  const [arrivee, setArrivee] = useState(false)

  /** Relit les deux listes et le carnet. */
  const lire = useCallback(async () => {
    const [deLAutre, dIci, notes] = await Promise.all([
      autreCinema.fetch<FilmDeLaBanque[]>(REQUETE_BANQUE),
      client.fetch<FilmDIci[]>(REQUETE_ICI, {}, {perspective: 'published'}),
      client.fetch<string[] | null>(REQUETE_JOURNAL, {id: ID_JOURNAL}, {perspective: 'raw'}),
    ])
    setFilms(deLAutre)
    setIci(dIci)
    setJournal(notes ?? [])
  }, [client])

  /** Fait arriver ce qui manque (ou attend l'arrivée déjà en route), puis relit. */
  const synchroniser = useCallback(
    async (annoncer: boolean) => {
      setErreur(false)
      setArrivee(true)
      try {
        const bilan = await lancerArrivee(client).catch((cause: unknown) => {
          console.error('Films partagés : l’arrivée a échoué.', cause)
          return null
        })
        await lire()
        if (!annoncer) return
        if (bilan === null || bilan.rates > 0) {
          toast.push({
            status: 'error',
            title: 'Tous les films n’ont pas pu arriver',
            description: 'Vérifiez la connexion et réessayez. Rien n’est créé à moitié.',
          })
        } else if (bilan.arrives.length > 0) {
          toast.push({status: 'success', title: annonce(bilan)})
        } else {
          toast.push({status: 'success', title: `Tout est à jour : rien de neuf à ${AUTRE.nom}`})
        }
      } catch (cause) {
        console.error('Films partagés : la liste n’a pas pu être lue.', cause)
        setErreur(true)
      } finally {
        setArrivee(false)
      }
    },
    [client, lire, toast],
  )

  useEffect(() => {
    void synchroniser(false)
  }, [synchroniser])

  const visibles = useMemo(() => {
    const mots = recherche.trim().toLowerCase()
    if (!films) return []
    if (!mots) return films
    return films.filter((film) =>
      [film.title, film.director, film.originalTitle].some((champ) => String(champ ?? '').toLowerCase().includes(mots)),
    )
  }, [films, recherche])

  /** Fait venir un film à la demande : pas encore arrivé, ou retiré puis regretté. */
  const prendre = useCallback(
    async (film: FilmDeLaBanque) => {
      setEnCours(film._id)
      try {
        const {id, imagesManquantes} = await faireVenir(client as unknown as Ecrivain, film)
        if (!journal.includes(film._id)) {
          await noterAuJournal(client as unknown as Ecrivain, [film._id]).catch(() => undefined)
          setJournal((avant) => [...avant, film._id])
        }
        setIci((avant) => [...avant, {_id: id, title: film.title, origineBanque: `${AUTRE.cle}:${film._id}`}])
        toast.push({
          status: imagesManquantes ? 'warning' : 'success',
          title: `« ${film.title ?? 'Film'} » est dans ${ICI}`,
          description: imagesManquantes
            ? 'Sa fiche est copiée, mais une image n’a pas suivi : ajoutez-la dans la fiche.'
            : 'Sa fiche et son affiche sont copiées. Il n’est pas encore à l’affiche : programmez-le dans la Planification.',
        })
      } catch (cause) {
        console.error('Films partagés : le film n’a pas pu venir.', cause)
        toast.push({
          status: 'error',
          title: 'Le film n’a pas pu être copié',
          description: 'Vérifiez la connexion et réessayez. Rien n’a été créé à moitié.',
        })
      } finally {
        setEnCours(null)
      }
    },
    [client, journal, toast],
  )

  const manquants = useMemo(
    () => (films ?? []).filter((film) => !dejaIci(film, ici) && !journal.includes(film._id)).length,
    [films, ici, journal],
  )

  return (
    <Box padding={4} style={{height: '100%', overflow: 'auto'}}>
      <Stack space={4}>
        <Stack space={3}>
          <Text size={2} weight="semibold">
            Films partagés avec {AUTRE.nom}
          </Text>
          <Text size={1} muted>
            Un film créé à {AUTRE.nom} arrive ici tout seul, fiche et affiche comprises : rien à retaper, rien à
            cliquer. Il est alors dans « Films » et dans la Planification, mais pas encore à l’affiche : c’est ici
            qu’on décide de le montrer. Une correction faite ensuite dans un cinéma ne change pas la fiche de l’autre.
          </Text>
          {films !== null && !erreur && (
            <Text size={1} weight="medium" data-etat-du-partage>
              {arrivee
                ? `Arrivée des films de ${AUTRE.nom} en cours…`
                : manquants === 0
                  ? `À jour : les ${films.length} films de ${AUTRE.nom} sont connus de ${ICI}.`
                  : `${manquants} film${manquants > 1 ? 's' : ''} de ${AUTRE.nom} ${manquants > 1 ? 'ne sont' : 'n’est'} pas encore arrivé${manquants > 1 ? 's' : ''}.`}
            </Text>
          )}
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
          <Button
            icon={SyncIcon}
            mode="ghost"
            text="Synchroniser"
            loading={arrivee}
            disabled={arrivee}
            onClick={() => void synchroniser(true)}
          />
        </Flex>

        {erreur && (
          <Card padding={4} tone="critical" border radius={2}>
            <Flex align="center" justify="space-between" gap={3}>
              <Text size={1}>Les films de {AUTRE.nom} n’ont pas pu être lus. Vérifiez la connexion.</Text>
              <Button text="Réessayer" onClick={() => void synchroniser(true)} />
            </Flex>
          </Card>
        )}
        {!erreur && films === null && (
          <Flex align="center" gap={3} padding={4}>
            <Spinner muted />
            <Text muted>Lecture des films de {AUTRE.nom}…</Text>
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
            const retire = !present && journal.includes(film._id)
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
                          Dans {ICI}
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
                    <Flex align="center" gap={2}>
                      <Text size={1} muted>
                        {retire ? `Retiré de ${ICI}` : 'Pas encore arrivé'}
                      </Text>
                      <Button
                        icon={AddIcon}
                        mode={retire ? 'ghost' : 'default'}
                        tone={retire ? 'default' : 'primary'}
                        text={retire ? 'Remettre' : 'Faire venir'}
                        loading={enCours === film._id}
                        disabled={enCours !== null || arrivee}
                        onClick={() => prendre(film)}
                      />
                    </Flex>
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
