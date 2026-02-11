function resolveApiBase() {
  if (window.API_BASE) {
    return String(window.API_BASE).replace(/\/$/, "");
  }
  if (window.location.port === "8000") {
    return window.location.origin;
  }
  return "http://127.0.0.1:8000";
}

const API_BASE = resolveApiBase();
const PLACEHOLDER_IMAGE = "assets/ingredient-placeholder.svg";
const DEFAULT_EMPTY_MESSAGE = "Start by running a search to see vegetarian swaps.";
const DEFAULT_DETAIL_MESSAGE = "Select a dish to review its ingredients, nutrition, and preparation notes.";
const TASTE_SAMPLE_LIMIT = 12;

const searchInput = document.getElementById("searchInput");
const dietSelect = document.getElementById("dietSelect");
const searchBtn = document.getElementById("searchBtn");
const dishList = document.getElementById("dishList");
const dishDetail = document.getElementById("dishDetail");
const emptyState = document.getElementById("emptyState");
const tasteFilters = document.getElementById("tasteFilters");

let currentDish = null;

async function fetchDishes() {
  const params = new URLSearchParams({
    diet: dietSelect.value,
    query: searchInput.value.trim(),
  });
  getSelectedTastes().forEach((taste) => params.append("tastes", taste));
  resetDetailView();
  emptyState.hidden = true;
  emptyState.textContent = DEFAULT_EMPTY_MESSAGE;
  setListLoading(true);
  try {
    const response = await fetch(`${API_BASE}/recipes?${params.toString()}`);
    if (!response.ok) {
      renderList([]);
      emptyState.textContent = "No dishes matched your filters. Try a nearby search term.";
      emptyState.hidden = false;
      return;
    }
    const data = await response.json();
    renderList(data.dishes || []);
  } catch (error) {
    console.error(error);
    renderList([]);
    emptyState.textContent = "Unable to reach the backend. Please retry.";
    emptyState.hidden = false;
  } finally {
    setListLoading(false);
  }
}

function setListLoading(isLoading) {
  searchBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? "Searching..." : "Find dishes";
}

function renderList(dishes) {
  dishList.innerHTML = "";
  if (!dishes.length) {
    emptyState.hidden = false;
    return;
  }
  emptyState.textContent = DEFAULT_EMPTY_MESSAGE;
  emptyState.hidden = true;
  const fragment = document.createDocumentFragment();
  dishes.forEach((name) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.name = name;
    button.textContent = name;
    if (name === currentDish) {
      button.classList.add("active");
    }
    li.appendChild(button);
    fragment.appendChild(li);
  });
  dishList.appendChild(fragment);
}

dishList.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLButtonElement && target.dataset.name) {
    const dishName = target.dataset.name;
    currentDish = dishName;
    fetchDishDetail(dishName);
  }
});

async function fetchDishDetail(identifier) {
  dishDetail.innerHTML = "<p class=\"muted\">Loading dish detail...</p>";
  try {
    const encoded = encodeURIComponent(identifier);
    const response = await fetch(`${API_BASE}/recipes/${encoded}`);
    if (!response.ok) {
      dishDetail.innerHTML = "<p class=\"muted\">Dish detail unavailable. Please try another selection.</p>";
      return;
    }
    const detail = await response.json();
    renderDetail(detail);
  } catch (error) {
    console.error(error);
    dishDetail.innerHTML = "<p class=\"muted\">Dish detail unavailable. Please try later.</p>";
  }
}

function renderDetail(detail) {
  const container = document.createElement("div");
  container.className = "detail-body";

  const header = document.createElement("div");
  header.className = "detail-header";
  const title = document.createElement("h3");
  title.textContent = detail.name || "Dataset dish";
  header.appendChild(title);

  const tags = document.createElement("div");
  tags.className = "tags";
  [detail.diet, detail.course, detail.region]
    .filter(Boolean)
    .forEach((label) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = label;
      tags.appendChild(tag);
    });
  header.appendChild(tags);

  if (detail.heroSummary) {
    const hero = document.createElement("p");
    hero.textContent = detail.heroSummary;
    header.appendChild(hero);
  }

  if (detail.whyItWorks) {
    const why = document.createElement("p");
    why.className = "muted";
    why.textContent = detail.whyItWorks;
    header.appendChild(why);
  }

  container.appendChild(header);

  if (detail.image) {
    const heroImage = document.createElement("img");
    heroImage.src = detail.image;
    heroImage.alt = `${detail.name || "Dish"} hero image`;
    heroImage.style.width = "100%";
    heroImage.style.borderRadius = "24px";
    heroImage.style.objectFit = "cover";
    container.appendChild(heroImage);
  }

  const nutrition = document.createElement("div");
  nutrition.className = "nutrition";
  if (detail.nutrition) {
    Object.entries(detail.nutrition).forEach(([key, value]) => {
      const pill = document.createElement("span");
      pill.className = "nutri-pill";
      pill.textContent = `${key}: ${value}`;
      nutrition.appendChild(pill);
    });
  }
  container.appendChild(nutrition);

  const ingredientTitle = document.createElement("h4");
  ingredientTitle.textContent = "Ingredients";
  container.appendChild(ingredientTitle);

  const ingredientList = document.createElement("ul");
  ingredientList.className = "ingredients";
  (detail.ingredients || []).forEach((item) => {
    const row = document.createElement("li");
    const image = document.createElement("img");
    image.src = item.image || PLACEHOLDER_IMAGE;
    image.alt = item.item || "Ingredient";
    row.appendChild(image);
    const copy = document.createElement("div");
    const itemName = document.createElement("p");
    itemName.textContent = item.item || "Not available";
    const qty = document.createElement("p");
    qty.className = "muted";
    qty.textContent = item.quantity || "Quantity not available";
    copy.appendChild(itemName);
    copy.appendChild(qty);
    row.appendChild(copy);
    ingredientList.appendChild(row);
  });
  container.appendChild(ingredientList);

  if (Array.isArray(detail.steps) && detail.steps.length) {
    const stepTitle = document.createElement("h4");
    stepTitle.textContent = "Steps";
    container.appendChild(stepTitle);
    const ordered = document.createElement("ol");
    detail.steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      ordered.appendChild(li);
    });
    container.appendChild(ordered);
  }

  const videoBlock = document.createElement("div");
  if (detail.youtube_url) {
    const link = document.createElement("a");
    link.href = detail.youtube_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Watch recipe video";
    videoBlock.appendChild(link);
  } else {
    const pending = document.createElement("p");
    pending.className = "muted";
    pending.textContent = "Recipe video coming soon.";
    videoBlock.appendChild(pending);
  }
  container.appendChild(videoBlock);

  dishDetail.innerHTML = "";
  dishDetail.appendChild(container);
}

function resetDetailView(message = DEFAULT_DETAIL_MESSAGE) {
  currentDish = null;
  if (dishDetail) {
    dishDetail.innerHTML = `<p class="muted">${message}</p>`;
  }
}

function getSelectedTastes() {
  if (!tasteFilters) {
    return [];
  }
  return Array.from(tasteFilters.querySelectorAll('input[name="tasteFilter"]:checked')).map((input) => input.value);
}

async function bootstrapTasteFilters() {
  if (!tasteFilters) {
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/tastes`);
    if (!response.ok) {
      throw new Error("Unable to load taste filters");
    }
    const payload = await response.json();
    renderTasteFilters(payload.tastes || []);
  } catch (error) {
    console.error(error);
    tasteFilters.innerHTML = '<p class="muted field-hint">Taste preferences unavailable right now.</p>';
  }
}

function renderTasteFilters(labels) {
  if (!tasteFilters) {
    return;
  }
  tasteFilters.innerHTML = "";
  const curated = (labels || []).slice(0, TASTE_SAMPLE_LIMIT);
  if (!curated.length) {
    tasteFilters.innerHTML = '<p class="muted field-hint">Taste preferences unavailable right now.</p>';
    return;
  }
  const fragment = document.createDocumentFragment();
  curated.forEach((label) => fragment.appendChild(createTasteChip(label)));
  tasteFilters.appendChild(fragment);
}

function createTasteChip(label) {
  const wrapper = document.createElement("label");
  wrapper.className = "taste-chip";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = "tasteFilter";
  input.value = label;
  const text = document.createElement("span");
  text.textContent = label;
  wrapper.appendChild(input);
  wrapper.appendChild(text);
  input.addEventListener("change", () => {
    wrapper.classList.toggle("is-active", input.checked);
    fetchDishes();
  });
  return wrapper;
}

searchBtn.addEventListener("click", fetchDishes);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    fetchDishes();
  }
});

dietSelect.addEventListener("change", fetchDishes);

bootstrapTasteFilters();
resetDetailView();
fetchDishes();
