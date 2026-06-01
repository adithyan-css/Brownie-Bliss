// --- CONFIG ---
const API_BASE = '/api';

// --- SCROLL TO TOP (NEW FEATURE) ---
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 't') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// --- THEME ---
function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const next = isDark ? 'light' : 'dark';
  localStorage.setItem('bb_theme', next);
  applyTheme(next);
}
window.toggleTheme = toggleTheme;

// --- PRODUCTS DATA ---
let products = [];
let bdayCakes = {};
let selectedFlavor = 'Red Velvet';
let currentSearchTerm = '';
let selectedPriceFilter = 'all';
let recentSearches = JSON.parse(
  localStorage.getItem('brownie_recent_searches') || '[]'
);
let selectedWeight = '1.0';
const BIRTHDAY_BASE_PRICES = {
  0.5: 450,
  '1.0': 850,
  1.5: 1250,
  '2.0': 1600,
};

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Velvet Dream Cake',
    category: 'cakes',
    price: 850,
    img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860',
  },
  {
    id: 2,
    name: 'Dutch Truffle Delight',
    category: 'cakes',
    price: 950,
    img: 'assets/dutch_truffle.png',
  },
  {
    id: 3,
    name: 'Pineapple Fresh Cream',
    category: 'cakes',
    price: 675,
    img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg',
  },
];

const DEFAULT_BDAY_CAKES = {
  'Red Velvet': {
    price: 850,
    img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860',
  },
  'Dutch Truffle': {
    price: 950,
    img: 'assets/dutch_truffle.png',
  },
};

function buildCatalogFromList(list) {
    if (!Array.isArray(list) || list.length === 0) {
        products = DEFAULT_PRODUCTS;
        bdayCakes = { ...DEFAULT_BDAY_CAKES };
        return;
    }

    products = list
        .filter(p => p.type === 'standard')
        .map(p => ({
            id: p.id_ref,
            name: p.name,
            category: p.category,
            price: p.price,
            emoji: p.emoji,
            img: p.img,
            description: p.description || ''
        }));

    bdayCakes = {};
    list.filter(p => p.type === 'birthday').forEach(p => {
        bdayCakes[p.id_ref] = {
            price: p.price,
            emoji: p.emoji,
            img: p.img
        };
    });
}

function useFallbackProducts() {
    buildCatalogFromList(null);

  if (document.getElementById('productsGrid')) {
    filterProducts('all');
  }
  if (document.getElementById('cakePrice')) {
    calculateBdayPrice();
  }
}

const FAVOURITES_KEY = 'brownie_bliss_favourites';
const BROWNIE_BLISS_BAKERY = {
  id: 'brownie-bliss',
  name: 'Brownie Bliss',
  category: 'Homemade Bakery',
  location: 'Krishnagiri',
  img: 'https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338',
};

let favouriteItems = { bakeries: [], dishes: [] };
try {
  favouriteItems = JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || {
    bakeries: [],
    dishes: [],
  };
  if (!favouriteItems.bakeries) favouriteItems.bakeries = [];
  if (!favouriteItems.dishes) favouriteItems.dishes = [];
} catch (e) {
  console.error('Error parsing favourites from localStorage:', e);
}

function saveFavourites() {
  try {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favouriteItems));
  } catch (e) {
    console.error('Error saving favourites to localStorage:', e);
  }
}

function isFavourite(type, id) {
  return favouriteItems[type]?.some((item) => item.id === id) || false;
}

function toggleFavourite(type, item) {
  if (!favouriteItems[type]) favouriteItems[type] = [];
  const idx = favouriteItems[type].findIndex((f) => f.id === item.id);
  if (idx >= 0) {
    favouriteItems[type].splice(idx, 1);
    showToast('Removed from favourites 💔');
  } else {
    const exists = favouriteItems[type].some((f) => f.id === item.id);

    if (!exists) {
      favouriteItems[type].push(item);
    }
    showToast('Added to favourites ❤️');
  }
  saveFavourites();
  updateFavouriteButtons(type, item.id);
  updateFavouritesCount();
  renderFavouritesPage();
}

function updateFavouriteButtons(type, id) {
  document
    .querySelectorAll(
      `.favorite-btn[data-fav-type="${type}"][data-fav-id="${id}"]`
    )
    .forEach((btn) => {
      const active = isFavourite(type, id);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.innerHTML = active ? '&hearts;' : '&#9825;';
    });
}

function updateFavouritesCount() {
  const total =
    (favouriteItems.bakeries?.length || 0) +
    (favouriteItems.dishes?.length || 0);
  document
    .querySelectorAll('.fav-count, [data-favourites-count]')
    .forEach((el) => {
      el.textContent = total;
      el.style.display = total ? 'inline-block' : 'none';
    });
}

function toggleBakeryFavourite() {
  toggleFavourite('bakeries', BROWNIE_BLISS_BAKERY);
}

function toggleBirthdayFavourite() {
  toggleFavourite('dishes', getBirthdayFavouriteItem());
}

function renderFavouritesPage() {
  const bakeryGrid = document.getElementById('favouriteBakeriesGrid');
  const dishesGrid = document.getElementById('favouriteDishesGrid');
  const emptyState = document.getElementById('favouritesEmpty');

  const hasBakeries = favouriteItems.bakeries?.length > 0;
  const hasDishes = favouriteItems.dishes?.length > 0;

  const hasAnyFavourites = hasBakeries || hasDishes;

  if (emptyState) {
    emptyState.style.display = hasAnyFavourites ? 'none' : 'block';
  }
  if (!bakeryGrid && !dishesGrid) return;

  if (bakeryGrid) {
    bakeryGrid.innerHTML =
      favouriteItems.bakeries
        .map(
          (bakery) => `
      <article class="favourite-bakery-card">
        <img src="${bakery.img}" alt="${bakery.name}">
        <div class="favourite-bakery-info">
          <div class="product-category">${bakery.category || ''}</div>
          <h3>${bakery.name}</h3>
          <p>${bakery.location || ''}</p>
          <button class="add-to-cart favourite-remove" type="button"
            onclick='toggleFavourite("bakeries", ${JSON.stringify(bakery)})'>
            Remove Favourite
          </button>
        </div>
      </article>
    `
        )
        .join('') || '<p>No favourite bakeries yet.</p>';
  }

  if (dishesGrid) {
    dishesGrid.innerHTML =
      favouriteItems.dishes
        .map(
          (dish) => `
      <div class="product-card">
        <div class="product-img-wrap">
          <img src="${dish.img || 'https://via.placeholder.com/300'}" alt="${dish.name}">
          <button class="favorite-btn active" type="button"
            data-fav-type="dishes" data-fav-id="${dish.id}"
            aria-label="Remove ${dish.name} from favourites" aria-pressed="true"
            title="Remove from favourites"
            onclick='toggleFavourite("dishes", ${JSON.stringify(dish)})'>
            &hearts;
          </button>
        </div>
        <div class="product-info">
          <div class="product-category">${dish.category || 'favourite'}</div>
          <div class="product-name">${dish.name}</div>
          ${dish.price ? `<div class="product-price">₹${dish.price}</div>` : ''}
          <button class="add-to-cart" onclick='addToCart(${JSON.stringify(dish)})'>
            Add to Cart
          </button>
        </div>
      </div>
    `
        )
        .join('') || '<p>No favourite dishes yet.</p>';
  }
}
function buildCatalogFromList(list) {
  if (list && Array.isArray(list) && list.length) {
    products = list
      .filter((p) => p.type === 'standard')
      .map((p) => ({
        id: p.id_ref,
        name: p.name,
        category: p.category,
        price: p.price,
        emoji: p.emoji,
        img: p.img,
        description: p.description || '',
      }));

    bdayCakes = {};
    const bd = list.filter((p) => p.type === 'birthday');
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
        .filter((p) => p.type === 'standard')
        .map((p) => ({
          id: p.id_ref,
          name: p.name,
          category: p.category,
          price: p.price,
          emoji: p.emoji,
          img: p.img,
          stock: p.stock,
          description: p.description || '',
        }));

      bdayCakes = {};
      const bd = data.products.filter((p) => p.type === 'birthday');
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
    console.error('Error loading products from database:', e);
    useFallbackProducts();
  }

  if (document.getElementById('productsGrid')) {
    filterProducts('all');

    updateFavouritesCount();

    renderFavouritesPage();
  }
  if (document.getElementById('cakePrice')) {
    calculateBdayPrice();
  }
}

// --- CART STATE ---
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem('brownie_bliss_cart') || '[]');
  if (!Array.isArray(cart)) cart = [];
} catch (e) {
  console.error('Error parsing cart from localStorage:', e);
  cart = [];
}

let checkoutState = {
  name: '',
  phone: '',
  address: '',
  city: '',
  pincode: '',
  verified: false,
  currentStep: 1,
};

function saveCart() {
  try {
    localStorage.setItem('brownie_bliss_cart', JSON.stringify(cart));
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
  }
}

const cartFooter = document.getElementById('cartFooter');
const cartTotal = document.getElementById('cartTotal');

// --- CART UI ---
function updateCartUI() {
  const cartContainer = document.getElementById('cartItems');
  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = `
  <div class="cart-empty-state">
    <div class="empty-cart-icon">🍫</div>

    <h2>Your cart is empty</h2>

    <p>
      Looks like you haven't added any brownies yet.
    </p>

    <a href="products.html" class="shop-now-btn">
      Shop Now
    </a>
  </div>
`;
    if (cartFooter) cartFooter.style.display = 'none';
  } else {
    cartContainer.innerHTML = cart
      .map((item, index) => {
        const c = item.customizations;
        let customBadges = '';
        if (c) {
          if (c.dietary)
            customBadges += `<span class="cart-custom-badge">${c.dietary === 'eggless' ? '🌱 Eggless' : '🥚 Egg'}</span>`;
          if (c.toppings && c.toppings.length)
            customBadges += c.toppings
              .map((t) => `<span class="cart-custom-badge">+ ${t.name}</span>`)
              .join('');
          if (c.message)
            customBadges += `<span class="cart-custom-badge cart-custom-msg">✉ "${c.message}"</span>`;
        } else if (item.message) {
          customBadges = `<span class="cart-custom-badge cart-custom-msg">✉ "${item.message}"</span>`;
        }
        return `
            <div class="cart-item">
                <img src="${item.img || 'https://via.placeholder.com/70'}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                    ${customBadges ? `<div class="cart-custom-tags">${customBadges}</div>` : ''}
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
      .join('');
    if (cartFooter) cartFooter.style.display = 'block';
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
  }
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  badge.textContent = count;
}

// FIXED ADD TO CART
function addToCart(product) {
  if (product.stock === 0) {
    showToast('This item is sold out 😞');
    return;
  }

  const existing = cart.find((i) => {
    if (i.name !== product.name || i.message !== product.message) return false;
    const hasCustom1 = !!i.customizations;
    const hasCustom2 = !!product.customizations;
    if (hasCustom1 !== hasCustom2) return false;
    if (hasCustom1 && hasCustom2) {
      return (
        JSON.stringify(i.customizations) ===
        JSON.stringify(product.customizations)
      );
    }
    return true;
  });

  if (existing) {
    existing.qty++;
  } else {
    const newItem = { ...product };
    if (!newItem.qty) newItem.qty = 1;
    cart.push(newItem);
  }

  saveCart();
  updateCartUI();
  showToast('Added to cart! 🛒');
}

// FIXED QTY
function changeQty(index, delta) {
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function removeFromCart(index) {
  if (cart[index]) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    showToast('Removed from cart 🗑️');
  }
}

function openCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('open');
}

function closeCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// --- LIVE PRODUCT SEARCH ---

function initializeLiveSearch() {
  const searchInput = document.getElementById('productSearch');

  const suggestionsBox = document.getElementById('searchSuggestions');

  const clearBtn = document.getElementById('clearSearchBtn');

  if (!searchInput) return;

  renderRecentSearches();

  searchInput.addEventListener('input', function () {
    const value = this.value.trim();

    currentSearchTerm = value;

    if (value.length > 0) {
      clearBtn.style.display = 'block';
      generateSuggestions(value);
    } else {
      clearBtn.style.display = 'none';
      suggestionsBox.style.display = 'none';
    }

    filterProducts('all');
  });

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const value = this.value.trim();

      if (value) {
        saveRecentSearch(value);
      }

      suggestionsBox.style.display = 'none';
    }
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchTerm = '';

    clearBtn.style.display = 'none';

    suggestionsBox.style.display = 'none';

    filterProducts('all');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-section')) {
      suggestionsBox.style.display = 'none';
    }
  });
}

function generateSuggestions(searchTerm) {
  const suggestionsBox = document.getElementById('searchSuggestions');

  if (!suggestionsBox) return;

  const term = searchTerm.toLowerCase();

  const matches = products
    .filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.description || '').toLowerCase().includes(term)
      );
    })
    .slice(0, 5);

  if (!matches.length) {
    suggestionsBox.style.display = 'none';
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
    `
    )
    .join('');

  suggestionsBox.style.display = 'block';
}

function selectSuggestion(value) {
  const searchInput = document.getElementById('productSearch');

  const suggestionsBox = document.getElementById('searchSuggestions');

  if (!searchInput) return;

  searchInput.value = value;

  currentSearchTerm = value;

  saveRecentSearch(value);

  filterProducts('all');

  suggestionsBox.style.display = 'none';
}

function highlightMatch(text, term) {
  if (!term) return text;

  const regex = new RegExp(`(${term})`, 'gi');

  return text.replace(regex, `<span class="highlight-match">$1</span>`);
}

function saveRecentSearch(search) {
  if (!search) return;

  recentSearches = recentSearches.filter((item) => item !== search);

  recentSearches.unshift(search);

  recentSearches = recentSearches.slice(0, 5);

  localStorage.setItem(
    'brownie_recent_searches',
    JSON.stringify(recentSearches)
  );

  renderRecentSearches();
}

function renderRecentSearches() {
  const container = document.getElementById('recentSearches');

  if (!container) return;

  if (!recentSearches.length) {
    container.innerHTML = '';
    return;
  }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <div class="product-img-wrap">
                <img src="${p.img}" alt="${p.name}" style="cursor:pointer" onclick='openCustomizeModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
                <button class="favorite-btn ${isFavourite('dishes', p.id) ? 'active' : ''}"
                    type="button"
                    data-fav-type="dishes"
                    data-fav-id="${p.id}"
                    aria-label="Toggle ${p.name} favourite"
                    aria-pressed="${isFavourite('dishes', p.id) ? 'true' : 'false'}"
                    title="${isFavourite('dishes', p.id) ? 'Remove from favourites' : 'Add to favourites'}"
                    onclick='event.stopPropagation(); toggleFavourite("dishes", ${JSON.stringify(p)})'>
                    ${isFavourite('dishes', p.id) ? '&hearts;' : '&#9825;'}
                </button>
                ${p.id < 4 ? '<div class="bestseller-badge">⭐ Bestseller</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <div class="product-name">${p.name}</div>
                ${p.description ? `<div class="product-desc">${p.description}</div>` : ''}
                <div class="product-price">₹${p.price}</div>
                <button type="button" class="add-to-cart" data-product-id="${String(p.id)}">Add to Cart</button>
                <button
                    type="button"
                    class="customize-and-add"
                    onclick='openCustomizeModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
                <button class="add-to-cart">
                    Customize & Add
                </button>
            </div>
        </div>
    `).join('');
}

function updatePriceFilter() {
  const filter = document.getElementById('priceFilter');

  if (!filter) return;

  selectedPriceFilter = filter.value;

  filterProducts('all');
}

window.updatePriceFilter = updatePriceFilter;
window.selectSuggestion = selectSuggestion;

// --- PRODUCT FILTERING ---
function filterProducts(category = 'all', btn = null) {
  const grid = document.getElementById('productsGrid');

  if (!grid) return;

  if (btn) {
    btn.parentElement
      .querySelectorAll('.filter-tab')
      .forEach((b) => b.classList.remove('active'));

    btn.classList.add('active');
  }

  let filtered =
    category === 'all'
      ? [...products]
      : products.filter((p) => p.category === category);

  if (currentSearchTerm.trim()) {
    const term = currentSearchTerm.toLowerCase();

    filtered = filtered.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.description || '').toLowerCase().includes(term)
      );
    });
  }

  const emptyState = document.getElementById('noProductsFound');

  if (emptyState) {
    emptyState.style.display = filtered.length ? 'none' : 'block';
  }

  grid.innerHTML = filtered
    .map(
      (p) => `
  <div class="product-card">

    <div class="product-img-wrap">

      <img src="${p.img}" alt="${p.name}">

      <button
        class="favorite-btn ${isFavourite('dishes', p.id) ? 'active' : ''}"
        type="button"
        data-fav-type="dishes"
        data-fav-id="${p.id}"
        aria-label="Toggle favourite"
        aria-pressed="${isFavourite('dishes', p.id)}"
        onclick='toggleFavourite("dishes", ${JSON.stringify(p)})'
      >
        ${isFavourite('dishes', p.id) ? '&hearts;' : '&#9825;'}
      </button>

    </div>

    <div class="product-info">

      <div class="product-category">
        ${p.category}
      </div>

      <div class="product-name">
        ${p.name}
      </div>

      <div class="product-desc">
        ${p.description || ''}
      </div>

      <div class="product-price">
        ₹${p.price}
      </div>

      <button
        class="add-to-cart"
        onclick='addToCart(${JSON.stringify(p)})'
      >
        Add To Cart
      </button>

    </div>

  </div>
`
    )
    .join('');
}

// --- BIRTHDAY CAKE BUILDER ---
// bdayCakes object is now populated dynamically via loadProducts()

function updateBirthdayCake(flavor) {
  if (!bdayCakes[flavor]) {
    console.error('Cake flavor not found:', flavor);
    return;
  }

  selectedFlavor = flavor;

  // Update image
  const cakeImg = document.getElementById('birthdayCakeImg');
  if (cakeImg && bdayCakes[flavor]) {
    cakeImg.src = bdayCakes[flavor].img;
  }

  if (cakeImg) {
    cakeImg.src = bdayCakes[flavor].img;
  }

  // Update active flavor button
  document.querySelectorAll('.filter-pill').forEach((btn) => {
    if (btn.textContent.trim() === flavor) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  calculateBdayPrice();
}

function setCakeWeight(weight, event) {
  selectedWeight = weight;

  document
    .querySelectorAll('.weight-btn')
    .forEach((b) => b.classList.remove('active'));

  if (event?.target) event.target.classList.add('active');

  calculateBdayPrice();
}

function calculateBdayPrice() {
  const price = BIRTHDAY_BASE_PRICES[selectedWeight] || 850;

  const priceEl = document.getElementById('cakePrice');
  if (priceEl) {
    priceEl.textContent = `₹ ${price}`;
  }

  updateBirthdayFavouriteButton();
}

function getBirthdayFavouriteItem() {
  const cake = bdayCakes[selectedFlavor] || {};

  return {
    id: `bday-${selectedFlavor}-${selectedWeight}`,
    name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
    price: BIRTHDAY_BASE_PRICES[selectedWeight],
    img: cake.img || document.getElementById('birthdayCakeImg')?.src || '',
    emoji: cake.emoji || '',
    category: 'cakes',
  };
}

function updateBirthdayFavouriteButton() {
  const btn = document.getElementById('birthdayFavoriteBtn');
  if (!btn) return;

  const item = getBirthdayFavouriteItem();
  const active = isFavourite('dishes', item.id);

  btn.dataset.favType = 'dishes';
  btn.dataset.favId = item.id;
  btn.classList.toggle('active', active);
  btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  btn.setAttribute(
    'title',
    active ? 'Remove from favourites' : 'Add to favourites'
  );

  btn.innerHTML = active ? '&hearts;' : '&#9825;';
}

function sendWhatsAppFinal(orderId, itemsSnap, orderTotal) {
  const lines = Array.isArray(itemsSnap) && itemsSnap.length ? itemsSnap : cart;

  const total =
    typeof orderTotal === 'number'
      ? orderTotal
      : lines.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);

  const itemLines = lines
    .map((i) => {
      let line = `• ${i.name} × ${i.qty} = ₹${(
        Number(i.price) * Number(i.qty)
      ).toLocaleString('en-IN')}`;

      if (i.customizations) {
        const c = i.customizations;

        const details = [];

        if (c.dietary) {
          details.push(c.dietary === 'eggless' ? 'Eggless' : 'Egg');
        }

        if (c.toppings?.length) {
          details.push(c.toppings.map((t) => `+${t.name}`).join(', '));
        }

        if (c.message) {
          details.push(`Msg: "${c.message}"`);
        }

        if (details.length) {
          line += `\n   _${details.join(' | ')}_`;
        }
      }

      return line;
    })
    .join('\n');

  const message =
    `🍫 *New Order Received — Brownie Bliss*\n\n` +
    `📋 *Order ID:* ${orderId}\n` +
    `👤 *Customer:* ${checkoutState.name}\n` +
    `📱 *Phone:* +91 ${checkoutState.phone}\n` +
    `📍 *Address:* ${checkoutState.address}, ${checkoutState.city} - ${checkoutState.pincode}\n\n` +
    `🛒 *Order Details:*\n${itemLines}\n\n` +
    `💰 *Total Amount: ₹${total.toLocaleString('en-IN')}*\n\n` +
    `_Your order has been recorded. Please share payment receipt for confirmation!_ ✨`;

  const waUrl = `https://wa.me/918072596340?text=${encodeURIComponent(message)}`;

  window.open(waUrl, '_blank');
}

// Scroll to top function
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 1000,
    once: true,
    easing: 'ease-in-out',
  });
}
// ============================================================
// TOAST & ADDITIONAL HELPERS
// ============================================================
const BIRTHDAY_FALLBACKS = DEFAULT_BDAY_CAKES;

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = msg; // innerHTML to allow the track-order anchor
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 5000);
}

function addBirthdayToCart() {
  const cakeInfo =
    bdayCakes[selectedFlavor] ||
    BIRTHDAY_FALLBACKS[selectedFlavor] ||
    BIRTHDAY_FALLBACKS['Red Velvet'];

  const msgInput = document.getElementById('cakeMessage');
  const message = msgInput ? msgInput.value.trim() : '';

  addToCart({
    id: `bday-${selectedFlavor}-${selectedWeight}`,
    name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
    price: BIRTHDAY_BASE_PRICES[selectedWeight] || 850,
    img: cakeInfo.img,
    emoji: cakeInfo.emoji || '🎂',
    category: 'cakes',
    message,
    qty: 1,
  });

  showToast('🎂 Birthday cake added to cart!');
  if (msgInput) msgInput.value = '';
  openCart();
}

function addDessertToCart() {
  const item = {
    id: 'dessert-macarons',
    name: 'Assorted Macarons (Box of 4)',
    price: 350,
    img: 'https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427',
    emoji: '🍮',
    category: 'desserts',
    qty: 1,
  };
  addToCart(item);
  openCart();
}

function addBrownieToCart() {
  const item = {
    id: 'brownie-overload',
    name: 'Overload Brownie (Pack of 4)',
    price: 250,
    img: 'https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338',
    emoji: '🍫',
    category: 'brownies',
    qty: 1,
  };
  addToCart(item);
  openCart();
}

function addCookieToCart() {
  const item = {
    id: 'cookie-choco-chip',
    name: 'Choco Chip Cookies (Box of 6)',
    price: 250,
    img: 'https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg',
    emoji: '🍪',
    category: 'cookies',
    qty: 1,
  };
  addToCart(item);
  openCart();
}

function sendToWhatsApp() {
  openCheckout();
}

// ============================================================
// CHECKOUT & OTP VERIFICATION
// ============================================================
function injectCheckoutModal() {
  if (document.getElementById('checkoutOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'checkoutOverlay';
  overlay.className = 'checkout-overlay';
  overlay.innerHTML = `
    <div class="checkout-modal">
      <div class="checkout-head">
        <div class="checkout-steps">
          <div class="step-indicator active" id="step1ind">1</div>
          <div class="step-line"></div>
          <div class="step-indicator" id="step2ind">2</div>
          <div class="step-line"></div>
          <div class="step-indicator" id="step3ind">3</div>
          <div class="step-line"></div>
          <div class="step-indicator" id="step4ind">4</div>
        </div>
        <button class="checkout-close" onclick="closeCheckout()">✕</button>
      </div>
      <div class="checkout-body">
        <!-- STEP 1: CONTACT -->
        <div id="checkStep1">
          <h3 class="checkout-title">Contact Information</h3>
          <p class="checkout-subtitle">We'll use this to coordinate your delivery.</p>
          <div class="form-group">
            <label>Your Name</label>
            <input type="text" id="custName" placeholder="e.g. Adithi" required>
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <div class="phone-input-group">
              <span class="prefix">+91</span>
              <input type="tel" id="custPhone" placeholder="10-digit number" maxlength="10">
            </div>
          </div>
          <button class="hero-cta" style="width:100%;margin-top:20px;" onclick="sendOTP()">
            Send Verification OTP &rarr;
          </button>
        </div>
        <!-- STEP 2: OTP -->
        <div id="checkStep2" class="hidden">
          <h3 class="checkout-title">Confirm Number</h3>
          <p class="checkout-subtitle">Enter the 6-digit code sent to <strong id="otpPhoneDisp"></strong></p>
          <div class="otp-container">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this, 0)">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this, 1)">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this, 2)">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this, 3)">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this, 4)">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this, 5)">
          </div>
          <button class="hero-cta" style="width:100%;" onclick="verifyOTP()">
            Verify &amp; Continue &rarr;
          </button>
          <button class="text-link" onclick="showCheckoutStep(1)">Change Phone Number</button>
        </div>
        <!-- STEP 3: ADDRESS -->
        <div id="checkStep3" class="hidden">
          <h3 class="checkout-title">Delivery Details</h3>
          <p class="checkout-subtitle">Where should we bring your treats?</p>
          <div class="form-group">
            <label>Street Address</label>
            <textarea id="custAddr" placeholder="House No, Street, Area..."></textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
            <div class="form-group">
              <label>City</label>
              <input type="text" id="custCity" placeholder="City">
            </div>
            <div class="form-group">
              <label>Pincode</label>
              <input type="text" id="custPin" placeholder="6-digit" maxlength="6">
            </div>
          </div>
          <button class="hero-cta" style="width:100%;margin-top:20px;" onclick="goToConfirm()">
            Review Order &rarr;
          </button>
        </div>
        <!-- STEP 4: CONFIRM -->
        <div id="checkStep4" class="hidden">
          <h3 class="checkout-title">Final Review</h3>
          <div class="confirm-summary">
            <div class="confirm-section">
              <label>Delivery to</label>
              <div id="confirmCustomer"></div>
            </div>
            <div class="confirm-section">
              <label>Order Items</label>
              <div id="confirmItems"></div>
              <div class="confirm-total">
                <span>Total Payable</span>
                <strong id="confirmTotal"></strong>
              </div>
            </div>
          </div>
          <button class="whatsapp-btn" style="border-radius:0;" onclick="placeOrder()">
            Place Order &amp; Confirm via WhatsApp &rarr;
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function openReviewModal(){
  document.getElementById("reviewModal").style.display="flex";
}

function closeReviewModal(){
  document.getElementById("reviewModal").style.display="none";
}

document.getElementById("reviewForm").addEventListener("submit", function(e){
  e.preventDefault();

  const review = document.getElementById("reviewText").value;

  console.log("Review submitted: ", review);

  showToast("Thank you for your feedback!");
  this.reset();
  closeReviewModal();
});

function openCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty! 🍫');
    return;
  }
  injectCheckoutModal();
  closeCart();
  checkoutState = {
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    verified: false,
    currentStep: 1,
  };
  showCheckoutStep(1);
  document.getElementById('checkoutOverlay').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutOverlay')?.classList.remove('open');
}

function showCheckoutStep(n) {
  checkoutState.currentStep = n;
  [1, 2, 3, 4].forEach((i) => {
    const step = document.getElementById(`checkStep${i}`);
    const ind = document.getElementById(`step${i}ind`);
    if (step) step.classList.toggle('hidden', i !== n);
    if (ind) {
      ind.classList.remove('active', 'done');
      if (i < n) ind.classList.add('done');
      if (i === n) ind.classList.add('active');
    }
  });
}

async function sendOTP() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();

  if (!name) {
    showToast('Please enter your name');
    return;
  }
  if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
    showToast('Enter a valid 10-digit phone number');
    return;
  }

  checkoutState.name = name;
  checkoutState.phone = phone;

  const btn = document.querySelector('#checkStep1 .hero-cta');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sending...';
  }

  try {
    const res = await fetch(`${API_BASE}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('otpPhoneDisp').textContent = '+91 ' + phone;
      showCheckoutStep(2);
      showToast('OTP sent! Check your phone.');
    } else {
      showToast(data.message || 'Failed to send OTP. Try again.');
    }
  } catch {
    showToast('Server error. Please try again.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Send Verification OTP →';
    }
  }
}

function otpNext(input, idx) {
  input.value = input.value.replace(/\D/, '');
  if (input.value && idx < 5) {
    document.querySelectorAll('.otp-box')[idx + 1]?.focus();
  }
}

async function verifyOTP() {
  const otp = [...document.querySelectorAll('.otp-box')]
    .map((b) => b.value)
    .join('');
  if (otp.length !== 6) {
    showToast('Enter all 6 digits');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: checkoutState.phone, otp }),
    });
    const data = await res.json();
    if (data.success) {
      checkoutState.verified = true;
      showToast('✅ Phone verified!');
      showCheckoutStep(3);
    } else {
      showToast(data.message || 'Invalid code. Try again.');
    }
  } catch {
    showToast('Verification failed. Try again.');
  }
}

function goToConfirm() {
  const addr = document.getElementById('custAddr').value.trim();
  const city = document.getElementById('custCity').value.trim();
  const pin = document.getElementById('custPin').value.trim();

  if (!addr) {
    showToast('Enter your street address');
    return;
  }
  if (!city) {
    showToast('Enter your city');
    return;
  }
  if (!pin || pin.length !== 6) {
    showToast('Enter valid 6-digit pincode');
    return;
  }

  checkoutState.address = addr;
  checkoutState.city = city;
  checkoutState.pincode = pin;

  document.getElementById('confirmCustomer').innerHTML = `
    <div style="font-weight:600;color:var(--brown-dark)">${checkoutState.name}</div>
    <div style="font-size:13px;color:var(--text-mid);margin-bottom:4px">+91 ${checkoutState.phone}</div>
    <div style="font-size:13px;color:var(--text-mid);line-height:1.4">${addr}, ${city} - ${pin}</div>
  `;

  document.getElementById('confirmItems').innerHTML = cart
    .map(
      (i) => `
    <div class="confirm-row">
      <span>${i.name} × ${i.qty}</span>
      <strong style="color:var(--brown-warm)">₹${(i.price * i.qty).toLocaleString('en-IN')}</strong>
    </div>
  `
    )
    .join('');

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('confirmTotal').textContent =
    `₹${total.toLocaleString('en-IN')}`;
  showCheckoutStep(4);
}

async function placeOrder() {
  const itemsSnap = cart.map((i) => ({ ...i })); // snapshot before clearing
  const orderTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const orderData = {
    customer_name: checkoutState.name,
    phone: checkoutState.phone,
    address: checkoutState.address,
    city: checkoutState.city,
    pincode: checkoutState.pincode,
    items: itemsSnap.map((i) => ({
      id: typeof i.id === 'number' ? i.id : 0,
      name: i.name,
      price: i.price,
      qty: i.qty,
      emoji: i.emoji || '🍫',
      category: i.category || 'general',
      customizations: i.customizations || null,
    })),
    total: orderTotal,
  };

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (data.success) {
      const orderId = data.order_id;
      sendWhatsAppFinal(orderId, itemsSnap, orderTotal);

      cart = [];
      saveCart();
      updateCartUI();
      closeCheckout();
      showToast(
        `🎉 Order ${orderId} placed! <a href="track.html?id=${orderId}" class="toast-track-link">Track Order</a>`
      );
    } else {
      showToast('Failed to save order. Please try again.');
    }
  } catch {
    showToast('Error placing order. Please try again.');
  }
}

// ============================================================
// ORDER TRACKING
// ============================================================
async function trackOrder(id) {
  const orderIdInput = document.getElementById('orderIdInput');
  const trackError = document.getElementById('trackError');
  const result = document.getElementById('result');

  if (!orderIdInput) return;

  if (trackError) {
    trackError.classList.remove('show');
    trackError.textContent = '';
  }
  if (result) result.style.display = 'none';

  const orderId = id || orderIdInput.value.trim();
  if (!orderId) {
    if (trackError) {
      trackError.textContent = 'Please enter an Order ID';
      trackError.classList.add('show');
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`);
    const data = await res.json();
    if (data.success || data.order) {
      renderOrderDetails(data.order || data);
      if (result) result.style.display = 'block';
    } else {
      if (trackError) {
        trackError.textContent = data.error || 'Order not found';
        trackError.classList.add('show');
      }
    }
  } catch (e) {
    console.error(e);
    if (trackError) {
      trackError.textContent =
        'Error fetching order. Make sure server is running!';
      trackError.classList.add('show');
    }
  }
}

function renderOrderDetails(order) {
  const resOrderId = document.getElementById('resOrderId');
  if (!resOrderId) return;

  resOrderId.textContent = order.id || order.order_id;

  const resTotalTop = document.getElementById('resTotalTop');
  if (resTotalTop) resTotalTop.textContent = order.total;

  const resDate = document.getElementById('resDate');
  if (resDate && order.created_at) {
    resDate.textContent = new Date(order.created_at).toLocaleString();
  }

  let itemsHtml = '';
  try {
    const items =
      typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    itemsHtml = items
      .map((i) => {
        const itemTotal = i.price && i.qty ? i.price * i.qty : i.price || 0;
        const priceHtml = itemTotal
          ? `₹${itemTotal.toLocaleString('en-IN')}`
          : '';
        return `<tr>
                        <td>${i.emoji || ''} ${i.name} × ${i.qty}</td>
                        <td class="text-right track-item-price">${priceHtml}</td>
                    </tr>`;
      })
      .join('');
  } catch (e) {
    itemsHtml = `<tr><td colspan="2">${order.items}</td></tr>`;
  }

  const resItems = document.getElementById('resItems');
  if (resItems) resItems.innerHTML = itemsHtml;

  const resTotal = document.getElementById('resTotal');
  if (resTotal) resTotal.textContent = order.total;

  const statusLower = (order.status || 'pending').toLowerCase();
  const timeline = document.getElementById('trackingTimeline');
  const cancelledAlert = document.getElementById('cancelledAlert');

  if (timeline && cancelledAlert) {
    if (statusLower === 'cancelled') {
      timeline.style.display = 'none';
      cancelledAlert.style.display = 'block';
    } else {
      timeline.style.display = 'block';
      cancelledAlert.style.display = 'none';

      const steps = ['pending', 'confirmed', 'preparing', 'delivered'];
      const currentIndex = Math.max(steps.indexOf(statusLower), 0);

      steps.forEach((s, i) => {
        const el = document.getElementById(`step-${s}`);
        if (!el) return;
        el.classList.remove('active', 'completed');
        if (i < currentIndex) el.classList.add('completed');
        else if (i === currentIndex) el.classList.add('active');
      });
    }
  }
}

// --- INIT & SCROLL EVENT ---
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(localStorage.getItem('bb_theme') || 'light');
  updateCartUI();
  updateFavouritesCount();
  renderFavouritesPage();
  updateFavouriteButtons('bakeries', BROWNIE_BLISS_BAKERY.id);
  initStarRatings();

  // Track Order auto-fill if on track.html
  const urlParams = new URLSearchParams(window.location.search);
  const idParam = urlParams.get('id');
  const input = document.getElementById('orderIdInput');
  if (idParam && input) {
    input.value = idParam;
    trackOrder(idParam);
  }

  await loadProducts();
  initializeLiveSearch();
});

window.addEventListener('scroll', function () {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  if (window.scrollY > 300) {
    btn.style.display = 'flex';
  } else {
    btn.style.display = 'none';
  }
});

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.classList.toggle('show');
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
window.toggleBakeryFavourite = toggleBakeryFavourite;
window.toggleBirthdayFavourite = toggleBirthdayFavourite;
window.scrollToTop = scrollToTop;
window.trackOrder = trackOrder;
window.showToast = showToast;
window.updateBirthdayCake = updateBirthdayCake;
window.setCakeWeight = setCakeWeight;
window.toggleMenu = toggleMenu;

function initStarRatings() {
  document.querySelectorAll('.star-rating').forEach((container) => {
    const stars = container.querySelectorAll('span');
    const inactiveColor =
      container.getAttribute('data-inactive-color') || '#ccc';

    // Set explicit colors initially based on current rating attribute
    const initialRating = parseInt(
      container.getAttribute('data-rating') || '4',
      10
    );
    stars.forEach((star, index) => {
      star.style.color = index < initialRating ? 'var(--gold)' : inactiveColor;
    });

    stars.forEach((star, index) => {
      // Hover effect
      star.addEventListener('mouseover', () => {
        stars.forEach((s, idx) => {
          s.style.color = idx <= index ? 'var(--gold)' : inactiveColor;
        });
      });

      // Mouse out restores current rating
      star.addEventListener('mouseout', () => {
        const rating = parseInt(
          container.getAttribute('data-rating') || '0',
          10
        );
        stars.forEach((s, idx) => {
          s.style.color = idx < rating ? 'var(--gold)' : inactiveColor;
        });
      });

      // Click to set rating
      star.addEventListener('click', () => {
        const val = index + 1;
        container.setAttribute('data-rating', val);
        stars.forEach((s, idx) => {
          s.style.color = idx < val ? 'var(--gold)' : inactiveColor;
        });
      });
    });

    // Reset event handler on parent form (if any)
    const form = container.closest('form');
    if (form) {
      form.addEventListener('reset', () => {
        setTimeout(() => {
          container.setAttribute('data-rating', '4');
          stars.forEach((s, idx) => {
            s.style.color = idx < 4 ? 'var(--gold)' : inactiveColor;
          });
        }, 0);
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateFavouritesCount();
  renderFavouritesPage();
  updateFavouriteButtons('bakeries', BROWNIE_BLISS_BAKERY.id);
});
