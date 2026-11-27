// @ts-check
/* Minimum : la page Infos. Son seul mouvement : le bandeau des
   remerciements, qu’on fait défiler à la main et qui revient sans fin.

   La liste des noms est recopiée de part et d’autre (les copies sont
   cachées aux lecteurs d’écran). On se tient vers la copie du milieu ;
   arrivé trop près d’un bord, ou dès que le défilement s’arrête loin du
   milieu, on saute d’un nombre entier de listes : le contenu étant le
   même, le saut ne se voit pas. Au doigt et au pavé, le défilement est
   celui du navigateur ; à la souris, on tire le bandeau. */

const COPIES = 9;
const CENTRE = 4;
const ATTENTE_ARRET = 140;

/**
 * Remplit la page Infos. Renvoie de quoi la démonter.
 * @returns {() => void}
 */
export function initInfos() {
  const defile = document.querySelector(".merci__defile");
  const liste = defile?.querySelector(".merci__liste");
  if (!(defile instanceof HTMLElement) || !(liste instanceof HTMLElement)) return () => {};

  /* La piste : les copies, et la liste d’origine au milieu. */
  const piste = document.createElement("div");
  piste.className = "merci__piste";
  for (let i = 0; i < COPIES; i++) {
    if (i === CENTRE) {
      piste.append(liste);
      continue;
    }
    const copie = /** @type {HTMLElement} */ (liste.cloneNode(true));
    copie.setAttribute("aria-hidden", "true");
    piste.append(copie);
  }
  defile.append(piste);

  /** La largeur d’une liste, mesurée sur la copie suivante (joints compris). */
  const cycle = () => {
    const suivante = piste.children[CENTRE + 1];
    return suivante instanceof HTMLElement ? suivante.offsetLeft - liste.offsetLeft : 0;
  };

  const auMilieu = () => {
    defile.scrollLeft = liste.offsetLeft;
  };

  /* Revient vers le milieu, d’un nombre entier de listes. */
  const recentrer = () => {
    const c = cycle();
    if (c <= 0) return;
    const x = defile.scrollLeft - liste.offsetLeft;
    if (Math.abs(x) < c) return;
    defile.scrollLeft = liste.offsetLeft + (((x % c) + c) % c);
  };

  let minuterie = 0;
  let enAttente = false;
  const auDefilement = () => {
    window.clearTimeout(minuterie);
    minuterie = window.setTimeout(recentrer, ATTENTE_ARRET);
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(() => {
      enAttente = false;
      const c = cycle();
      const max = defile.scrollWidth - defile.clientWidth;
      if (defile.scrollLeft < c || defile.scrollLeft > max - c) recentrer();
    });
  };

  /* À la souris : on tire le bandeau. */
  let tire = false;
  let departX = 0;
  let departScroll = 0;
  /** @param {PointerEvent} e */
  const auAppui = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    tire = true;
    departX = e.clientX;
    departScroll = defile.scrollLeft;
    defile.dataset.tire = "true";
    defile.setPointerCapture(e.pointerId);
  };
  /** @param {PointerEvent} e */
  const auMouvement = (e) => {
    if (!tire) return;
    defile.scrollLeft = departScroll - (e.clientX - departX);
  };
  /** @param {PointerEvent} e */
  const auRelache = (e) => {
    if (!tire) return;
    tire = false;
    delete defile.dataset.tire;
    if (defile.hasPointerCapture(e.pointerId)) defile.releasePointerCapture(e.pointerId);
    recentrer();
  };

  /* La largeur change (rotation, police chargée) : on se recale au milieu. */
  const observateur = new ResizeObserver(() => recentrer());

  auMilieu();
  defile.addEventListener("scroll", auDefilement, { passive: true });
  defile.addEventListener("pointerdown", auAppui);
  defile.addEventListener("pointermove", auMouvement);
  defile.addEventListener("pointerup", auRelache);
  defile.addEventListener("pointercancel", auRelache);
  observateur.observe(liste);
  document.fonts?.ready.then(auMilieu).catch(() => {});

  return () => {
    window.clearTimeout(minuterie);
    defile.removeEventListener("scroll", auDefilement);
    defile.removeEventListener("pointerdown", auAppui);
    defile.removeEventListener("pointermove", auMouvement);
    defile.removeEventListener("pointerup", auRelache);
    defile.removeEventListener("pointercancel", auRelache);
    observateur.disconnect();
  };
}
