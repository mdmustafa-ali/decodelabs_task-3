/*
  theme.js — Dark mode toggle
  ----------------------------------------------------------------
  INPUT   : user clicks the .js-theme-toggle button
  PROCESS : flip the isDarkMode state and save it to localStorage
  OUTPUT  : toggle the .is-dark-mode class on <html>; CSS does the rest

  This file is loaded in <head> without "defer", so the saved theme is
  applied before the page is drawn (no white flash in dark mode).
*/
"use strict";

(() => {
  const STORAGE_KEY = "windowsill.theme";
  const root = document.documentElement;

  // ---- State ----
  let isDarkMode = getInitialTheme();

  function getInitialTheme() {
    const saved = readSavedTheme();
    if (saved === "dark") return true;
    if (saved === "light") return false;
    // No saved choice yet: follow the operating system setting
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function readSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null; // storage blocked (e.g. strict privacy mode)
    }
  }

  function saveTheme() {
    try {
      localStorage.setItem(STORAGE_KEY, isDarkMode ? "dark" : "light");
    } catch (error) {
      // Not fatal: the theme still works for this visit
    }
  }

  // ---- Output ----
  function applyTheme() {
    root.classList.toggle("is-dark-mode", isDarkMode);
  }

  function updateButton(button) {
    button.setAttribute("aria-pressed", String(isDarkMode));
  }

  // Apply immediately, before the body is drawn
  applyTheme();

  // ---- Input ----
  document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.querySelector(".js-theme-toggle");
    if (!toggleButton) return;

    updateButton(toggleButton);

    toggleButton.addEventListener("click", () => {
      isDarkMode = !isDarkMode;
      applyTheme();
      updateButton(toggleButton);
      saveTheme();
    });
  });
})();
