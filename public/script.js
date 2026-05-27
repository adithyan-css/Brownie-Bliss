// =========================================
// BROWNIE BLISS — script.js
// =========================================

// --- CONFIG ---
const API_BASE = '/api';

// =========================================
// THEME
// =========================================

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

// =========================================
// MOBILE MENU
// =========================================

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('show');
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.mobile-menu a').forEach(function (link) {
    link.addEventListener('click', function () {
      const menu = document.getElementById('mobileMenu');
      if (menu) menu.classList.remove('show');
    });
  });
});

// =========================================
// PRODUCTS DATA & STATE
// =========================================

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
  '0.5': 450,
  '1.0': 850,
  '1.5': 1250,
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
    img: 'https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180',
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
    img: 'https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180',
  },
  'Pineapple': {
    price: 750,
    img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg?v=1711124785',
  },
  'Chocoholic': {
    price: 900,
    img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267',
  },
  'Black Forest': {
    price: 850,
    img: 'https://sweetandsavorymeals.com/wp-content/uploads/2020/02/black-forest-cake-recipe-SweetAndSavoryMeals4-1054x1536.jpg',
  },
  'Cheesecake': {
    price: 950,
    img: 'https://www.inspiredtaste.net/wp-content/uploads/2024/03/New-York-Cheesecake-Recipe-1.jpg',
  },
};

function useFallbackProducts() {
  products = DEFAULT_PRODUCTS;
  bdayCakes = { ...DEFAULT_BDAY_CAKES };

  if (document.getElementById('productsGrid')) {
    filterProducts('all');
  }
  if (document.getElementById('cakePrice')) {
    calculateBdayPrice();
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
          description: p.description || '',
        }));

      bdayCakes = {};
      const bd = data.products.filter((p) => p.type === 'birthday');

        const bd = list.filter(p => p.type === 'birthday');
        bdayCakes = {};
        bd.forEach(p => {
            bdayCakes[p.id_ref] = {
                price: p.price,
                emoji: p.emoji,
                stock: p.stock,
                img: p.img
            }));

            const bd = data.products.filter(p => p.type === 'birthday');

            bd.forEach(p => {
                bdayCakes[p.id_ref] = {
                    price: p.price,
                    emoji: p.emoji,
                    img: p.img
                };
            });

        } else {
            useFallbackProducts();
        }

    } catch (e) {
        console.error('Error loading products from database:', e);
        useFallbackProducts();
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
  } catch (e) {
    console.error('Error loading products from database:', e);
    useFallbackProducts();
  }

  if (document.getElementById('productsGrid')) {
    filterProducts('all');
  }

  if (document.getElementById('cakePrice')) {
    calculateBdayPrice();
  }
}

// =========================================
// CART STATE
// =========================================

let cart = JSON.parse(localStorage.getItem('brownie_bliss_cart') || '[]');
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
  localStorage.setItem('brownie_bliss_cart', JSON.stringify(cart));
}

// =========================================
// CART UI
// =========================================

const cartFooter = document.getElementById('cartFooter');
const cartTotal = document.getElementById('cartTotal');

function updateCartUI() {
  const cartContainer = document.getElementById('cartItems');
  const badge = document.getElementById('cartBadge');

  if (badge) {
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    badge.textContent = totalQty;
  }

  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="cart-empty-state">
        <div class="empty-cart-icon">🍫</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any brownies yet.</p>
        <a href="products.html" class="shop-now-btn">Shop Now</a>
      </div>`;
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
          </div>`;
      })
      .join('');
    if (cartFooter) cartFooter.style.display = 'block';
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
  }
}

function addToCart(product) {
  const existing = cart.find((i) => i.name === product.name && !product.customizations);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showToast('Added to cart! 🛒');
}

function changeQty(index, delta) {
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function openCart() {
  document.getElementById('cartSidebar')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
}

function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
}

// =========================================
// LIVE PRODUCT SEARCH & FILTERS
// =========================================

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
      if (clearBtn) clearBtn.style.display = 'block';
      generateSuggestions(value);
    } else {
      if (clearBtn) clearBtn.style.display = 'none';
      if (suggestionsBox) suggestionsBox.style.display = 'none';
    }
    filterProducts('all');
  });

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const value = this.value.trim();
      if (value) {
        saveRecentSearch(value);
      }
      if (suggestionsBox) suggestionsBox.style.display = 'none';
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchTerm = '';
      clearBtn.style.display = 'none';
      if (suggestionsBox) suggestionsBox.style.display = 'none';
      filterProducts('all');
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-section') && suggestionsBox) {
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
        <div class="search-suggestion-item" onclick="selectSuggestion('${product.name.replace(/'/g, "\\'")}')">
            🔍 ${highlightMatch(product.name, searchTerm)}
        </div>`
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
  if (suggestionsBox) suggestionsBox.style.display = 'none';
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
  localStorage.setItem('brownie_recent_searches', JSON.stringify(recentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  const container = document.getElementById('recentSearches');
  if (!container) return;

  if (!recentSearches.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
        ${recentSearches
          .map(
            (search) => `
            <div
                class="recent-search-tag"
                onclick="selectSuggestion('${search.replace(/'/g, "\\'")}')"
            >
                ${search}
            </div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <div class="product-name">${p.name}</div>
                ${p.description ? `<div class="product-desc">${p.description}</div>` : ''}
                <div class="product-price">₹${p.price}</div>
                <div class="stock-status ${
                 p.stock === 0
                 ? 'sold-out'
                 : p.stock <= 3
                 ? 'low-stock'
                 : 'available'}">${
                p.stock === 0
                ? 'Sold Out'
                : p.stock <= 3
                ? 'Low Stock'
                : 'Available'}</div>
                <button class="add-to-cart" ${p.stock === 0 ? 'disabled' : ''}
                onclick='addToCart(${JSON.stringify(p)})'>
               ${p.stock === 0 ? 'Sold Out' : 'Add to Cart'}</button>
                <button class="add-to-cart">
                    Customize & Add
                </button>
            </div>
        </div>
    `).join('');
        `
          )
          .join('')}
    `;
}

function updatePriceFilter() {
  const filter = document.getElementById('priceFilter');
  if (!filter) return;
  selectedPriceFilter = filter.value;
  
  const activeTab = document.querySelector('.filter-tab.active');
  const activeCategory = activeTab ? activeTab.textContent.trim().toLowerCase() : 'all';
  filterProducts(activeCategory);
}

window.updatePriceFilter = updatePriceFilter;
window.selectSuggestion = selectSuggestion;

// =========================================
// PRODUCT FILTERING
// =========================================

function filterProducts(category = 'all', btn = null) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (btn) {
    btn.parentElement
      .querySelectorAll('.filter-tab')
      .forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  }

  let filtered = category === 'all' ? [...products] : products.filter((p) => p.category === category);

  // Price Filters
  if (selectedPriceFilter === 'under200') filtered = filtered.filter((p) => p.price < 200);
  else if (selectedPriceFilter === '200to500') filtered = filtered.filter((p) => p.price >= 200 && p.price <= 500);
  else if (selectedPriceFilter === 'above500') filtered = filtered.filter((p) => p.price > 500);

  // Text Search Filter
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
      <div class="product-card" onclick='openCustomizeModal(${JSON.stringify(p).replace(/'/g, "&#39;")})' style="cursor:pointer">
        <div class="product-img-wrap">
          <img src="${p.img}" alt="${p.name}" />
          <button class="favorite-btn ${isFavourite('dishes', p.id) ? 'active' : ''}"
            type="button"
            data-fav-type="dishes"
            data-fav-id="${p.id}"
            aria-label="Toggle ${p.name} favourite"
            aria-pressed="${isFavourite('dishes', p.id)}"
            title="${isFavourite('dishes', p.id) ? 'Remove from favourites' : 'Add to favourites'}"
            onclick='event.stopPropagation(); toggleFavourite("dishes", ${JSON.stringify(p)})'>
            ${isFavourite('dishes', p.id) ? '&hearts;' : '&#9825;'}
          </button>
          ${p.id < 4 ? '<div class="bestseller-badge">⭐ Bestseller</div>' : ''}
        </div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.description || ''}</div>
          <div class="product-price">₹${p.price}</div>
          <button class="add-to-cart">Customize & Add</button>
        </div>
      </div>`
    )
    .join('');
}
window.filterProducts = filterProducts;

// =========================================
// BIRTHDAY CAKE BUILDER
// =========================================

function updateBirthdayCake(flavor) {
  if (!bdayCakes[flavor]) {
    console.error('Cake flavor not found:', flavor);
    return;
  }

  selectedFlavor = flavor;

  const cakeImg = document.getElementById('birthdayCakeImg');
  if (cakeImg) {
    cakeImg.src = bdayCakes[flavor].img;
  }

  document.querySelectorAll('.flavor-btn, .filter-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.textContent.trim() === flavor);
  });

  calculateBdayPrice();
}

function setCakeWeight(weight, event) {
  selectedWeight = weight;

  document.querySelectorAll('.weight-btn').forEach((b) => b.classList.remove('active'));
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
    emoji: cake.emoji || '🎂',
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
  btn.setAttribute('title', active ? 'Remove from favourites' : 'Add to favourites');
  btn.innerHTML = active ? '&hearts;' : '&#9825;';
}

function toggleBirthdayFavourite() {
  toggleFavourite('dishes', getBirthdayFavouriteItem());
}

function addBirthdayToCart() {
  const fallbacks = {
    'Red Velvet':   { img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860', emoji: '🎂' },
    'Dutch Truffle':{ img: 'https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180', emoji: '🍰' },
    'Pineapple':    { img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg?v=1711124785', emoji: '🍍' },
    'Chocoholic':   { img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267', emoji: '🍫' },
    'Black Forest': { img: 'https://sweetandsavorymeals.com/wp-content/uploads/2020/02/black-forest-cake-recipe-SweetAndSavoryMeals4-1054x1536.jpg', emoji: '🌲' },
    'Cheesecake':   { img: 'https://www.inspiredtaste.net/wp-content/uploads/2024/03/New-York-Cheesecake-Recipe-1.jpg', emoji: '🧀' }
  };

  const cakeInfo = bdayCakes[selectedFlavor] || fallbacks[selectedFlavor] || fallbacks['Red Velvet'];
  const finalPrice = BIRTHDAY_BASE_PRICES[selectedWeight] || 850;
  const msgInput = document.getElementById('cakeMessage');
  const message = msgInput ? msgInput.value.trim() : '';

  addToCart({
    id: `bday-${selectedFlavor}-${selectedWeight}`,
    name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
    price: finalPrice,
    img: cakeInfo.img,
    emoji: cakeInfo.emoji,
    category: 'cakes',
    message,
    qty: 1
  });

  showToast('🎂 Birthday cake added to cart!');
  if (msgInput) msgInput.value = '';
  openCart();
}

function addDessertToCart() {
  addToCart({ id: 'dessert-macarons-4', name: 'Macarons (Box of 4)', price: 350, img: 'https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427', category: 'desserts', qty: 1 });
  openCart();
}

function addBrownieToCart() {
  addToCart({ id: 'brownie-walnut-4', name: 'Walnut Brownie (Pack of 4)', price: 250, img: 'https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338', category: 'brownies', qty: 1 });
  openCart();
}

function addCookieToCart() {
  addToCart({ id: 'cookie-chocochip-6', name: 'Choco Chip Cookies (Box of 6)', price: 250, img: 'https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg', category: 'cookies', qty: 1 });
  openCart();
}

// =========================================
// FAVOURITES
// =========================================

const FAVOURITES_KEY = 'brownie_bliss_favourites';
const BROWNIE_BLISS_BAKERY = { id: 'brownie-bliss', name: 'Brownie Bliss', location: 'Krishnagiri', category: 'Bakery', img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860' };

function loadFavourites() {
  try {
    const saved = localStorage.getItem(FAVOURITES_KEY);
    return saved ? JSON.parse(saved) : { bakeries: [], dishes: [] };
  } catch (_) {
    return { bakeries: [], dishes: [] };
  }
}

let favourites = loadFavourites();

function saveFavourites() {
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
}

function isFavourite(type, id) {
  if (!favourites[type]) return false;
  return favourites[type].some((item) => item.id === id || item === id);
}

function toggleFavourite(type, item) {
  if (!favourites[type]) favourites[type] = [];
  const idx = favourites[type].findIndex((i) => i.id === item.id);
  if (idx > -1) {
    favourites[type].splice(idx, 1);
    showToast('Removed from favourites 💔');
  } else {
    favourites[type].push(item);
    showToast('Added to favourites ❤️');
  }
  saveFavourites();
  updateFavouriteButtons(type, item.id);
  updateFavouritesCount();
  if (typeof renderFavouritesPage === 'function') renderFavouritesPage();
}

function updateFavouriteButtons(type, id) {
  document.querySelectorAll(`[data-fav-type="${type}"][data-fav-id="${id}"]`).forEach((btn) => {
    const active = isFavourite(type, id);
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.innerHTML = active ? '&hearts;' : '&#9825;';
  });
}

function updateFavouritesCount() {
  const total = (favourites.bakeries?.length || 0) + (favourites.dishes?.length || 0);
  document.querySelectorAll('[data-favourites-count]').forEach((el) => {
    el.textContent = total;
    el.style.display = total > 0 ? 'inline-flex' : 'none';
  });
}

function toggleBakeryFavourite() {
  toggleFavourite('bakeries', BROWNIE_BLISS_BAKERY);
  const btn = document.querySelector('.hero-favourite-btn');
  if (btn) btn.classList.toggle('active', isFavourite('bakeries', BROWNIE_BLISS_BAKERY.id));
}

function renderFavouritesPage() {
  const bakeryGrid = document.getElementById('favouriteBakeriesGrid');
  const dishesGrid = document.getElementById('favouriteDishesGrid');
  const emptyState = document.getElementById('favouritesEmpty');
  const bakeryGroup = document.getElementById('favouriteBakeriesGroup');
  const dishesGroup = document.getElementById('favouriteDishesGroup');

  if (!bakeryGrid && !dishesGrid) return;

  if (bakeryGrid) {
    bakeryGrid.innerHTML = favourites.bakeries
      .map(
        (bakery) => `
      <article class="favourite-bakery-card">
        <img src="${bakery.img}" alt="${bakery.name}">
        <div class="favourite-bakery-info">
          <div class="product-category">${bakery.category}</div>
          <h3>${bakery.name}</h3>
          <p>${bakery.location}</p>
          <button class="add-to-cart favourite-remove" type="button"
            onclick='toggleFavourite("bakeries", ${JSON.stringify(bakery)})'>
            Remove Favourite
          </button>
        </div>
      </article>`
      )
      .join('');
  }

  if (dishesGrid) {
    dishesGrid.innerHTML = favourites.dishes
      .map(
        (dish) => `
      <div class="product-card">
        <div class="product-img-wrap">
          <img src="${dish.img || 'https://via.placeholder.com/300'}" alt="${dish.name}">
          <button class="favorite-btn active" type="button"
            data-fav-type="dishes"
            data-fav-id="${dish.id}"
            aria-label="Remove ${dish.name} from favourites"
            aria-pressed="true"
            title="Remove from favourites"
            onclick='toggleFavourite("dishes", ${JSON.stringify(dish)})'>
            &hearts;
          </button>
        </div>
        <div class="product-info">
          <div class="product-category">${dish.category || 'favourite'}</div>
          <div class="product-name">${dish.name}</div>
          ${dish.price ? `<div class="product-price">₹${dish.price}</div>` : ''}
          <button class="add-to-cart" onclick='addToCart(${JSON.stringify(dish)})'>Add to Cart</button>
        </div>
      </div>`
      )
      .join('');
  }

  const hasAny = (favourites.bakeries.length + favourites.dishes.length) > 0;
  if (emptyState) emptyState.style.display = hasAny ? 'none' : 'block';
  if (bakeryGroup) bakeryGroup.style.display = favourites.bakeries.length ? 'block' : 'none';
  if (dishesGroup) dishesGroup.style.display = favourites.dishes.length ? 'block' : 'none';
}

// =========================================
// PRODUCT CUSTOMIZATION MODAL
// =========================================

let _customizeProduct = null;

function openCustomizeModal(product) {
  _customizeProduct = product;

  let overlay = document.getElementById('customizeOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'customizeOverlay';
    overlay.className = 'customize-overlay';
    overlay.innerHTML = `
      <div class="customize-modal">
        <button class="customize-close" onclick="closeCustomizeModal()">✕</button>
        <div class="customize-header">
          <img id="customizeImg" src="" alt="">
          <div class="customize-header-info">
            <div class="customize-product-cat" id="customizeCat"></div>
            <div class="customize-product-name" id="customizeName"></div>
            <div class="customize-base-price" id="customizeBasePrice"></div>
          </div>
        </div>
        <div class="customize-body">
          <div class="customize-section">
            <div class="customize-section-title">Dietary Preference</div>
            <div class="customize-options">
              <label class="customize-option">
                <input type="radio" name="dietary" value="egg" checked>
                <span class="customize-option-label">🥚 With Egg</span>
              </label>
              <label class="customize-option">
                <input type="radio" name="dietary" value="eggless">
                <span class="customize-option-label">🌱 Eggless</span>
              </label>
            </div>
          </div>
          <div class="customize-section">
            <div class="customize-section-title">Add-ons <span style="font-size:11px;color:var(--gold);font-weight:400">(optional)</span></div>
            <div class="customize-options topping-options">
              <label class="customize-option">
                <input type="checkbox" name="topping" value="nuts" data-price="30">
                <span class="customize-option-label">🥜 Nuts <span class="topping-price">+₹30</span></span>
              </label>
              <label class="customize-option">
                <input type="checkbox" name="topping" value="choco-drizzle" data-price="20">
                <span class="customize-option-label">🍫 Choco Drizzle <span class="topping-price">+₹20</span></span>
              </label>
              <label class="customize-option">
                <input type="checkbox" name="topping" value="sprinkles" data-price="15">
                <span class="customize-option-label">🎉 Sprinkles <span class="topping-price">+₹15</span></span>
              </label>
            </div>
          </div>
          <div class="customize-section">
            <div class="customize-section-title">Special Message <span style="font-size:11px;color:var(--gold);font-weight:400">(optional)</span></div>
            <textarea class="customize-message" id="customizeMessage" rows="2" placeholder="e.g. Happy Birthday! Extra fudgy please 🍫"></textarea>
          </div>
        </div>
        <div class="customize-footer">
          <div class="customize-total">
            <span>Total</span>
            <strong id="customizeTotal">₹0</strong>
          </div>
          <button class="customize-confirm-btn" onclick="confirmCustomize()">Add to Cart 🛒</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('change', updateCustomizeTotal);
  }

  document.getElementById('customizeImg').src = product.img;
  document.getElementById('customizeCat').textContent = product.category;
  document.getElementById('customizeName').textContent = product.name;
  document.getElementById('customizeBasePrice').textContent = `Base price: ₹${product.price}`;

  overlay.querySelectorAll('input[type="radio"]')[0].checked = true;
  overlay.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));
  const msg = document.getElementById('customizeMessage');
  if (msg) msg.value = '';

  updateCustomizeTotal();
  overlay.classList.add('open');
}

function updateCustomizeTotal() {
  if (!_customizeProduct) return;
  const toppingInputs = document.querySelectorAll('#customizeOverlay input[type="checkbox"]:checked');
  const toppingsTotal = [...toppingInputs].reduce((sum, cb) => sum + parseInt(cb.dataset.price || 0), 0);
  const total = document.getElementById('customizeTotal');
  if (total) total.textContent = `₹${_customizeProduct.price + toppingsTotal}`;
}

function closeCustomizeModal() {
  document.getElementById('customizeOverlay')?.classList.remove('open');
}

function confirmCustomize() {
  if (!_customizeProduct) return;

  const dietary = document.querySelector('#customizeOverlay input[name="dietary"]:checked')?.value || 'egg';
  const toppingInputs = [...document.querySelectorAll('#customizeOverlay input[type="checkbox"]:checked')];
  const toppings = toppingInputs.map((cb) => ({ name: cb.value, price: parseInt(cb.dataset.price || 0) }));
  const message = document.getElementById('customizeMessage')?.value.trim() || '';
  const toppingsTotal = toppings.reduce((s, t) => s + t.price, 0);
  const finalPrice = _customizeProduct.price + toppingsTotal;

  addToCart({ ..._customizeProduct, price: finalPrice, customizations: { dietary, toppings, message } });
  closeCustomizeModal();
  openCart();
}

// =========================================
// CHECKOUT FLOW
// =========================================

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

        <div id="checkStep2" class="hidden">
          <h3 class="checkout-title">Confirm Number</h3>
          <p class="checkout-subtitle">Enter the 6-digit code sent to <strong id="otpPhoneDisp"></strong></p>
          <div class="otp-container">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,0)">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,1)">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,2)">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,3)">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,4)">
            <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,5)">
          </div>
          <button class="hero-cta" style="width:100%;" onclick="verifyOTP()">Verify & Continue &rarr;</button>
          <button class="text-link" onclick="showCheckoutStep(1)">Change Phone Number</button>
        </div>

        <div id="checkStep3" class="hidden">
          <h3 class="checkout-title">Delivery Details</h3>
          <p class="checkout-subtitle">Where should we bring your treats?</p>
          <div class="form-group">
            <label>Street Address</label>
            <textarea id="custAddr" placeholder="House No, Street, Area..."></textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
            <div class="form-group"><label>City</label><input type="text" id="custCity" placeholder="City"></div>
            <div class="form-group"><label>Pincode</label><input type="text" id="custPin" placeholder="6-digit" maxlength="6"></div>
          </div>
          <button class="hero-cta" style="width:100%;margin-top:20px;" onclick="goToConfirm()">Review Order &rarr;</button>
        </div>

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
            Place Order & Confirm via WhatsApp &rarr;
          </button>
        </div>

      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function openCheckout() {
  if (cart.length === 0) { showToast('Your cart is empty! 🍫'); return; }
  injectCheckoutModal();
  closeCart();
  checkoutState = { name: '', phone: '', address: '', city: '', pincode: '', verified: false, currentStep: 1 };
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
  const name = document.getElementById('custName')?.value.trim();
  const phone = document.getElementById('custPhone')?.value.trim();

  if (!name) { showToast('Please enter your name'); return; }
  if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
    showToast('Enter a valid 10-digit phone number'); return;
  }

  checkoutState.name = name;
  checkoutState.phone = phone;

  const btn = document.querySelector('#checkStep1 .hero-cta');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

  try {
    const res = await fetch(`${API_BASE}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (data.success) {
      const disp = document.getElementById('otpPhoneDisp');
      if (disp) disp.textContent = '+91 ' + phone;
      showCheckoutStep(2);
      showToast('OTP sent! Check your phone.');
    } else {
      showToast(data.message || 'Failed to send OTP. Try again.');
    }
  } catch (e) {
    showToast('Server error. Please try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Send Verification OTP →'; }
  }
}

function otpNext(input, idx) {
  input.value = input.value.replace(/\D/, '');
  if (input.value && idx < 5) {
    document.querySelectorAll('.otp-box')[idx + 1]?.focus();
  }
}

async function verifyOTP() {
  const otp = [...document.querySelectorAll('.otp-box')].map((b) => b.value).join('');
  if (otp.length !== 6) { showToast('Enter all 6 digits'); return; }

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
  } catch (e) {
    showToast('Verification failed. Try again.');
  }
}

function goToConfirm() {
  const addr = document.getElementById('custAddr')?.value.trim();
  const city = document.getElementById('custCity')?.value.trim();
  const pin = document.getElementById('custPin')?.value.trim();

  if (!addr) { showToast('Enter your street address'); return; }
  if (!city) { showToast('Enter your city'); return; }
  if (!pin || pin.length !== 6) { showToast('Enter valid 6-digit pincode'); return; }

  checkoutState.address = addr;
  checkoutState.city = city;
  checkoutState.pincode = pin;

  const cc = document.getElementById('confirmCustomer');
  if (cc) cc.innerHTML = `
    <div style="font-weight:600;color:var(--brown-dark)">${checkoutState.name}</div>
    <div style="font-size:13px;color:var(--text-mid);margin-bottom:4px">+91 ${checkoutState.phone}</div>
    <div style="font-size:13px;color:var(--text-mid);line-height:1.4">${addr}, ${city} - ${pin}</div>`;

  const ci = document.getElementById('confirmItems');
  if (ci) ci.innerHTML = cart.map((i) => `
    <div class="confirm-row">
      <span>${i.name} × ${i.qty}</span>
      <strong style="color:var(--brown-warm)">₹${(i.price * i.qty).toLocaleString('en-IN')}</strong>
    </div>`).join('');

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const ct = document.getElementById('confirmTotal');
  if (ct) ct.textContent = `₹${total.toLocaleString('en-IN')}`;

  showCheckoutStep(4);
}

async function placeOrder() {
  const orderData = {
    customer_name: checkoutState.name,
    phone: checkoutState.phone,
    address: checkoutState.address,
    city: checkoutState.city,
    pincode: checkoutState.pincode,
    items: cart.map((i) => ({
      id: typeof i.id === 'number' ? i.id : 0,
      name: i.name,
      price: i.price,
      qty: i.qty,
      emoji: i.emoji || '🍫',
      category: i.category || 'general',
      customizations: i.customizations || null,
    })),
    total: cart.reduce((s, i) => s + i.price * i.qty, 0),
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
      const snapshot = [...cart];
      const total = orderData.total;

      sendWhatsAppFinal(orderId, snapshot, total);

      cart = [];
      saveCart();
      updateCartUI();
      closeCheckout();
      showToast(`🎉 Order ${orderId} placed! <a href="track.html?id=${orderId}" class="toast-track-link">Track Order</a>`);
    } else {
      showToast('Failed to save order. Please try again.');
    }
  } catch (e) {
    showToast('Error placing order. Please try again.');
  }
}

// =========================================
// WHATSAPP
// =========================================

function sendWhatsAppFinal(orderId, itemsSnap, orderTotal) {
  const lines = Array.isArray(itemsSnap) && itemsSnap.length ? itemsSnap : cart;
  const total = typeof orderTotal === 'number' && isFinite(orderTotal)
    ? orderTotal
    : lines.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);

  const itemLines = lines
    .map((i) => {
      let line = `• ${i.name} × ${i.qty} = ₹${(Number(i.price) * Number(i.qty)).toLocaleString('en-IN')}`;
      if (i.customizations) {
        const c = i.customizations;
        const details = [];
        if (c.dietary) details.push(c.dietary === 'eggless' ? 'Eggless' : 'Egg');
        if (c.toppings?.length) details.push(c.toppings.map((t) => `+${t.name}`).join(', '));
        if (c.message) details.push(`Msg: "${c.message}"`);
        if (details.length) line += `\n   _${details.join(' | ')}_`;
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
// TOAST
// =========================================

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// =========================================
// BACK TO TOP BUTTON
// =========================================

(function () {
  var btn = document.getElementById('scrollTopBtn');
  var SCROLL_THRESHOLD = 300;

  function onScroll() {
    if (!btn) return;
    if (window.scrollY > SCROLL_THRESHOLD) {
      btn.style.display = 'flex';
      btn.classList.add('visible');
    } else {
      btn.style.display = 'none';
      btn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (btn) {
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollToTop();
      }
    });
  }
})();

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================
// INIT — runs after DOM is ready
// =========================================

document.addEventListener('DOMContentLoaded', async function () {
  applyTheme(localStorage.getItem('bb_theme') || 'light');

  updateCartUI();

  await loadProducts();

  initializeLiveSearch();

  updateFavouriteButtons('bakeries', BROWNIE_BLISS_BAKERY.id);
  updateFavouritesCount();
  renderFavouritesPage();

  const urlParams = new URLSearchParams(window.location.search);
  const idParam = urlParams.get('id');
  const input = document.getElementById('orderIdInput');
  if (idParam && input) {
    input.value = idParam;
    trackOrder(idParam);
  }

  // 'T' keyboard shortcut scrolls to top safely
  document.addEventListener('keydown', function (e) {
    if (e.key.toLowerCase() === 't' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      scrollToTop();
    }
  });

  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "ease-in-out"
    });
  }
});

window.filterProducts = filterProducts;
window.updatePriceFilter = updatePriceFilter;
window.selectSuggestion = selectSuggestion;