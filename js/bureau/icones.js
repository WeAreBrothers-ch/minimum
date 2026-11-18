// @ts-check
/* Minimum Radio : les icônes du bureau, dessinées à la main en SVG.
   Un trait de la couleur du texte, deux aplats pris dans le thème du bureau
   (bureau.css) : .f, le fond des cases, et .g, la couleur d'accent. */

const TRAIT = 'stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';

/** @type {Record<string, string>} */
const DESSINS = {
  cassette:
    `<rect x="3" y="7" width="26" height="18" class="f" ${TRAIT}/>` +
    `<rect x="8" y="11" width="16" height="7" class="g" ${TRAIT}/>` +
    `<circle cx="13" cy="14.5" r="2" class="f" ${TRAIT}/><circle cx="19" cy="14.5" r="2" class="f" ${TRAIT}/>` +
    `<path d="M9 25l2-5h10l2 5" fill="none" ${TRAIT}/>`,
  info:
    `<rect x="12" y="4" width="8" height="6" class="f" ${TRAIT}/>` +
    `<path d="M10 13h10v11h3v4H9v-4h3v-7h-2z" class="f" ${TRAIT}/>`,
  musique:
    `<path d="M12 23V8l15-3v15" fill="none" ${TRAIT}/>` +
    `<ellipse cx="9" cy="24" rx="4.5" ry="3.5" class="f" ${TRAIT}/>` +
    `<ellipse cx="24" cy="21" rx="4.5" ry="3.5" class="f" ${TRAIT}/>`,
  photos:
    `<rect x="3" y="5" width="26" height="22" class="f" ${TRAIT}/>` +
    `<path d="M5 24l7-8 5 5 4-4 6 7z" class="g" ${TRAIT}/>` +
    `<circle cx="22" cy="11" r="2.5" class="f" ${TRAIT}/>`,
  reglages:
    `<circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="3.9 3.9"/>` +
    `<circle cx="16" cy="16" r="8" class="g" ${TRAIT}/><circle cx="16" cy="16" r="3.2" class="f" ${TRAIT}/>`,
  lettre:
    `<rect x="3" y="7" width="26" height="18" class="f" ${TRAIT}/>` +
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
