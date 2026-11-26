/* Minimum : le projet Sanity du Studio.
   Minimum a son PROPRE projet, indépendant de celui de Zinéma : aucun
   contenu, aucun jeton, aucun réglage n'est partagé entre les deux. */

/** L'identifiant du projet Sanity de Minimum (sanity.io/manage). */
export const PROJET = "a-creer";

export const JEU = "production";

/** Version de l'API utilisée par les requêtes du Studio. */
export const VERSION_API = "2026-11-01";

/** Le projet de Zinéma. Ce Studio refuse de démarrer dessus. */
const PROJET_ZINEMA = "vle63mzm";

if ((PROJET as string) === PROJET_ZINEMA) {
  throw new Error(
    "Ce Studio est celui de Minimum : il ne doit jamais être branché sur le projet Sanity de Zinéma.",
  );
}
