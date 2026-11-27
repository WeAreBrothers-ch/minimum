// @ts-check
/* Minimum : la page Infos. Son seul mouvement : le bandeau MERCI, une
   boucle sans fin qu’on lance (revu le 27.11.2026 : « que la boucle on
   puisse la lancer, que le scroll soit très dynamique »).

   On tire le bandeau (doigt, souris, stylet) ; lâché, il garde son élan et
   ralentit peu à peu, comme une roue qu’on a lancée. La molette ou le pavé
   (gestes horizontaux) et les flèches du clavier le poussent aussi. Les
   noms restent droits, quelle que soit la vitesse. Quand
   le bandeau arrive dans l’écran la première fois, il part de lui-même,
   d’une petite poussée, pour montrer qu’il bouge.

   La liste des noms est recopiée autant qu’il faut pour couvrir le bandeau
   (copies cachées aux lecteurs d’écran) ; la position revient dans un seul
   tour de liste, le saut ne se voit pas. Mouvement réduit demandé : on
   tire toujours le bandeau, mais sans élan ni départ seul. */

/** Perte de vitesse par image (à 60 images par seconde) : l’élan dure. */
const FROTTEMENT = 0.965;
/** En dessous (pixels par milliseconde), le bandeau s’arrête. */
const ARRET = 0.004;
/** Vitesse maximale d’un lancer. */
const VITESSE_MAX = 6;
/** La poussée de départ, et celle d’une flèche du clavier. */
const POUSSEE_DEPART = 1.6;
const POUSSEE_CLAVIER = 1.4;

/**
 * Remplit la page Infos. Renvoie de quoi la démonter.
 * @returns {() => void}
 */
export function initInfos() {
  const defile = document.querySelector(".merci__defile");
  const piste = defile?.querySelector(".merci__piste");
  const liste = piste?.querySelector(".merci__liste");
  if (!(defile instanceof HTMLElement) || !(piste instanceof HTMLElement) || !(liste instanceof HTMLElement)) {
    return () => {};
  }
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)");

  let cycle = 0;
  let x = 0;
  let vitesse = 0;
  let image = 0;
  let derniere = 0;

  /* Assez de copies pour couvrir le bandeau, plus une de chaque côté. */
  const recopier = () => {
    for (const copie of piste.querySelectorAll("[data-copie]")) copie.remove();
    cycle = liste.offsetWidth;
    if (cycle <= 0) return;
    const copies = Math.ceil(defile.clientWidth / cycle) + 1;
    for (let i = 0; i < copies; i++) {
      const copie = /** @type {HTMLElement} */ (liste.cloneNode(true));
      copie.setAttribute("aria-hidden", "true");
      copie.dataset.copie = "";
      piste.append(copie);
    }
    dessiner();
  };

  const dessiner = () => {
    if (cycle <= 0) return;
    const p = ((x % cycle) + cycle) % cycle;
    piste.style.transform = `translate3d(${-p}px, 0, 0)`;
  };

  /* L’élan : la vitesse diminue à chaque image, jusqu’à l’arrêt. */
  const avancer = (/** @type {number} */ t) => {
    const dt = Math.min(48, t - derniere || 16);
    derniere = t;
    x += vitesse * dt;
    vitesse *= Math.pow(FROTTEMENT, dt / 16.67);
    dessiner();
    if (Math.abs(vitesse) > ARRET && !tire) {
      image = requestAnimationFrame(avancer);
    } else {
      image = 0;
      if (!tire) vitesse = 0;
      dessiner();
    }
  };

  const lancer = () => {
    if (calme.matches) {
      vitesse = 0;
      dessiner();
      return;
    }
    vitesse = Math.max(-VITESSE_MAX, Math.min(VITESSE_MAX, vitesse));
    if (!image) {
      derniere = performance.now();
      image = requestAnimationFrame(avancer);
    }
  };

  /* On tire le bandeau : il suit le doigt ; on mesure la vitesse des
     derniers instants pour le lancer au lâcher. */
  let tire = false;
  let pointeur = -1;
  let dernierX = 0;
  /** @type {Array<{ t: number, x: number }>} */
  let traces = [];

  /** @param {PointerEvent} e */
  const auAppui = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    tire = true;
    pointeur = e.pointerId;
    dernierX = e.clientX;
    traces = [{ t: e.timeStamp, x: e.clientX }];
    vitesse = 0;
    cancelAnimationFrame(image);
    image = 0;
    defile.dataset.tire = "true";
    defile.setPointerCapture(e.pointerId);
  };

  /** @param {PointerEvent} e */
  const auMouvement = (e) => {
    if (!tire || e.pointerId !== pointeur) return;
    x -= e.clientX - dernierX;
    dernierX = e.clientX;
    traces.push({ t: e.timeStamp, x: e.clientX });
    traces = traces.filter((p) => e.timeStamp - p.t < 100);
    const premiere = traces[0];
    if (premiere && e.timeStamp > premiere.t) vitesse = -(e.clientX - premiere.x) / (e.timeStamp - premiere.t);
    dessiner();
  };

  /** @param {PointerEvent} e */
  const auLacher = (e) => {
    if (!tire || e.pointerId !== pointeur) return;
    tire = false;
    delete defile.dataset.tire;
    if (defile.hasPointerCapture(e.pointerId)) defile.releasePointerCapture(e.pointerId);
    /* Arrêté avant de lâcher : pas d’élan. */
    const derniereTrace = traces.at(-1);
    if (!derniereTrace || e.timeStamp - derniereTrace.t > 80) vitesse = 0;
    lancer();
  };

  /* Molette et pavé : seuls les gestes horizontaux (ou Maj + molette)
     poussent le bandeau ; la page défile normalement sinon. */
  /** @param {WheelEvent} e */
  const auRouleau = (e) => {
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (!dx) return;
    e.preventDefault();
    const pixels = e.deltaMode === 1 ? dx * 32 : dx;
    x += pixels;
    vitesse += pixels * 0.004;
    dessiner();
    lancer();
  };

  /** @param {KeyboardEvent} e */
  const auClavier = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    vitesse += e.key === "ArrowRight" ? POUSSEE_CLAVIER : -POUSSEE_CLAVIER;
    if (calme.matches) x += vitesse * 120;
    lancer();
  };

  /* Le premier passage dans l’écran : une petite poussée. */
  const vue = new IntersectionObserver((entrees) => {
    if (!entrees.some((e) => e.isIntersecting)) return;
    vue.disconnect();
    if (calme.matches || tire || vitesse) return;
    vitesse = POUSSEE_DEPART;
    lancer();
  }, { threshold: 0.6 });

  /* La largeur change (rotation, police chargée) : on recopie. */
  const observateur = new ResizeObserver(() => recopier());

  recopier();
  defile.addEventListener("pointerdown", auAppui);
  defile.addEventListener("pointermove", auMouvement);
  defile.addEventListener("pointerup", auLacher);
  defile.addEventListener("pointercancel", auLacher);
  defile.addEventListener("wheel", auRouleau, { passive: false });
  defile.addEventListener("keydown", auClavier);
  observateur.observe(defile);
  observateur.observe(liste);
  vue.observe(defile);
  document.fonts?.ready.then(recopier).catch(() => {});

  return () => {
    cancelAnimationFrame(image);
    vue.disconnect();
    observateur.disconnect();
    defile.removeEventListener("pointerdown", auAppui);
    defile.removeEventListener("pointermove", auMouvement);
    defile.removeEventListener("pointerup", auLacher);
    defile.removeEventListener("pointercancel", auLacher);
    defile.removeEventListener("wheel", auRouleau);
    defile.removeEventListener("keydown", auClavier);
  };
}
