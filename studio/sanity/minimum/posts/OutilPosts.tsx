/**
 * L'onglet « Posts » : tout ce qui peut se poster dans les semaines qui
 * viennent — soirées, DJ, lives, films, événements — avec, pour chacun, le
 * visuel déjà composé et deux boutons : « Post » et « Story ». Un clic
 * enregistre l'image et copie la légende ; il ne reste qu'à ouvrir Instagram.
 *
 * Rien à saisir ici : tout vient des fiches publiées. Pour retoucher une
 * légende ou choisir le format carré, « Ouvrir la fiche » mène à son onglet
 * Instagram.
 */
import {DownloadIcon, EditIcon, SyncIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Heading, Spinner, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'

import {VERSION_API} from '../../projet'
import {jourEnLettres} from '../dates'
import {copier, fabriquerImage, telecharger} from '../insta/partage'
import {type PostDuProgramme, type Rubrique, chargerProgrammeAPoster} from '../insta/requetes'
import {type Format, dessiner} from '../insta/rendu'

/** Compose l'aperçu d'un post, une image après l'autre pour ne pas figer le Studio. */
let file: Promise<unknown> = Promise.resolve()
function composerApercu(post: PostDuProgramme): Promise<string> {
  const suivante = file.then(async () => {
    const canevas = document.createElement('canvas')
    await dessiner(canevas, post.visuel, 'post')
    return new Promise<string>((reussite, echec) =>
      canevas.toBlob(
        (blob) => (blob ? reussite(URL.createObjectURL(blob)) : echec(new Error('Aperçu impossible.'))),
        'image/jpeg',
        0.8,
      ),
    )
  })
  file = suivante.catch(() => undefined)
  return suivante
}

function Apercu({post}: {post: PostDuProgramme}) {
  const [adresse, setAdresse] = useState<string | null>(null)
  const [echec, setEchec] = useState(false)

  useEffect(() => {
    let annule = false
    let cree: string | null = null
    composerApercu(post)
      .then((url) => {
        cree = url
        if (annule) URL.revokeObjectURL(url)
        else setAdresse(url)
      })
      .catch((cause: unknown) => {
        console.error("Minimum : l'aperçu du post n'a pas pu être composé.", cause)
        if (!annule) setEchec(true)
      })
    return () => {
      annule = true
      if (cree) URL.revokeObjectURL(cree)
    }
  }, [post])

  return (
    <Box style={{aspectRatio: '4 / 5', background: '#000', position: 'relative'}}>
      {adresse ? (
        <img
          src={adresse}
          alt={`Aperçu du post : ${post.visuel.titre}`}
          style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover'}}
        />
      ) : (
        <Flex align="center" justify="center" style={{position: 'absolute', inset: 0}}>
          {echec ? (
            <Text size={1} style={{color: '#fff'}}>
              Aperçu indisponible
            </Text>
          ) : (
            <Spinner />
          )}
        </Flex>
      )}
    </Box>
  )
}

function CartePost({post}: {post: PostDuProgramme}) {
  const toast = useToast()
  const [occupe, setOccupe] = useState<Format | null>(null)

  const sortir = useCallback(
    async (format: Format) => {
      setOccupe(format)
      try {
        telecharger(await fabriquerImage(post.visuel, format, post.fichier))
        const copiee = await copier(post.legende)
        toast.push({
          status: copiee ? 'success' : 'warning',
          title: copiee ? 'Image enregistrée, légende copiée' : 'Image enregistrée',
          description: copiee
            ? 'Ouvrez Instagram, choisissez l’image, puis collez la légende.'
            : 'Le navigateur a refusé de copier la légende : ouvrez la fiche, onglet Instagram.',
        })
      } catch (cause) {
        console.error("Minimum : le post n'a pas pu être préparé.", cause)
        toast.push({
          status: 'error',
          title: 'Le post n’a pas pu être préparé',
          description: 'Vérifiez la connexion et réessayez.',
        })
      } finally {
        setOccupe(null)
      }
    },
    [post, toast],
  )

  return (
    <Card border radius={2} overflow="hidden" data-post={post.cle}>
      <Apercu post={post} />
      <Stack space={3} padding={3}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            {post.visuel.titre}
          </Text>
          <Text size={1} muted>
            {[jourEnLettres(post.jour), post.visuel.etiquette?.texte].filter(Boolean).join(' · ') || 'Sans date'}
          </Text>
        </Stack>
        <Flex gap={2}>
          <Box flex={1}>
            <Button
              icon={DownloadIcon}
              tone="primary"
              text="Post"
              style={{width: '100%'}}
              disabled={occupe !== null}
              loading={occupe === 'post'}
              onClick={() => sortir('post')}
            />
          </Box>
          <Box flex={1}>
            <Button
              icon={DownloadIcon}
              mode="ghost"
              text="Story"
              style={{width: '100%'}}
              disabled={occupe !== null}
              loading={occupe === 'story'}
              onClick={() => sortir('story')}
            />
          </Box>
        </Flex>
        <Button
          as={IntentLink}
          {...{intent: 'edit', params: {id: post.id, type: post.type}}}
          icon={EditIcon}
          mode="bleed"
          fontSize={1}
          padding={2}
          text="Ouvrir la fiche"
        />
        {post.conseils.length > 0 && (
          <Text size={0} muted>
            {post.conseils[0]}
          </Text>
        )}
      </Stack>
    </Card>
  )
}

export function OutilPosts() {
  const client = useClient({apiVersion: VERSION_API})
  const [rubriques, setRubriques] = useState<Rubrique[] | null>(null)
  const [erreur, setErreur] = useState(false)

  const charger = useCallback(() => {
    let annule = false
    setErreur(false)
    setRubriques(null)
    chargerProgrammeAPoster(client)
      .then((lu) => {
        if (!annule) setRubriques(lu)
      })
      .catch((cause: unknown) => {
        if (annule) return
        console.error("Minimum : le programme à poster n'a pas pu être lu.", cause)
        setErreur(true)
      })
    return () => {
      annule = true
    }
  }, [client])

  useEffect(charger, [charger])

  return (
    <Box padding={4} style={{height: '100%', overflow: 'auto'}}>
      <Stack space={5}>
        <Flex align="flex-start" justify="space-between" gap={3} wrap="wrap">
          <Stack space={3}>
            <Heading as="h1" size={2}>
              Posts Instagram
            </Heading>
            <Text size={1} muted>
              Les quatre semaines qui viennent. « Post » ou « Story » : l’image est enregistrée et sa légende copiée.
              Il ne reste qu’à ouvrir Instagram et coller.
            </Text>
          </Stack>
          <Button icon={SyncIcon} mode="ghost" text="Actualiser" onClick={charger} />
        </Flex>

        {erreur && (
          <Card padding={4} tone="critical" border radius={2}>
            <Flex align="center" justify="space-between" gap={3}>
              <Text>Le programme n’a pas pu être lu. Vérifiez la connexion.</Text>
              <Button text="Réessayer" onClick={charger} />
            </Flex>
          </Card>
        )}
        {!erreur && rubriques === null && (
          <Flex align="center" gap={3} padding={4}>
            <Spinner muted />
            <Text muted>Lecture du programme…</Text>
          </Flex>
        )}

        {rubriques?.map((rubrique) => (
          <Stack space={4} key={rubrique.cle} data-rubrique={rubrique.cle}>
            <Heading as="h2" size={1}>
              {rubrique.titre}
            </Heading>
            {rubrique.posts.length === 0 ? (
              <Text size={1} muted>
                {rubrique.vide}
              </Text>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16, alignItems: 'start'}}>
                {rubrique.posts.map((post) => (
                  <CartePost key={post.cle} post={post} />
                ))}
              </div>
            )}
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}
