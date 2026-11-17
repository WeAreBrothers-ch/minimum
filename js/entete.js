// @ts-check
/* Minimum : le menu. Sur téléphone, il s’ouvre sur tout l’écran. */

/**
 * Branche le bouton du menu de l’en-tête présent dans la page.
 * @returns {() => void} De quoi le débrancher avant de changer de page.
 */
export function initEntete() {
  const menu = document.querySelector(".menu");
  const bouton = document.querySelector(".menu__ouvrir");
  if (!(menu instanceof HTMLElement) || !(bouton instanceof HTMLButtonElement)) return () => {};

  /** @param {boolean} ouvert */
  const basculer = (ouvert) => {
    menu.dataset.ouvert = String(ouvert);
    bouton.setAttribute("aria-expanded", String(ouvert));
    bouton.textContent = ouvert ? "Fermer" : "Menu";
  };

  const auClic = () => basculer(menu.dataset.ouvert !== "true");

  /** @param {KeyboardEvent} e */
  const auClavier = (e) => {
    if (e.key === "Escape" && menu.dataset.ouvert === "true") {
      basculer(false);
      bouton.focus();
    }
  };

  bouton.addEventListener("click", auClic);
  document.addEventListener("keydown", auClavier);

  return () => {
    bouton.removeEventListener("click", auClic);
    document.removeEventListener("keydown", auClavier);
  };
}
