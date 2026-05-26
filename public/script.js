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

const FAVOURITES_KEY = 'brownie_bliss_favourites';

let favourites = [];
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

// --- CART STATE ---
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
}

// FIXED ADD TO CART
function addToCart(product) {
    if (product.stock === 0) {
    showToast('This item is sold out ');
    return;
}
    const existing = cart.find(i => i.name === product.name && i.message === product.message);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    const existing = cart.find(i => i.name === product.name);
  const existing = cart.find((i) => i.name === product.name);

  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });

  saveCart();
  updateCartUI();
  showToast('Added to cart! 🛒');
}

// FIXED QTY
function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
  updateCartUI();
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

          <img
            src="${p.img}"
            alt="${p.name}"
          />

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
// TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(localStorage.getItem('bb_theme') || 'light');

  updateCartUI();

  await loadProducts();

  initializeLiveSearch();

  filterProducts('all');
});
// Show/hide button on scroll

window.addEventListener('scroll', function () {
  const btn = document.getElementById('scrollTopBtn');

  if (!btn) return;

  if (window.scrollY > 300) {
    btn.style.display = 'flex';
  } else {
    btn.style.display = 'none';
  }
});
// Scroll to top function
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

window.filterProducts = filterProducts;
window.updatePriceFilter = updatePriceFilter;
window.selectSuggestion = selectSuggestion;
