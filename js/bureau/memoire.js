// @ts-check
/* Minimum Radio : ce que le bureau retient d'une visite à l'autre (le
   fond d'écran, la couleur des fenêtres). Un navigateur peut refuser ou
   effacer ce stockage (navigation privée, données bloquées) : tout se lit
   et s'écrit sans jamais faire échouer la page. */

/**
 * @param {string} cle
 * @returns {string | null}
 */
export function lire(cle) {
  try {
    return window.localStorage.getItem(cle);
  } catch {
    return null;
  }
}

/**
 * @param {string} cle
 * @param {string} valeur
 * @returns {boolean}  Vrai si la valeur a bien été gardée.
 */
export function ecrire(cle, valeur) {
  try {
    window.localStorage.setItem(cle, valeur);
    return true;
  } catch {
    return false;
  }
}
