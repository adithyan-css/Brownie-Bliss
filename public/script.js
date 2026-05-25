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
let selectedPriceFilter = 'all';
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

let favourites = loadFavourites();
buildCatalogFromList(null);

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

        if (data.success && Array.isArray(data.products)) {
            products = data.products.filter(p => p.type === 'standard');
            bdayCakes = {};

            data.products
                .filter(p => p.type === 'birthday')
                .forEach(p => {
                    bdayCakes[p.name] = {
                        price: p.price,
                        img: p.img
                    };
                });
        } else {
            useFallbackProducts();
        }
    } catch (e) {
        console.error(e);
        useFallbackProducts();
    }
    if (document.getElementById('cakePrice')) {
        calculateBdayPrice();
    }
}

// --- FAVOURITES ---
function loadFavourites() {
    try {
        return JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || { bakeries: [], dishes: [] };
    } catch {
        return { bakeries: [], dishes: [] };
        if (data.success && Array.isArray(data.products) && data.products.length) {

            products = data.products
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
    }
}

    if (document.getElementById('productsGrid')) {
        filterProducts('all');
    }
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
        cartContainer.innerHTML = '<div class="cart-empty"><span class="cart-empty-icon">🍫</span>Your cart is empty</div>';
        const cartFooter = document.getElementById('cartFooter');
        cartContainer.innerHTML = `
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
        `}).join('');
        const cartFooter = document.getElementById('cartFooter');
        if (cartFooter) cartFooter.style.display = 'block';
        const cartTotal = document.getElementById('cartTotal');
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    }
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

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}
// --- LIVE PRODUCT SEARCH ---

function initializeLiveSearch() {
  const searchInput = document.getElementById('productSearch');

  const suggestionsBox = document.getElementById('searchSuggestions');

// --- PRODUCT FILTER ---

function updatePriceFilter() {
    selectedPriceFilter = document.getElementById('priceFilter').value;
    const activeTab = document.querySelector('.filter-tab.active');
    const activeCategory = activeTab ? activeTab.textContent.toLowerCase() : 'all';
    filterProducts(activeCategory);
}

function filterProducts(category, btn) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (btn) {
        btn.parentElement.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    let filtered = category === 'all'
        ? products
        : products.filter(p => p.category === category);

    // PRICE FILTER
    if (selectedPriceFilter === 'under200') {
        filtered = filtered.filter(p => p.price < 200);
    } else if (selectedPriceFilter === '200to500') {
        filtered = filtered.filter(p => p.price >= 200 && p.price <= 500);
    } else if (selectedPriceFilter === 'above500') {
        filtered = filtered.filter(p => p.price > 500);
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card" onclick='openCustomizeModal(${JSON.stringify(p).replace(/'/g, "&#39;")})' style="cursor:pointer">
            <div class="product-img-wrap">
                <img src="${p.img}" alt="${p.name}">
                <button class="favorite-btn ${isFavourite('dishes', p.id) ? 'active' : ''}"
                    type="button"
                    data-fav-type="dishes"
                    data-fav-id="${p.id}"
                    aria-label="Toggle ${p.name} favourite"
                    aria-pressed="${isFavourite('dishes', p.id) ? 'true' : 'false'}"
                    title="${isFavourite('dishes', p.id) ? 'Remove from favourites' : 'Add to favourites'}"
                    onclick='toggleFavourite("dishes", ${JSON.stringify(p)})'>
                    ${isFavourite('dishes', p.id) ? '&hearts;' : '&#9825;'}
                </button>
                ${p.id < 4 ? '<div class="bestseller-badge">⭐ Bestseller</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <div class="product-name">${p.name}</div>
                ${p.description ? `<div class="product-desc">${p.description}</div>` : ''}
                <div class="product-price">₹${p.price}</div>
                <button class="add-to-cart">
                    Customize & Add
                </button>
            </div>
        </div>
    `).join('');
}

// --- CHECKOUT FLOW ---
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
                    <button class="hero-cta" style="width: 100%; margin-top: 20px;" onclick="sendOTP()">
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
                    <div id="demoOtpBox" style="display:none; margin-bottom: 20px;"></div>
                    <button class="hero-cta" style="width: 100%;" onclick="verifyOTP()">
                        Verify & Continue &rarr;
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
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>City</label>
                            <input type="text" id="custCity" placeholder="City">
                        </div>
                        <div class="form-group">
                            <label>Pincode</label>
                            <input type="text" id="custPin" placeholder="6-digit" maxlength="6">
                        </div>
                    </div>
                    <button class="hero-cta" style="width: 100%; margin-top: 20px;" onclick="goToConfirm()">
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
                    <button class="whatsapp-btn" style="border-radius: 0;" onclick="placeOrder()">
                        Place Order & Confirm via WhatsApp &rarr;
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}
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

    const btn = document.querySelector('#checkStep1 .hero-cta');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

    try {
        const res = await fetch(`${API_BASE}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('otpPhoneDisp').textContent = '+91 ' + phone;
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

// --- WHATSAPP FINAL ---
function sendWhatsAppFinal(orderId) {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const itemLines = cart.map(i => {
        let line = `• ${i.name} × ${i.qty} = ₹${(i.price * i.qty).toLocaleString()}`;
        if (i.customizations) {
            const c = i.customizations;
            const details = [];

            if (c.dietary) {
                details.push(c.dietary === 'eggless' ? 'Eggless' : 'Egg');
            }

            if (c.toppings && c.toppings.length) {
                details.push(c.toppings.map(t => `+${t.name}`).join(', '));
            }

            if (c.message) {
                details.push(`Msg: "${c.message}"`);
            }

            if (details.length) {
                line += `\n   _${details.join(' | ')}_`;
            }
        }

        return line;
    }).join('\n');
  if (!searchInput) return;

  searchInput.value = value;

  currentSearchTerm = value;

  saveRecentSearch(value);

  filterProducts('all');

    const encodedMsg = encodeURIComponent(message);
    const fullPhone = `918072596340`;
    const waUrl = `https://wa.me/${fullPhone}?text=${encodedMsg}`;

    window.open(waUrl, '_blank');
}

// Redirect old button
function sendToWhatsApp() {
    openCheckout();
}

// --- BIRTHDAY CAKE BUILDER ---
function updateBirthdayCake(flavor) {
    if (!bdayCakes[flavor]) {
        console.error("Cake flavor not found:", flavor);
        return;
    }
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

    // Update active flavor button
    document.querySelectorAll('.filter-pill').forEach(btn => {
        if (btn.textContent.trim() === flavor) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
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

    calculateBdayPrice();
}
  const emptyState = document.getElementById('noProductsFound');

  if (emptyState) {
    emptyState.style.display = filtered.length ? 'none' : 'block';
  }

  grid.innerHTML = filtered
    .map(
      (p) => `
      <div class="product-card">

    document.querySelectorAll('.weight-btn').forEach(b => b.classList.remove('active'));

    if (event?.target) {
        event.target.classList.add('active');
    }
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

function toggleBirthdayFavourite() {
    toggleFavourite('dishes', getBirthdayFavouriteItem());
}
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

    addToCart(item);
    showToast('🎂 Birthday cake added to cart!');
    openCart();
    if (msgInput) msgInput.value = '';
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

    if (dishesGrid) {
        dishesGrid.innerHTML = favourites.dishes.map(dish => `
            <div class="product-card">
                <div class="product-img-wrap">
                    <img src="${dish.img || 'https://via.placeholder.com/300'}" alt="${dish.name}">
                    <button class="favorite-btn active"
                        type="button"
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
                    ${dish.price ? `<div class="product-price">Rs. ${dish.price}</div>` : ''}
                    <button class="add-to-cart" onclick='addToCart(${JSON.stringify(dish)})'>
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// --- TOAST ---
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerHTML = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// --- FAVOURITES HELPERS ---
function isFavourite(type, id) {
    if (type === 'bakeries') {
        return favourites.bakeries.some(b => b.id === id);
    } else if (type === 'dishes') {
        return favourites.dishes.some(d => d.id === id);
    }
    return false;
}

function toggleFavourite(type, item) {
    if (type === 'bakeries') {
        const index = favourites.bakeries.findIndex(b => b.id === item.id);
        if (index > -1) {
            favourites.bakeries.splice(index, 1);
        } else {
            favourites.bakeries.push(item);
        }
    } else if (type === 'dishes') {
        const index = favourites.dishes.findIndex(d => d.id === item.id);
        if (index > -1) {
            favourites.dishes.splice(index, 1);
        } else {
            favourites.dishes.push(item);
        }
    }
    saveFavourites();
    updateCartUI();
    renderFavouritesPage();
}

function updateFavouriteButtons(type, id) {
    const active = isFavourite(type, id);
    document.querySelectorAll(`[data-fav-type="${type}"][data-fav-id="${id}"]`).forEach(btn => {
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function updateFavouritesCount() {
    const totalFavs = favourites.bakeries.length + favourites.dishes.length;
    const badge = document.getElementById('favCount');
    if (badge) {
        badge.textContent = totalFavs;
        badge.style.display = totalFavs > 0 ? 'block' : 'none';
    }
}

// --- TRACK ORDER LOGIC ---
async function trackOrder(id) {
    const orderIdInput = document.getElementById('orderIdInput');
    if (!id && orderIdInput) {
        id = orderIdInput.value.trim();
    }

    if (!id) {
        showToast('Enter an order ID to track.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/orders/${id}`);
        const data = await res.json();

        if (data.success) {
            const order = data.order;
            const trackingEl = document.getElementById('trackingDetails');
            if (trackingEl) {
                trackingEl.innerHTML = `
                    <div class="track-result">
                        <h3>Order #${order.id}</h3>
                        <p>Status: <strong>${order.status}</strong></p>
                        <p>Total: ₹${order.total}</p>
                    </div>
                `;
            }
        } else {
            showToast('Order not found.');
        }
    } catch (e) {
        showToast('Failed to track order.');
    }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem('bb_theme') || 'light');
    updateCartUI();
    loadProducts();
    updateFavouritesCount();
    renderFavouritesPage();

    // Track Order auto-fill if on track.html
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const input = document.getElementById('orderIdInput');
    if (idParam && input) {
        input.value = idParam;
        trackOrder(idParam);
    }
});

// Show/hide scroll to top button
window.addEventListener("scroll", function () {
    const btn = document.getElementById("scrollTopBtn");
    if (btn) {
        btn.style.display = window.scrollY > 300 ? 'block' : 'none';
    }
});

const slider = document.querySelector('.birthday-slider');

const dots = document.querySelectorAll('.slider-dot');

if (slider) {
    let isDragging = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        slider.classList.add('dragging');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDragging = false;
        slider.classList.remove('dragging');
    });

    slider.addEventListener('mouseup', () => {
        isDragging = false;
        slider.classList.remove('dragging');
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        e.preventDefault();

        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;

        slider.scrollLeft = scrollLeft - walk;
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.birthday-slider');

    if (!slider) return;

    const slides = slider.querySelectorAll('.bday-slide');
    let currentIndex = 0;
    let autoSlide;

    function goToSlide(index) {
        slider.scrollTo({
            left: slides[index].offsetLeft,
            behavior: 'smooth'
        });

        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');

        currentIndex = index;
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    function startAutoSlide() {
        autoSlide = setInterval(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            goToSlide(currentIndex);
        }, 4000); // change every 4 seconds
    }
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

    function stopAutoSlide() {
        clearInterval(autoSlide);
    }

    // Mouse drag support
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        stopAutoSlide();
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => isDown = false);
    slider.addEventListener('mouseup', () => {
        isDown = false;
        startAutoSlide();
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;

        e.preventDefault();

        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;

        slider.scrollLeft = scrollLeft - walk;
    });

    // Touch support
    slider.addEventListener('touchstart', stopAutoSlide);
    slider.addEventListener('touchend', startAutoSlide);

    startAutoSlide();
});

}
AOS.init({
  duration: 1000,
  once: true,
  easing: "ease-in-out"
});
    const message = document.getElementById('customizeMessage').value.trim();

    const toppingsTotal = toppings.reduce((s, t) => s + t.price, 0);
    const finalPrice = _customizeProduct.price + toppingsTotal;

    const cartItem = {
        ..._customizeProduct,
        price: finalPrice,
        customizations: {
            dietary,
            toppings,
            message
        }
    };
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
