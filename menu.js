/*
  menu.js — Hamburger menu for small screens
  ----------------------------------------------------------------
  INPUT   : click on .js-menu-button, a click on a nav link, or the Esc key
  PROCESS : flip the isMenuOpen state
  OUTPUT  : classList.toggle("is-open") on the button (bars turn into an X)
            and on the nav (panel shows), plus aria-expanded for screen readers
*/
"use strict";

(() => {
  const menuButton = document.querySelector(".js-menu-button");
  const siteNav = document.querySelector(".js-site-nav");
  if (!menuButton || !siteNav) return;

  const desktopQuery = window.matchMedia("(min-width: 48em)");

  // ---- State ----
  let isMenuOpen = false;

  // ---- Output ----
  function render() {
    menuButton.classList.toggle("is-open", isMenuOpen);
    siteNav.classList.toggle("is-open", isMenuOpen);
    menuButton.setAttribute("aria-expanded", String(isMenuOpen));
    menuButton.setAttribute("aria-label", isMenuOpen ? "Close menu" : "Menu");
  }

  function setMenu(open) {
    isMenuOpen = open;
    render();
  }

  // ---- Input ----
  menuButton.addEventListener("click", () => setMenu(!isMenuOpen));

  // Close after choosing a link
  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  // Close with the Esc key and return focus to the button
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen) {
      setMenu(false);
      menuButton.focus();
    }
  });

  // If the window grows to desktop size, reset the mobile menu
  desktopQuery.addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });
})();
