// @ts-check
/* Minimum Radio : les icônes du bureau, dessinées à la main en SVG.
   Un trait bleu marine, un aplat gris ou blanc, comme les icônes d'un
   bureau d'ordinateur des années 90. */

const TRAIT = 'stroke="#000080" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';

/** @type {Record<string, string>} */
const DESSINS = {
  cassette:
    `<rect x="3" y="7" width="26" height="18" fill="#fff" ${TRAIT}/>` +
    `<rect x="8" y="11" width="16" height="7" fill="#c0c0c0" ${TRAIT}/>` +
    `<circle cx="13" cy="14.5" r="2" fill="#fff" ${TRAIT}/><circle cx="19" cy="14.5" r="2" fill="#fff" ${TRAIT}/>` +
    `<path d="M9 25l2-5h10l2 5" fill="none" ${TRAIT}/>`,
  info:
    `<rect x="12" y="4" width="8" height="6" fill="#fff" ${TRAIT}/>` +
    `<path d="M10 13h10v11h3v4H9v-4h3v-7h-2z" fill="#fff" ${TRAIT}/>`,
  musique:
    `<path d="M12 23V8l15-3v15" fill="none" ${TRAIT}/>` +
    `<ellipse cx="9" cy="24" rx="4.5" ry="3.5" fill="#fff" ${TRAIT}/>` +
    `<ellipse cx="24" cy="21" rx="4.5" ry="3.5" fill="#fff" ${TRAIT}/>`,
  photos:
    `<rect x="3" y="5" width="26" height="22" fill="#fff" ${TRAIT}/>` +
    `<path d="M5 24l7-8 5 5 4-4 6 7z" fill="#c0c0c0" ${TRAIT}/>` +
    `<circle cx="22" cy="11" r="2.5" fill="#fff" ${TRAIT}/>`,
  reglages:
    `<circle cx="16" cy="16" r="10" fill="none" stroke="#000080" stroke-width="5" stroke-dasharray="3.9 3.9"/>` +
    `<circle cx="16" cy="16" r="8" fill="#c0c0c0" ${TRAIT}/><circle cx="16" cy="16" r="3.2" fill="#fff" ${TRAIT}/>`,
  lettre:
    `<rect x="3" y="7" width="26" height="18" fill="#fff" ${TRAIT}/>` +
    `<path d="M3 8l13 10L29 8" fill="none" ${TRAIT}/>`,
};

/**
 * Une icône en SVG, prête à poser dans la page.
 * @param {string} nom
 * @param {string} [classe]
 * @returns {string}
 */
export function icone(nom, classe = "icone") {
  const dessin = DESSINS[nom] ?? DESSINS["info"] ?? "";
  return `<svg class="${classe}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${dessin}</svg>`;
}
