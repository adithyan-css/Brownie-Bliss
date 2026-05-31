// --- CONFIG ---
const API_BASE = "/api";

// --- SCROLL TO TOP (NEW FEATURE) ---
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "t") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// --- THEME ---
function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  const icon = document.getElementById("themeIcon");
  if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const next = isDark ? "light" : "dark";
  localStorage.setItem("bb_theme", next);
  applyTheme(next);
}
window.toggleTheme = toggleTheme;

// --- PRODUCTS DATA ---
let products = [];
let bdayCakes = {};
let selectedFlavor = "Red Velvet";
let currentSearchTerm = "";
let selectedPriceFilter = "all";
let recentSearches = JSON.parse(
  localStorage.getItem("brownie_recent_searches") || "[]",
);
let selectedWeight = "1.0";
// --- DESSERT STATE ---
let selectedDessert = "Macarons";
let selectedDessertBox = "Box of 4";

// --- BROWNIE STATE ---
let selectedBrownie = "Walnut";
let selectedBrowniePack = "Pack of 4";
let selectedBrownieWrap = "Standard";

// --- COOKIE STATE ---
let selectedCookie = "Choco Chip";
let selectedCookiePack = "Box of 6";
const BIRTHDAY_BASE_PRICES = {
  0.5: 450,
  "1.0": 850,
  1.5: 1250,
  "2.0": 1600,
};

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Velvet Dream Cake",
    category: "cakes",
    price: 850,
    img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860",
  },
  {
    id: 2,
    name: "Dutch Truffle Delight",
    category: "cakes",
    price: 950,
    img: "https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180",
  },
  {
    id: 3,
    name: "Pineapple Fresh Cream",
    category: "cakes",
    price: 675,
    img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg",
  },
];

const DEFAULT_BDAY_CAKES = {
  "Red Velvet": {
    price: 850,
    img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860",
  },

  "Dutch Truffle": {
    price: 950,
    img: "https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180",
  },

  Pineapple: {
    price: 675,
    img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg",
  },

  Chocoholic: {
    price: 900,
    img: "https://theobroma.in/cdn/shop/files/ChocolateCakehalfkg.jpg",
  },

  "Black Forest": {
    price: 800,
    img: "https://theobroma.in/cdn/shop/files/BlackForestCakehalfkg.jpg",
  },

  Cheesecake: {
    price: 950,
    img: "https://theobroma.in/cdn/shop/files/BakedCheesecake.jpg",
  },
};
const DESSERTS_DATA = {
  Macarons: {
    price: 350,
    img: "https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427",
  },
  Tarts: {
    price: 400,
    img: "https://theobroma.in/cdn/shop/files/LemonTart_400x400.jpg",
  },
  Pastries: {
    price: 380,
    img: "https://theobroma.in/cdn/shop/files/Pastries.jpg",
  },
  Cupcakes: {
    price: 300,
    img: "https://theobroma.in/cdn/shop/files/Cupcakes.jpg",
  },
  Mousse: {
    price: 450,
    img: "https://theobroma.in/cdn/shop/files/Mousse.jpg",
  },
  Donuts: {
    price: 320,
    img: "https://theobroma.in/cdn/shop/files/Donuts.jpg",
  },
};

const BROWNIES_DATA = {
  Walnut: {
    price: 250,
    img: "https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338",
  },
  Overload: {
    price: 300,
    img: "https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338",
  },
  Nutella: {
    price: 320,
    img: "https://theobroma.in/cdn/shop/files/NutellaBrownie.jpg",
  },
  "Red Velvet": {
    price: 280,
    img: "https://theobroma.in/cdn/shop/files/RedVelvetBrownie.jpg",
  },
  Cookie: {
    price: 260,
    img: "https://theobroma.in/cdn/shop/files/CookieBrownie.jpg",
  },
  Assorted: {
    price: 350,
    img: "https://theobroma.in/cdn/shop/files/AssortedBrownies.jpg",
  },
};

const COOKIES_DATA = {
  "Choco Chip": {
    price: 250,
    img: "https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg",
  },
  "Double Choco": {
    price: 280,
    img: "https://handletheheat.com/wp-content/uploads/2023/09/double-chocolate-chip-cookies-SQUARE.jpg",
  },
  "Oatmeal Raisin": {
    price: 240,
    img: "https://www.livewellbakeoften.com/wp-content/uploads/2019/02/Oatmeal-Raisin-Cookies-4.jpg",
  },
  "Almond Biscotti": {
    price: 320,
    img: "https://www.loveandoliveoil.com/wp-content/uploads/2018/12/almond-biscottiH2.jpg",
  },
  "Red Velvet": {
    price: 300,
    img: "https://bromabakery.com/wp-content/uploads/2020/02/red-velvet-cookies-5.jpg",
  },
  Assorted: {
    price: 350,
    img: "https://i.pinimg.com/originals/82/6f/4c/826f4c7cfb42d03fd4e6c8d641b46d58.jpg",
  },
};
function selectDessertOption(clickedBtn) {
  // scope to the nearest card or the document
  const scope = clickedBtn.closest(".birthday-card") || document;
  // remove active from any buttons that could represent dessert options
  scope
    .querySelectorAll(
      ".dessert-btn, .selectable-btn, .filter-tab, .filter-pill",
    )
    .forEach((btn) => btn.classList.remove("active"));

  clickedBtn.classList.add("active");
  // update state and recalc price
  selectedDessert = clickedBtn.textContent.trim();
  if (typeof calculateDessertPrice === "function") calculateDessertPrice();
}

function selectBrownieOption(clickedBtn) {
  const scope = clickedBtn.closest(".birthday-card") || document;
  scope
    .querySelectorAll(".brownie-btn, .filter-tab, .filter-pill")
    .forEach((btn) => btn.classList.remove("active"));

  clickedBtn.classList.add("active");
  selectedBrownie = clickedBtn.textContent.trim();
  if (typeof calculateBrowniePrice === "function") calculateBrowniePrice();
}

function selectCookieOption(clickedBtn) {
  const scope = clickedBtn.closest(".birthday-card") || document;
  scope
    .querySelectorAll(".cookie-btn, .filter-tab, .filter-pill")
    .forEach((btn) => btn.classList.remove("active"));

  clickedBtn.classList.add("active");
  selectedCookie = clickedBtn.textContent.trim();
  if (typeof calculateCookiePrice === "function") calculateCookiePrice();
}

function useFallbackProducts() {
  products = DEFAULT_PRODUCTS;
  bdayCakes = { ...DEFAULT_BDAY_CAKES };

  if (document.getElementById("productsGrid")) {
    filterProducts("all");
  }
  if (document.getElementById("cakePrice")) {
    calculateBdayPrice();
  }
}

const FAVOURITES_KEY = "brownie_bliss_favourites";

let favourites = [];

function loadFavourites() {
  try {
    const stored = localStorage.getItem(FAVOURITES_KEY);
    favourites = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(favourites)) favourites = [];
  } catch (err) {
    favourites = [];
  }
}

function saveFavourites() {
  try {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
  } catch (err) {
    console.warn("Could not save favourites", err);
  }
}

function isFavourite(type, id) {
  return favourites.some((item) => item.type === type && item.id === id);
}

function addFavourite(item) {
  if (!isFavourite(item.type, item.id)) {
    favourites.push(item);
    saveFavourites();
  }
}

function removeFavourite(type, id) {
  favourites = favourites.filter(
    (item) => !(item.type === type && item.id === id),
  );
  saveFavourites();
}

function toggleFavourite(item) {
  if (isFavourite(item.type, item.id)) {
    removeFavourite(item.type, item.id);
    return false;
  }
  addFavourite(item);
  return true;
}

function toggleBirthdayFavourite() {
  const item = getBirthdayFavouriteItem();
  toggleFavourite({
    type: "dishes",
    id: item.id,
    name: item.name,
    img: item.img,
    category: item.category,
  });
  updateBirthdayFavouriteButton();
}

function toggleBakeryFavourite() {
  const item = {
    type: "bakeries",
    id: "brownie-bliss",
    name: "Brownie Bliss",
    img: "",
    category: "bakery",
  };
  toggleFavourite(item);
}

loadFavourites();

function buildCatalogFromList(list) {
  if (list && Array.isArray(list) && list.length) {
    products = list
      .filter((p) => p.type === "standard")
      .map((p) => ({
        id: p.id_ref,
        name: p.name,
        category: p.category,
        price: p.price,
        emoji: p.emoji,
        img: p.img,
        description: p.description || "",
      }));

    bdayCakes = {};
    const bd = list.filter((p) => p.type === "birthday");
    bd.forEach((p) => {
      bdayCakes[p.id_ref] = {
        price: p.price,
        emoji: p.emoji,
        img: p.img,
      };
    });
  } else {
    useFallbackProducts();
  }
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();

    if (data.success && Array.isArray(data.products) && data.products.length) {
      products = data.products
        .filter((p) => p.type === "standard")
        .map((p) => ({
          id: p.id_ref,
          name: p.name,
          category: p.category,
          price: p.price,
          emoji: p.emoji,
          img: p.img,
          description: p.description || "",
        }));

      bdayCakes = {};
      const bd = data.products.filter((p) => p.type === "birthday");
      bd.forEach((p) => {
        bdayCakes[p.id_ref] = {
          price: p.price,
          emoji: p.emoji,
          stock: p.stock,
          img: p.img,
        };
      });
    } else {
      useFallbackProducts();
    }
  } catch (e) {
    console.error("Error loading products from database:", e);
    useFallbackProducts();
  }

  if (document.getElementById("productsGrid")) {
    filterProducts("all");
  }

  if (document.getElementById("cakePrice")) {
    calculateBdayPrice();
  }
}

// --- CART STATE ---
let cart = JSON.parse(localStorage.getItem("brownie_bliss_cart") || "[]");
let checkoutState = {
  name: "",
  phone: "",
  address: "",
  city: "",
  pincode: "",
  verified: false,
  currentStep: 1,
};

function saveCart() {
  localStorage.setItem("brownie_bliss_cart", JSON.stringify(cart));
}

const cartFooter = document.getElementById("cartFooter");
const cartTotal = document.getElementById("cartTotal");

// --- CART UI ---
function updateCartUI() {
  const cartContainer = document.getElementById("cartItems");
  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = `
  <div class="cart-empty-state">
    <div class="empty-cart-icon">🍫</div>
    <h2>Your cart is empty</h2>
    <p>Looks like you haven't added any brownies yet.</p>
    <a href="products.html" class="shop-now-btn">Shop Now</a>
  </div>
`;
    if (cartFooter) cartFooter.style.display = "none";
  } else {
    cartContainer.innerHTML = cart
      .map((item, index) => {
        const c = item.customizations;
        let customBadges = "";
        if (c) {
          if (c.dietary)
            customBadges += `<span class="cart-custom-badge">${c.dietary === "eggless" ? "🌱 Eggless" : "🥚 Egg"}</span>`;
          if (c.toppings && c.toppings.length)
            customBadges += c.toppings
              .map((t) => `<span class="cart-custom-badge">+ ${t.name}</span>`)
              .join("");
          if (c.message)
            customBadges += `<span class="cart-custom-badge cart-custom-msg">✉ "${c.message}"</span>`;
        } else if (item.message) {
          customBadges = `<span class="cart-custom-badge cart-custom-msg">✉ "${item.message}"</span>`;
        }
        return `
            <div class="cart-item">
                <img src="${item.img || "https://via.placeholder.com/70"}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toLocaleString("en-IN")}</div>
                    ${customBadges ? `<div class="cart-custom-tags">${customBadges}</div>` : ""}
                    <div class="cart-qty">
                        <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                        <span class="qty-num">${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${index})">✕</button>
            </div>
        `;
      })
      .join("");
    if (cartFooter) cartFooter.style.display = "block";
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString("en-IN")}`;
  }
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  badge.textContent = count;
}

// --- ADD TO CART ---
function addToCart(product) {
  if (product.stock === 0) {
    showToast("This item is sold out");
    return;
  }
  const existing = cart.find(
    (i) => i.name === product.name && i.message === product.message,
  );
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showToast("Added to cart! 🛒");
}

// --- BIRTHDAY CART HELPERS ---
function addBirthdayToCart() {
  const cake = bdayCakes[selectedFlavor] || {};
  const weightMultiplier = { 0.5: 0.5, "1.0": 1, 1.5: 1.5, "2.0": 2 };
  const basePrice = cake.price || 850;
  const price = Math.round(basePrice * weightMultiplier[selectedWeight]);
  const message = document.getElementById("cakeMessage")?.value?.trim() || "";

  addToCart({
    name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
    price,
    img: cake.img || "",
    category: "cakes",
    message,
  });
}

function addDessertToCart() {
  const data = DESSERTS_DATA[selectedDessert];
  const multiplier = {
    "Box of 2": 1,
    "Box of 4": 1.7,
    "Box of 6": 2.3,
    "Box of 12": 4,
  };
  const price = Math.round(data.price * multiplier[selectedDessertBox]);
  const specialRequest =
    document.getElementById("specialRequestInput")?.value?.trim() || "";

  addToCart({
    name: `${selectedDessert} (${selectedDessertBox})`,
    price,
    img: data.img,
    category: "desserts",
    message: specialRequest,
  });
}

function addBrownieToCart() {
  const data = BROWNIES_DATA[selectedBrownie];
  const multiplier = {
    "Pack of 1": 1,
    "Pack of 4": 3,
    "Pack of 6": 4.5,
    "Pack of 12": 8,
  };
  const price = Math.round(data.price * multiplier[selectedBrowniePack]);

  addToCart({
    name: `${selectedBrownie} Brownie (${selectedBrowniePack})${selectedBrownieWrap === "Premium Gold" ? " — Premium Wrap" : ""}`,
    price,
    img: data.img,
    category: "brownies",
  });
}

function addCookieToCart() {
  const data = COOKIES_DATA[selectedCookie];
  const multiplier = {
    "Box of 2": 1,
    "Box of 6": 2.5,
    "Box of 12": 4.5,
    "Gift Tin": 5,
  };
  const price = Math.round(data.price * multiplier[selectedCookiePack]);

  addToCart({
    name: `${selectedCookie} Cookies (${selectedCookiePack})`,
    price,
    img: data.img,
    category: "cookies",
  });
}

// --- CHANGE QTY ---
function changeQty(index, delta) {
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

// --- REMOVE FROM CART ---
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

// --- LIVE PRODUCT SEARCH ---
function initializeLiveSearch() {
  const searchInput = document.getElementById("productSearch");
  const suggestionsBox = document.getElementById("searchSuggestions");
  const clearBtn = document.getElementById("clearSearchBtn");

  if (!searchInput) return;

  renderRecentSearches();

  searchInput.addEventListener("input", function () {
    const value = this.value.trim();
    currentSearchTerm = value;

    if (value.length > 0) {
      clearBtn.style.display = "block";
      generateSuggestions(value);
    } else {
      clearBtn.style.display = "none";
      suggestionsBox.style.display = "none";
    }

    filterProducts("all");
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      const value = this.value.trim();
      if (value) {
        saveRecentSearch(value);
      }
      suggestionsBox.style.display = "none";
    }
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentSearchTerm = "";
    clearBtn.style.display = "none";
    suggestionsBox.style.display = "none";
    filterProducts("all");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-section")) {
      suggestionsBox.style.display = "none";
    }
  });
}

function generateSuggestions(searchTerm) {
  const suggestionsBox = document.getElementById("searchSuggestions");
  if (!suggestionsBox) return;

  const term = searchTerm.toLowerCase();
  const matches = products
    .filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.description || "").toLowerCase().includes(term)
      );
    })
    .slice(0, 5);

  if (!matches.length) {
    suggestionsBox.style.display = "none";
    return;
  }

  suggestionsBox.innerHTML = matches
    .map(
      (product) => `
        <div
            class="search-suggestion-item"
            onclick="selectSuggestion('${product.name.replace(/'/g, "\\'")}')"
        >
            🔍 ${highlightMatch(product.name, searchTerm)}
        </div>
    `,
    )
    .join("");

  suggestionsBox.style.display = "block";
}

function selectSuggestion(value) {
  const searchInput = document.getElementById("productSearch");
  const suggestionsBox = document.getElementById("searchSuggestions");
  if (!searchInput) return;

  searchInput.value = value;
  currentSearchTerm = value;
  saveRecentSearch(value);
  filterProducts("all");
  suggestionsBox.style.display = "none";
}

function highlightMatch(text, term) {
  if (!term) return text;
  const regex = new RegExp(`(${term})`, "gi");
  return text.replace(regex, `<span class="highlight-match">$1</span>`);
}

function saveRecentSearch(search) {
  if (!search) return;
  recentSearches = recentSearches.filter((item) => item !== search);
  recentSearches.unshift(search);
  recentSearches = recentSearches.slice(0, 5);
  localStorage.setItem(
    "brownie_recent_searches",
    JSON.stringify(recentSearches),
  );
  renderRecentSearches();
}

function renderRecentSearches() {
  const container = document.getElementById("recentSearches");
  if (!container) return;

  if (!recentSearches.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = recentSearches
    .map(
      (search) => `
        <div
            class="recent-search-tag"
            onclick="selectSuggestion('${search.replace(/'/g, "\\'")}')"
        >
            ${search}
        </div>
      `,
    )
    .join("");
}

function updatePriceFilter() {
  const filter = document.getElementById("priceFilter");
  if (!filter) return;
  selectedPriceFilter = filter.value;
  filterProducts("all");
}

window.updatePriceFilter = updatePriceFilter;
window.selectSuggestion = selectSuggestion;

// --- PRODUCT FILTERING ---
function filterProducts(category = "all", btn = null) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  if (btn) {
    btn.parentElement
      .querySelectorAll(".filter-tab")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }

  let filtered =
    category === "all"
      ? [...products]
      : products.filter((p) => p.category === category);

  if (currentSearchTerm.trim()) {
    const term = currentSearchTerm.toLowerCase();
    filtered = filtered.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.description || "").toLowerCase().includes(term)
      );
    });
  }

  const emptyState = document.getElementById("noProductsFound");
  if (emptyState) {
    emptyState.style.display = filtered.length ? "none" : "block";
  }

  grid.innerHTML = filtered
    .map(
      (p) => `
      <div class="product-card">
        <div class="product-img-wrap">
          <img src="${p.img}" alt="${p.name}" />
        </div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.description || ""}</div>
          <div class="product-price">₹${p.price}</div>
          <button
            class="add-to-cart"
            ${p.stock === 0 ? "disabled" : ""}
            onclick='addToCart(${JSON.stringify(p)})'
          >
            ${p.stock === 0 ? "Sold Out" : "Add To Cart"}
          </button>
        </div>
      </div>
    `,
    )
    .join("");
}

// --- BIRTHDAY CAKE BUILDER ---
function updateBirthdayCake(flavor, clickedBtn) {
  if (!bdayCakes[flavor]) return;

  selectedFlavor = flavor;

  const cakeImg = document.getElementById("birthdayCakeImg");
  if (cakeImg) {
    cakeImg.src = bdayCakes[flavor].img;
  }

  const flavorButtons =
    clickedBtn
      ?.closest(".birthday-card")
      ?.querySelectorAll(
        ".birthday-flavor-options .filter-pill, .filter-tab.flavor-btn",
      ) ??
    document.querySelectorAll(
      ".birthday-flavor-options .filter-pill, .filter-tab.flavor-btn",
    );

  flavorButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.trim() === flavor) {
      btn.classList.add("active");
    }
  });

  calculateBdayPrice();
}

function setCakeWeight(weight, clickedBtn) {
  selectedWeight = weight;

  const weightButtons =
    clickedBtn
      ?.closest(".birthday-card")
      ?.querySelectorAll(
        ".birthday-weight-options .filter-pill, .filter-tab",
      ) ??
    document.querySelectorAll(
      ".birthday-weight-options .filter-pill, .filter-tab",
    );

  weightButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.includes(weight)) {
      btn.classList.add("active");
    }
  });

  calculateBdayPrice();
}

function calculateBdayPrice() {
  const cake = bdayCakes[selectedFlavor];

  let basePrice = cake?.price || 850;

  const weightMultiplier = {
    0.5: 0.5,
    "1.0": 1,
    1.5: 1.5,
    "2.0": 2,
  };

  const price = Math.round(basePrice * weightMultiplier[selectedWeight]);

  const priceEl = document.getElementById("cakePrice");
  if (priceEl) {
    priceEl.textContent = `₹ ${price}`;
  }

  updateBirthdayFavouriteButton();
}

// ======================================================
// DESSERTS
// ======================================================

function updateDessert(type, clickedBtn) {
  selectedDessert = type;

  const img = document.getElementById("dessertImg");
  if (img) img.src = DESSERTS_DATA[type].img;

  // Update active state on variety buttons
  const buttons =
    clickedBtn
      ?.closest(".birthday-card")
      ?.querySelectorAll(
        ".dessert-options .filter-tab, .dessert-options .filter-pill, .dessert-options .selectable-btn",
      ) ??
    document.querySelectorAll(
      ".dessert-options .filter-tab, .dessert-options .filter-pill, .dessert-options .selectable-btn",
    );

  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.trim() === type) {
      btn.classList.add("active");
    }
  });

  calculateDessertPrice();
}

function setDessertBox(box, clickedBtn) {
  selectedDessertBox = box;

  const buttons =
    clickedBtn
      ?.closest(".birthday-card")
      ?.querySelectorAll(
        ".dessert-box-options .filter-tab, .dessert-box-options .filter-pill, .dessert-box-options .button-group button",
      ) ??
    document.querySelectorAll(
      ".dessert-box-options .filter-tab, .dessert-box-options .filter-pill, .dessert-box-options .button-group button",
    );

  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.trim() === box) {
      btn.classList.add("active");
    }
  });

  calculateDessertPrice();
}

function calculateDessertPrice() {
  const base = DESSERTS_DATA[selectedDessert].price;

  const multiplier = {
    "Box of 2": 1,
    "Box of 4": 1.7,
    "Box of 6": 2.3,
    "Box of 12": 4,
  };

  const finalPrice = Math.round(base * multiplier[selectedDessertBox]);

  const priceEl = document.getElementById("dessertPrice");
  if (priceEl) {
    priceEl.textContent = `₹ ${finalPrice}`;
  }
}

// ======================================================
// BROWNIES
// ======================================================

function updateBrownie(type, clickedBtn) {
  selectedBrownie = type;

  const img = document.getElementById("brownieImg");
  if (img) img.src = BROWNIES_DATA[type].img;

  // Update active state on variety buttons
  const buttons =
    clickedBtn
      ?.closest(".birthday-card")
      ?.querySelectorAll(
        ".brownie-options .filter-tab, .brownie-options .filter-pill, .brownie-options button",
      ) ??
    document.querySelectorAll(
      ".brownie-options .filter-tab, .brownie-options .filter-pill, .brownie-options button",
    );

  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.trim() === type) {
      btn.classList.add("active");
    }
  });

  calculateBrowniePrice();
}

function setBrowniePack(pack, clickedBtn) {
  // normalize pack values: index.html uses '1','4','6','12' while birthday.html uses 'Pack of 1' etc.
  if (/^\d+$/.test(String(pack))) {
    selectedBrowniePack = `Pack of ${pack}`;
  } else {
    selectedBrowniePack = pack;
  }

  const buttons =
    clickedBtn
      ?.closest(".birthday-card")
      ?.querySelectorAll(
        ".brownie-pack-options .filter-tab, .brownie-pack-options .filter-pill, .brownie-pack-options .button-group button",
      ) ??
    document.querySelectorAll(
      ".brownie-pack-options .filter-tab, .brownie-pack-options .filter-pill, .brownie-pack-options .button-group button",
    );

  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.trim() === pack) {
      btn.classList.add("active");
    }
  });

  calculateBrowniePrice();
}

function setBrownieWrap(wrap, clickedBtn) {
  selectedBrownieWrap = wrap;

  const buttons =
    clickedBtn
      ?.closest(".birthday-card")
      ?.querySelectorAll(
        ".brownie-wrap-options .filter-tab, .brownie-wrap-options .filter-pill, .brownie-wrap-options .button-group button",
      ) ??
    document.querySelectorAll(
      ".brownie-wrap-options .filter-tab, .brownie-wrap-options .filter-pill, .brownie-wrap-options .button-group button",
    );

  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.trim() === wrap) {
      btn.classList.add("active");
    }
  });
}

function calculateBrowniePrice() {
  const base = BROWNIES_DATA[selectedBrownie].price;

  const multiplier = {
    "Pack of 1": 1,
    "Pack of 4": 3,
    "Pack of 6": 4.5,
    "Pack of 12": 8,
  };

  const finalPrice = Math.round(base * multiplier[selectedBrowniePack]);

  const priceEl = document.getElementById("browniePrice");
  if (priceEl) {
    priceEl.textContent = `₹ ${finalPrice}`;
  }
}

// ======================================================
// COOKIES
// ======================================================

function updateCookie(type, clickedBtn) {
  selectedCookie = type;

  const img = document.getElementById("cookieImg");
  if (img) img.src = COOKIES_DATA[type].img;

  // Update active state on variety buttons
  const buttons =
    clickedBtn
      ?.closest(".birthday-card")
      ?.querySelectorAll(
        ".cookie-options .filter-tab, .cookie-options .filter-pill, .cookie-options button",
      ) ??
    document.querySelectorAll(
      ".cookie-options .filter-tab, .cookie-options .filter-pill, .cookie-options button",
    );

  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.trim() === type) {
      btn.classList.add("active");
    }
  });

  calculateCookiePrice();
}

function setCookiePack(pack, clickedBtn) {
  selectedCookiePack = pack;

  const buttons =
    clickedBtn
      ?.closest(".birthday-card")
      ?.querySelectorAll(
        ".cookie-pack-options .filter-tab, .cookie-pack-options .filter-pill, .cookie-pack-options .button-group button",
      ) ??
    document.querySelectorAll(
      ".cookie-pack-options .filter-tab, .cookie-pack-options .filter-pill, .cookie-pack-options .button-group button",
    );

  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.trim() === pack) {
      btn.classList.add("active");
    }
  });

  calculateCookiePrice();
}

function calculateCookiePrice() {
  const base = COOKIES_DATA[selectedCookie].price;

  const multiplier = {
    "Box of 2": 1,
    "Box of 6": 2.5,
    "Box of 12": 4.5,
    "Gift Tin": 5,
  };

  const finalPrice = Math.round(base * multiplier[selectedCookiePack]);

  const priceEl = document.getElementById("cookiePrice");
  if (priceEl) {
    priceEl.textContent = `₹ ${finalPrice}`;
  }
}

function getBirthdayFavouriteItem() {
  const cake = bdayCakes[selectedFlavor] || {};
  return {
    id: `bday-${selectedFlavor}-${selectedWeight}`,
    name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
    price: BIRTHDAY_BASE_PRICES[selectedWeight],
    img: cake.img || document.getElementById("birthdayCakeImg")?.src || "",
    emoji: cake.emoji || "",
    category: "cakes",
  };
}

function updateBirthdayFavouriteButton() {
  const btn = document.getElementById("birthdayFavoriteBtn");
  if (!btn) return;

  const item = getBirthdayFavouriteItem();
  const active = isFavourite("dishes", item.id);

  btn.dataset.favType = "dishes";
  btn.dataset.favId = item.id;
  btn.classList.toggle("active", active);
  btn.setAttribute("aria-pressed", active ? "true" : "false");
  btn.setAttribute(
    "title",
    active ? "Remove from favourites" : "Add to favourites",
  );
  btn.innerHTML = active ? "&hearts;" : "&#9825;";
}

function sendWhatsAppFinal(orderId, itemsSnap, orderTotal) {
  const lines = Array.isArray(itemsSnap) && itemsSnap.length ? itemsSnap : cart;

  const total =
    typeof orderTotal === "number"
      ? orderTotal
      : lines.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);

  const itemLines = lines
    .map((i) => {
      let line = `• ${i.name} × ${i.qty} = ₹${(
        Number(i.price) * Number(i.qty)
      ).toLocaleString("en-IN")}`;

      if (i.customizations) {
        const c = i.customizations;
        const details = [];
        if (c.dietary) {
          details.push(c.dietary === "eggless" ? "Eggless" : "Egg");
        }
        if (c.toppings?.length) {
          details.push(c.toppings.map((t) => `+${t.name}`).join(", "));
        }
        if (c.message) {
          details.push(`Msg: "${c.message}"`);
        }
        if (details.length) {
          line += `\n   _${details.join(" | ")}_`;
        }
      }

      return line;
    })
    .join("\n");

  const message =
    `🍫 *New Order Received — Brownie Bliss*\n\n` +
    `📋 *Order ID:* ${orderId}\n` +
    `👤 *Customer:* ${checkoutState.name}\n` +
    `📱 *Phone:* +91 ${checkoutState.phone}\n` +
    `📍 *Address:* ${checkoutState.address}, ${checkoutState.city} - ${checkoutState.pincode}\n\n` +
    `🛒 *Order Details:*\n${itemLines}\n\n` +
    `💰 *Total Amount: ₹${total.toLocaleString("en-IN")}*\n\n` +
    `_Your order has been recorded. Please share payment receipt for confirmation!_ ✨`;

  const waUrl = `https://wa.me/918072596340?text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank");
}

// --- SCROLL TO TOP ---
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("scroll", function () {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  btn.style.display = window.scrollY > 300 ? "flex" : "none";
});

// --- AOS ---
if (typeof AOS !== "undefined") {
  AOS.init({ duration: 1000, once: true, easing: "ease-in-out" });
}

// --- TOAST ---
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ============================================================
// BIRTHDAY SLIDER HELPERS
// ============================================================
let birthdaySliderDotNavigationInitialized = false;

function getBirthdaySlider() {
  return document.querySelector(".birthday-slider");
}

function getBirthdaySlides() {
  const slider = getBirthdaySlider();
  return slider ? slider.querySelectorAll(".bday-slide") : [];
}

function updateBirthdayActiveDot(index) {
  const dots = document.querySelectorAll(".slider-dot");
  dots.forEach((dot, i) => {
    dot.style.background = i === index ? "var(--gold)" : "var(--cream3)";
    dot.style.border = i === index ? "none" : "1px solid var(--gold)";
  });
}

function getBirthdayCenterIndex() {
  const slider = getBirthdaySlider();
  const slides = getBirthdaySlides();
  if (!slider || slides.length === 0) return 0;

  const sliderRect = slider.getBoundingClientRect();
  const sliderCenter = sliderRect.left + sliderRect.width / 2;
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  slides.forEach((slide, idx) => {
    const slideRect = slide.getBoundingClientRect();
    const slideCenter = slideRect.left + slideRect.width / 2;
    const distance = Math.abs(slideCenter - sliderCenter);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = idx;
    }
  });

  return nearestIndex;
}

function scrollToSlide(index) {
  const slider = getBirthdaySlider();
  const slides = getBirthdaySlides();
  const slide = slides[index];
  if (!slider || !slide) return;

  const target = slide.offsetLeft;
  if (typeof slider.scrollTo === "function") {
    slider.scrollTo({ left: target, behavior: "smooth" });
  } else {
    slider.scrollLeft = target;
  }

  updateBirthdayActiveDot(index);
}

window.scrollToSlide = scrollToSlide;

function setupBirthdaySliderDotNavigation() {
  if (birthdaySliderDotNavigationInitialized) return;
  const slider = getBirthdaySlider();
  const dots = document.querySelectorAll(".slider-dots .slider-dot");
  if (!slider || !dots.length) return;

  const slides = slider.querySelectorAll(".bday-slide");

  function refreshActiveDot() {
    const currentIndex = getBirthdayCenterIndex();
    updateBirthdayActiveDot(currentIndex);
  }

  updateBirthdayActiveDot(0);

  slider.addEventListener("scroll", () => {
    const currentIndex = getBirthdayCenterIndex();
    console.log("birthday-slider scroll ->", {
      slideCount: slides.length,
      scrollLeft: slider.scrollLeft,
      currentIndex,
    });
    updateBirthdayActiveDot(currentIndex);
  });

  window.addEventListener("resize", refreshActiveDot);

  dots.forEach((dot, index) => {
    dot.dataset.slideIndex = index;
    dot.addEventListener("click", () => {
      console.log("birthday-dot click ->", { index });
      scrollToSlide(index);
      updateBirthdayActiveDot(index);
    });
  });

  birthdaySliderDotNavigationInitialized = true;
}

// ============================================================
// BIRTHDAY PAGE UI FIXES
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------
  // FIX 1: ACTIVE BUTTON STATE — scoped per .bday-slide
  //
  // Slide 1 (Cakes): flavor + weight buttons are driven by
  // updateBirthdayCake() and setCakeWeight(), so we skip slide 1.
  //
  // Slides 2-4 (Desserts, Brownies, Cookies):
  //   - .button-group rows (box size, pack size, wrap)
  //   - variety grids (.dessert-options, .brownie-options, .cookie-options)
  // Both get a generic scoped click listener so active state is always
  // correct regardless of what the JS update function does.
  // ---------------------------------------------------
  const allSlides = document.querySelectorAll(".bday-slide");
  allSlides.forEach((slide, slideIndex) => {
    // Skip slide 1 — its active state is fully managed by
    // updateBirthdayCake() and setCakeWeight().
    if (slideIndex === 0) return;

    // Handle .button-group rows (box size, pack size, wrap)
    const buttonGroups = slide.querySelectorAll(".button-group");
    buttonGroups.forEach((group) => {
      const buttons = group.querySelectorAll(".filter-pill");
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    });

    // Handle variety grids (dessert-options, brownie-options, cookie-options)
    const varietyGrids = slide.querySelectorAll(
      ".dessert-options, .brownie-options, .cookie-options",
    );
    varietyGrids.forEach((grid) => {
      const buttons = grid.querySelectorAll(".filter-pill");
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    });
  });

  // ---------------------------------------------------
  // FIX 2: SPECIAL REQUEST LIVE DISPLAY
  // Uses the existing #specialRequestPreview div in birthday.html.
  // ---------------------------------------------------
  const specialRequestInput = document.getElementById("specialRequestInput");
  const preview = document.getElementById("specialRequestPreview");

  if (specialRequestInput && preview) {
    specialRequestInput.addEventListener("input", () => {
      const value = specialRequestInput.value.trim();
      if (value.length > 0) {
        preview.innerHTML = `✅ Special Request Added: "<strong>${value}</strong>"`;
      } else {
        preview.innerHTML = "";
      }
    });
  }

  // ---------------------------------------------------
  // FIX 3: SLIDER DOT SYNC
  // Dots correctly highlight as the user swipes slides.
  // ---------------------------------------------------
  setupBirthdaySliderDotNavigation();
});

if (document.readyState !== "loading") {
  setupBirthdaySliderDotNavigation();
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", async () => {
  applyTheme(localStorage.getItem("bb_theme") || "light");
  updateCartUI();
  await loadProducts();
  initializeLiveSearch();
  filterProducts("all");
});

function toggleMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) {
    menu.classList.toggle("show");
  }
}

// --- GLOBAL BINDINGS ---
window.openCart = openCart;
window.closeCart = closeCart;
window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.addBirthdayToCart = addBirthdayToCart;
window.addDessertToCart = addDessertToCart;
window.addBrownieToCart = addBrownieToCart;
window.addCookieToCart = addCookieToCart;
window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.showCheckoutStep = showCheckoutStep;
window.sendOTP = sendOTP;
window.otpNext = otpNext;
window.verifyOTP = verifyOTP;
window.goToConfirm = goToConfirm;
window.placeOrder = placeOrder;
window.sendToWhatsApp = sendToWhatsApp;
window.filterProducts = filterProducts;
window.updatePriceFilter = updatePriceFilter;
window.selectSuggestion = selectSuggestion;
window.updateDessert = updateDessert;
window.setDessertBox = setDessertBox;
window.updateBrownie = updateBrownie;
window.setBrowniePack = setBrowniePack;
window.updateCookie = updateCookie;
window.setCookiePack = setCookiePack;
window.setBrownieWrap = setBrownieWrap;
window.toggleBirthdayFavourite = toggleBirthdayFavourite;
window.toggleBakeryFavourite = toggleBakeryFavourite;
window.isFavourite = isFavourite;
window.toggleFavourite = toggleFavourite;
