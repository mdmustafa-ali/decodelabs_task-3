/*
  accordion.js — Expand and collapse the care tips
  ----------------------------------------------------------------
  INPUT   : click (or Enter/Space) on a .js-accordion-trigger button
  PROCESS : read the current aria-expanded value and flip it
  OUTPUT  : show/hide the matching panel and toggle .is-open on the item
            (CSS rotates the + icon into a −)
*/
"use strict";

(() => {
  const triggers = document.querySelectorAll(".js-accordion-trigger");

  function toggleItem(trigger) {
    const isOpen = trigger.getAttribute("aria-expanded") === "true";
    const panel = document.getElementById(trigger.getAttribute("aria-controls"));
    const item = trigger.closest(".accordion__item");

    trigger.setAttribute("aria-expanded", String(!isOpen));
    panel.hidden = isOpen;
    item.classList.toggle("is-open", !isOpen);
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => toggleItem(trigger));
  });
})();
