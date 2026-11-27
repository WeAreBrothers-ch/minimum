/**
 * L'arrivée automatique des films de l'autre cinéma.
 *
 * Posée autour de tout le Studio (sanity.config.ts) : dès qu'on l'ouvre,
 * puis toutes les cinq minutes, les films publiés chez l'autre et absents
 * d'ici sont créés ici, fiche et affiche copiées, et les corrections faites
 * là-bas sont reprises ici (si la fiche d'ici n'a pas été modifiée entre
 * temps). Personne n'a rien à faire. Un mot s'affiche quand un film vient
 * d'arriver ou d'être mis à jour.
 *
 * Rien n'est montré quand il n'y a rien de neuf, ni quand ça rate : l'écran
 * « Films partagés » dit où on en est, et permet de relancer.
 */
import {useToast} from '@sanity/ui'
import {useEffect} from 'react'
import {type LayoutProps, useClient} from 'sanity'

import {VERSION_API} from '../../projet'
import {annonce, annonceMiseAJour, lancerArrivee} from './arrivee'
import {ARRIVEE_AUTOMATIQUE, AUTRE, INTERVALLE_ARRIVEE} from './reglages'

function ArriveeDesFilms(): null {
  const client = useClient({apiVersion: VERSION_API})
  const toast = useToast()

  useEffect(() => {
    if (!ARRIVEE_AUTOMATIQUE) return undefined
    let arrete = false
    let minuterie: ReturnType<typeof setTimeout> | undefined

    const regarder = async () => {
      let reessayer = true
      try {
        const bilan = await lancerArrivee(client)
        if (arrete) return
        if (bilan.arrives.length > 0) {
          toast.push({
            status: bilan.imagesManquantes ? 'warning' : 'success',
            title: annonce(bilan),
            description: bilan.imagesManquantes
              ? 'La fiche est dans « Films », mais une image n’a pas suivi : ajoutez-la dans la fiche.'
              : 'Fiche et affiche sont dans « Films », pas encore à l’affiche. La Planification le propose déjà.',
            duration: 9000,
          })
        }
        if (bilan.misesAJour.length > 0) {
          toast.push({
            status: 'info',
            title: annonceMiseAJour(bilan),
            description: `La fiche a été corrigée à ${AUTRE.nom} : la correction est reprise ici. Ce qui est propre à ce cinéma (à l’affiche ou non, séances) n’a pas bougé.`,
            duration: 9000,
          })
        }
        /* Rien n'a pu être écrit (compte qui ne peut que lire, par exemple) :
           inutile d'insister toutes les cinq minutes. */
        if (bilan.rates > 0 && bilan.arrives.length === 0 && bilan.misesAJour.length === 0) reessayer = false
      } catch (cause) {
        console.error('Films partagés : l’arrivée automatique a échoué.', cause)
      }
      if (!arrete && reessayer) minuterie = setTimeout(regarder, INTERVALLE_ARRIVEE)
    }

    void regarder()
    return () => {
      arrete = true
      if (minuterie) clearTimeout(minuterie)
    }
  }, [client, toast])

  return null
}

/** Le Studio tel quel, avec l'arrivée des films qui tourne derrière. */
export function StudioAvecArrivee(props: LayoutProps) {
  return (
    <>
      <ArriveeDesFilms />
      {props.renderDefault(props)}
    </>
  )
}
