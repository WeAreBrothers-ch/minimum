/**
 * Dans la fiche d'un film arrivé de l'autre cinéma : une phrase qui le dit,
 * à la place du champ (qu'on n'a jamais à remplir).
 */
import {Card, Stack, Text} from '@sanity/ui'

import {AUTRE, ICI} from './reglages'

export function NoteFilmPartage() {
  return (
    <Card padding={3} radius={2} border tone="primary">
      <Stack space={3}>
        <Text size={1} weight="semibold">
          Cette fiche est arrivée de {AUTRE.nom}.
        </Text>
        <Text size={1}>
          Elle a été copiée ici toute seule, avec son affiche. Le film n’est montré à {ICI} que si vous le décidez :
          cochez « À l’affiche » ou « Prochainement » plus haut dans cette fiche. Il se programme déjà dans la
          Planification. Une correction faite ici ne change pas la fiche de {AUTRE.nom}, et inversement.
        </Text>
      </Stack>
    </Card>
  )
}
