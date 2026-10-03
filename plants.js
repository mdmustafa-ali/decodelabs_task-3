/*
  plants.js — The plant tracker
  ----------------------------------------------------------------
  Every interaction follows the same Input → Process → Output loop:

    INPUT   an event listener catches a click or a form submit
    PROCESS a small function updates the `state` object (and saves it)
    OUTPUT  render() rebuilds the visible parts of the page from state

  Rules followed in this file:
    - const by default, let only when a value must change, never var
    - DOM text is set with textContent (never innerHTML) to avoid XSS
    - new elements are built with document.createElement + append
    - "js-" classes are only JavaScript hooks; "is-" classes are visual state
*/
"use strict";

(() => {
  // ==============================================================
  // 1. Constants
  // ==============================================================
  const STORAGE_KEY = "windowsill.plants";
  const DAY_MS = 24 * 60 * 60 * 1000;
  const LIGHT_LABELS = {
    low: "Low light",
    medium: "Medium light",
    bright: "Bright light",
  };

  // ==============================================================
  // 2. DOM references (js- hooks only)
  // ==============================================================
  const grid = document.querySelector(".js-plant-grid");
  const countText = document.querySelector(".js-plant-count");
  const emptyMessage = document.querySelector(".js-empty");
  const filterButtons = document.querySelectorAll(".js-filter");
  const roundDrops = document.querySelector(".js-round-drops");
  const roundText = document.querySelector(".js-round-text");
  const roundNext = document.querySelector(".js-round-next");
  const addForm = document.querySelector(".js-add-form");
  const nameInput = document.querySelector(".js-input-name");
  const everyInput = document.querySelector(".js-input-every");
  const sinceInput = document.querySelector(".js-input-since");
  const nameError = document.querySelector(".js-error-name");
  const everyError = document.querySelector(".js-error-every");
  const sinceError = document.querySelector(".js-error-since");
  const resetButton = document.querySelector(".js-reset");
  const announcer = document.querySelector(".js-announcer");

  // ==============================================================
  // 3. Date helpers (dates are stored as "YYYY-MM-DD" in local time)
  // ==============================================================
  function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function today() {
    return toDateString(new Date());
  }

  function daysAgo(count) {
    const date = new Date();
    date.setDate(date.getDate() - count);
    return toDateString(date);
  }

  function daysBetween(fromString, toString) {
    const [y1, m1, d1] = fromString.split("-").map(Number);
    const [y2, m2, d2] = toString.split("-").map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY_MS);
  }

  // ==============================================================
  // 4. State
  // ==============================================================
  function createSamplePlants() {
    return [
      { id: "p1", name: "Monstera", type: "Monstera deliciosa", light: "medium", waterEvery: 7, lastWatered: daysAgo(8), petSafe: false },
      { id: "p2", name: "Snake plant", type: "Dracaena trifasciata", light: "low", waterEvery: 14, lastWatered: daysAgo(5), petSafe: false },
      { id: "p3", name: "Kitchen basil", type: "Basil", light: "bright", waterEvery: 2, lastWatered: daysAgo(2), petSafe: true },
      { id: "p4", name: "Boston fern", type: "Nephrolepis exaltata", light: "medium", waterEvery: 3, lastWatered: daysAgo(1), petSafe: true },
      { id: "p5", name: "Golden pothos", type: "Epipremnum aureum", light: "low", waterEvery: 7, lastWatered: daysAgo(7), petSafe: false },
      { id: "p6", name: "Spider plant", type: "Chlorophytum comosum", light: "medium", waterEvery: 5, lastWatered: daysAgo(3), petSafe: true },
    ];
  }

  const state = {
    plants: loadPlants(),
    filter: "all",
  };

  // ==============================================================
  // 5. Storage (localStorage keeps state between visits)
  // ==============================================================
  function loadPlants() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) return saved;
    } catch (error) {
      // Corrupted or blocked storage: fall back to the samples
    }
    return createSamplePlants();
  }

  function savePlants() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.plants));
    } catch (error) {
      // Not fatal: changes still work until the page is closed
    }
  }

  // ==============================================================
  // 6. Process: pure logic about a plant
  // ==============================================================
  function getStatus(plant) {
    const daysSince = daysBetween(plant.lastWatered, today());
    const daysLeft = plant.waterEvery - daysSince;

    if (daysSince === 0) return { key: "done", text: "Watered today" };
    if (daysLeft > 1) return { key: "ok", text: `Water in ${daysLeft} days` };
    if (daysLeft === 1) return { key: "ok", text: "Water tomorrow" };
    if (daysLeft === 0) return { key: "due", text: "Water today" };

    const overdue = Math.abs(daysLeft);
    return { key: "overdue", text: `${overdue} ${overdue === 1 ? "day" : "days"} overdue` };
  }

  function needsWater(plant) {
    const { key } = getStatus(plant);
    return key === "due" || key === "overdue";
  }

  function wateredToday(plant) {
    return plant.lastWatered === today();
  }

  // Soil moisture from 100% (just watered) down to 0% (due or overdue)
  function getMoisture(plant) {
    const daysSince = daysBetween(plant.lastWatered, today());
    const dryness = Math.min(daysSince / plant.waterEvery, 1);
    return Math.round((1 - dryness) * 100);
  }

  function matchesFilter(plant) {
    // "Today" keeps watered plants visible so their Undo button stays reachable
    if (state.filter === "today") return needsWater(plant) || wateredToday(plant);
    if (state.filter === "low") return plant.light === "low";
    if (state.filter === "pet") return plant.petSafe;
    return true;
  }

  function findPlant(id) {
    return state.plants.find((plant) => plant.id === id);
  }

  // ==============================================================
  // 7. Process: actions that change state
  // ==============================================================
  function toggleWatered(id) {
    const plant = findPlant(id);
    if (!plant) return;

    if (wateredToday(plant) && plant.previousWatered) {
      // Undo: go back to the date before today's watering
      plant.lastWatered = plant.previousWatered;
      delete plant.previousWatered;
      announce(`${plant.name}: watering undone.`);
    } else {
      plant.previousWatered = plant.lastWatered;
      plant.lastWatered = today();
      announce(`${plant.name} marked as watered.`);
    }
    commit();
  }

  function removePlant(id) {
    const plant = findPlant(id);
    if (!plant) return;
    state.plants = state.plants.filter((item) => item.id !== id);
    announce(`${plant.name} removed.`);
    commit();
  }

  function addPlant(newPlant) {
    state.plants.push(newPlant);
    state.filter = "all"; // make sure the new card is visible
    announce(`${newPlant.name} added.`);
    commit();
  }

  function setFilter(filter) {
    state.filter = filter;
    render();
  }

  function restoreSamples() {
    state.plants = createSamplePlants();
    state.filter = "all";
    announce("Sample plants restored.");
    commit();
  }

  // Save, then redraw: every state change ends here
  function commit() {
    savePlants();
    render();
  }

  // ==============================================================
  // 8. Output: building and updating the DOM
  // ==============================================================

  // Small helper: create an element with a class and optional text
  function createEl(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function createPlantCard(plant) {
    const status = getStatus(plant);
    const isDone = wateredToday(plant);

    const card = createEl("article", "plant-card");
    card.classList.add(`is-${status.key}`);
    card.dataset.id = plant.id;

    // Header: name + type
    const header = createEl("header", "plant-card__header");
    header.append(
      createEl("h3", "plant-card__name", plant.name),
      createEl("p", "plant-card__type", plant.type || "Houseplant")
    );

    // Status line
    const statusLine = createEl("p", "plant-card__status", status.text);

    // Soil moisture bar
    const moisture = getMoisture(plant);
    const meter = createEl("div", "moisture");
    const meterLabel = createEl("p", "moisture__label");
    meterLabel.append(
      createEl("span", "", "Soil moisture"),
      createEl("span", "moisture__value", `${moisture}%`)
    );
    const track = createEl("div", "moisture__track");
    track.setAttribute("aria-hidden", "true");
    const fill = createEl("span", "moisture__fill");
    fill.style.setProperty("--level", `${moisture}%`); // CSS variable, styled in CSS
    track.append(fill);
    meter.append(meterLabel, track);

    // Detail chips
    const chips = createEl("ul", "chips");
    chips.setAttribute("aria-label", "Care details");
    chips.append(
      createEl("li", "chips__item", LIGHT_LABELS[plant.light] || "Medium light"),
      createEl("li", "chips__item", `Every ${plant.waterEvery} ${plant.waterEvery === 1 ? "day" : "days"}`),
      createEl("li", `chips__item${plant.petSafe ? " chips__item--safe" : ""}`, plant.petSafe ? "Pet safe" : "Not pet safe")
    );

    // Action buttons (data-action is read by the delegated click listener)
    const actions = createEl("div", "plant-card__actions");
    const waterButton = createEl("button", "button button--water");
    waterButton.type = "button";
    waterButton.dataset.action = "water";

    if (isDone && plant.previousWatered) {
      waterButton.textContent = "Undo watering";
      waterButton.classList.add("is-undo");
    } else if (isDone) {
      waterButton.textContent = "Watered today";
      waterButton.disabled = true;
    } else {
      waterButton.textContent = "Mark as watered";
    }

    const removeButton = createEl("button", "button button--ghost", "Remove");
    removeButton.type = "button";
    removeButton.dataset.action = "remove";
    removeButton.setAttribute("aria-label", `Remove ${plant.name}`);

    actions.append(waterButton, removeButton);
    card.append(header, statusLine, meter, chips, actions);
    return card;
  }

  function renderGrid() {
    const visible = state.plants.filter(matchesFilter);
    const cards = visible.map(createPlantCard);
    grid.replaceChildren(...cards);

    const total = state.plants.length;
    countText.textContent = `Showing ${visible.length} of ${total} ${total === 1 ? "plant" : "plants"}`;
    emptyMessage.hidden = visible.length > 0;
  }

  function renderFilters() {
    filterButtons.forEach((button) => {
      const isActive = button.dataset.filter === state.filter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderRound() {
    const due = state.plants.filter(needsWater);
    const done = state.plants.filter(wateredToday);
    const totalTasks = due.length + done.length;

    // One drop per plant in today's round; filled drops are done
    const drops = [];
    for (let i = 0; i < totalTasks; i += 1) {
      const drop = createEl("span", "drop");
      if (i < done.length) drop.classList.add("is-filled");
      drops.push(drop);
    }
    roundDrops.replaceChildren(...drops);

    if (state.plants.length === 0) {
      roundText.textContent = "No plants yet. Add your first one below.";
      roundNext.textContent = "";
    } else if (totalTasks === 0) {
      roundText.textContent = "Nothing needs water today.";
      roundNext.textContent = "Check back tomorrow.";
    } else if (due.length === 0) {
      roundText.textContent = `All done. ${done.length} of ${totalTasks} watered.`;
      roundNext.textContent = "Every plant that needed water has had it.";
    } else {
      roundText.textContent = `${done.length} of ${totalTasks} watered. ${due.length} to go.`;
      const names = due.map((plant) => plant.name);
      roundNext.textContent = `Next: ${names.join(", ")}.`;
    }
  }

  function render() {
    renderFilters();
    renderGrid();
    renderRound();
  }

  function announce(message) {
    // Clear first so the same message is read out again if repeated
    announcer.textContent = "";
    window.setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }

  // ==============================================================
  // 9. Form validation
  // ==============================================================
  function showError(input, errorElement, message) {
    errorElement.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    input.classList.toggle("is-invalid", Boolean(message));
  }

  function readWholeNumber(input) {
    const value = Number(input.value);
    return Number.isInteger(value) ? value : NaN;
  }

  function validateForm() {
    const name = nameInput.value.trim();
    const every = readWholeNumber(everyInput);
    const since = readWholeNumber(sinceInput);
    let isValid = true;

    if (name === "") {
      showError(nameInput, nameError, "Enter a name for the plant.");
      isValid = false;
    } else if (state.plants.some((plant) => plant.name.toLowerCase() === name.toLowerCase())) {
      showError(nameInput, nameError, "You already have a plant with this name. Try adding where it lives, like \"Bedroom fern\".");
      isValid = false;
    } else {
      showError(nameInput, nameError, "");
    }

    if (Number.isNaN(every) || every < 1 || every > 60) {
      showError(everyInput, everyError, "Enter a whole number of days from 1 to 60.");
      isValid = false;
    } else {
      showError(everyInput, everyError, "");
    }

    if (Number.isNaN(since) || since < 0 || since > 60) {
      showError(sinceInput, sinceError, "Enter a whole number of days from 0 to 60.");
      isValid = false;
    } else {
      showError(sinceInput, sinceError, "");
    }

    return isValid ? { name, every, since } : null;
  }

  // ==============================================================
  // 10. Input: event listeners
  // ==============================================================

  // One listener on the grid handles every card's buttons (event delegation)
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = button.closest(".plant-card").dataset.id;
    if (button.dataset.action === "water") {
      toggleWatered(id);
      restoreFocus(id);
    }
    if (button.dataset.action === "remove") {
      removePlant(id);
      countText.focus(); // the card is gone, so move focus somewhere sensible
    }
  });

  // render() rebuilds the cards, so put keyboard focus back on the same card
  function restoreFocus(id) {
    const card = grid.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    const target = card.querySelector("[data-action='water']:not(:disabled)") ||
      card.querySelector("[data-action='remove']");
    target.focus();
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });

  addForm.addEventListener("submit", (event) => {
    event.preventDefault(); // stay on the page; we handle the data ourselves

    const values = validateForm();
    if (!values) {
      addForm.querySelector("[aria-invalid='true']").focus();
      return;
    }

    const formData = new FormData(addForm);
    addPlant({
      id: `p${Date.now()}`,
      name: values.name,
      type: String(formData.get("type") || "").trim(),
      light: String(formData.get("light")),
      waterEvery: values.every,
      lastWatered: daysAgo(values.since),
      petSafe: formData.get("pet") === "on",
    });

    addForm.reset();
    nameInput.focus();
  });

  resetButton.addEventListener("click", restoreSamples);

  // ==============================================================
  // 11. First render
  // ==============================================================
  render();
})();
