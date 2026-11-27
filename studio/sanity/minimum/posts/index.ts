/**
 * Plugin « Posts » : un onglet à côté de « Planification », pour sortir les
 * posts Instagram du programme en un clic, sans ouvrir chaque fiche.
 * Propre à Minimum.
 */
import {ImagesIcon} from '@sanity/icons'
import {definePlugin} from 'sanity'

import {OutilPosts} from './OutilPosts'

export const posts = definePlugin({
  name: 'posts',
  tools: [
    {
      name: 'posts',
      title: 'Posts',
      icon: ImagesIcon,
      component: OutilPosts,
    },
  ],
})
