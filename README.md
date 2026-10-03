# Windowsill: An Interactive Plant Care Tracker with Vanilla JavaScript

DecodeLabs Frontend Development, Project 3: Interactive Web Elements.

A plant-watering tracker built with HTML, CSS and plain JavaScript (no libraries). It shows which plants need water today, lets you mark them as watered, filter and add plants, and switch to dark mode. Everything is remembered in the browser between visits.

## Project structure

```
windowsill/
├── index.html          # Page structure; dynamic areas are empty containers
├── css/
│   └── styles.css      # Styling, light/dark themes, is- state classes
├── js/
│   ├── theme.js        # Dark mode toggle + localStorage
│   ├── menu.js         # Hamburger menu (bars animate into an X)
│   ├── accordion.js    # Expand/collapse care tips
│   └── plants.js       # Main tracker: state, rendering, events, form, storage
└── README.md
```

## How to run

Open `index.html` in a modern browser. No server or install needed.

## What you can do on the page

- **Dark mode switch** in the header. Your choice is saved and still there after a reload.
- **Hamburger menu** on phones. It animates into an X, closes with Esc, and closes after you pick a link.
- **Mark as watered** on any plant card. The status, soil-moisture bar, card colour and "Today's watering" summary all update instantly. Press it again to undo.
- **Filter buttons:** All, Today's round, Low light, Pet safe. The "Showing X of Y plants" count updates live, with a message when nothing matches.
- **Add a plant form.** It checks your input, shows clear error messages, then builds a new card on the page.
- **Remove** any plant, or **Restore sample plants** from the footer.
- **Care tips accordion:** questions that open and close.

## Requirements checklist (from the training kit)

| Kit requirement | Where it is in the code |
|---|---|
| **Buttons or toggles** | Dark mode switch, hamburger toggle, filter buttons, Water/Undo and Remove buttons, accordion toggles. |
| **Basic user interaction** | Clicks, keyboard (Esc closes the menu, Enter/Space on all buttons) and form submit. |
| **Dynamic content update** | Cards, counts, the drops row, status text and moisture bars are all rebuilt from data whenever something changes. |
| **IPO loop (Input → Process → Output)** | Every file is organised this way: event listeners (input), small functions that change `state` (process), and `render()` functions that update the DOM (output). |
| **Event listeners** | `addEventListener` for `click`, `submit`, `keydown`, `DOMContentLoaded` and media-query `change`. The plant grid uses one delegated listener for all card buttons. |
| **State management** | `plants.js` keeps a single `state` object (`plants`, `filter`); `theme.js` keeps `isDarkMode`; `menu.js` keeps `isMenuOpen`. The interface always redraws from state. |
| **const / let, no var** | `const` by default, `let` only for values that change. `var` is never used. Every file uses `"use strict"`. |
| **Small, single-purpose functions** | e.g. `getStatus`, `needsWater`, `getMoisture`, `toggleWatered`, `renderGrid`, `renderRound`, `validateForm`. Includes the if/else branching the kit shows (overdue, due, tomorrow, later). |
| **textContent, not innerHTML** | All text is set with `textContent`. `innerHTML` is never used, so typing HTML into the form shows as plain text and can't run code (XSS-safe; tested). |
| **createElement + append** | Plant cards, chips, buttons and water drops are built with `document.createElement()` and `append()` / `replaceChildren()`. |
| **classList.toggle()** | `is-open` (menu, hamburger X, accordion), `is-active` (filters), `is-dark-mode` (theme), `is-filled` (drops), `is-invalid` (form fields). JavaScript toggles the class; CSS handles the look and the animation. |
| **Dark mode case study** | Click → flip `isDarkMode` → save to `localStorage` → toggle `.is-dark-mode`. If nothing is saved, it follows the device's dark/light setting. |
| **Decoupling: js- and is- prefixes** | JavaScript selects only `js-` classes (e.g. `.js-plant-grid`). These are never styled in CSS. Visual state uses `is-` classes only. |

## Accessibility

- All controls are real `<button>` elements, at least 44px tall.
- Toggles report their state to screen readers (`aria-pressed`, `aria-expanded`).
- Actions are announced through an `aria-live` region (e.g. "Monstera marked as watered").
- Keyboard focus returns to the right card after it is redrawn.
- Form errors are linked to their fields with `aria-describedby` and `aria-invalid`.
- Colour contrast passes in both light and dark modes.
- Reduced-motion settings turn off animations.

## Notes

- Data is saved under the `localStorage` keys `windowsill.plants` and `windowsill.theme`. To start fresh, use "Restore sample plants".
- Font: Bricolage Grotesque from Google Fonts, falling back to system fonts if offline.
