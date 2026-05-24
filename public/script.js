script.js

// --- CONFIG ---
const API_BASE = '/api';

// --- SCROLL TO TOP (NEW FEATURE) ---
document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "t") {
        window.scrollTo({ top: 0, behavior: "smooth" });
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
let selectedWeight = '1.0';
const BIRTHDAY_BASE_PRICES = {
    '0.5': 450,
    '1.0': 850,
    '1.5': 1250,
    '2.0': 1600
};

// buildCatalogFromList(null);
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Velvet Dream Cake", category: "cakes", price: 850, img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
    { id: 2, name: "Dutch Truffle Delight", category: "cakes", price: 950, img: "https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180" },
    { id: 3, name: "Pineapple Fresh Cream", category: "cakes", price: 675, img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg" }
];

const DEFAULT_BDAY_CAKES = {
    "Red Velvet": { price: 850, img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
    "Dutch Truffle": { price: 950, img: "https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180" }
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

let favourites = loadFavourites();

function buildCatalogFromList(list) {
    if (list && Array.isArray(list) && list.length) {
        products = list.filter(p => p.type === 'standard').map(p => ({
            id: p.id_ref,
            name: p.name,
            category: p.category,
            price: p.price,
            emoji: p.emoji,
            img: p.img,
            description: p.description || ''
        }));

        bdayCakes = {};
        const bd = list.filter(p => p.type === 'birthday');
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
}

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();

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

    if (document.getElementById('productsGrid')) {
        filterProducts('all');
    }

    if (document.getElementById('cakePrice')) {
        calculateBdayPrice();
    }
}

// --- CART ---
    // Render UI
    if (document.getElementById('productsGrid')) {
        filterProducts('all');
    }

    if (document.getElementById('cakePrice')) {
        calculateBdayPrice();
    }
}
// --- CART STATE ---
let cart = JSON.parse(localStorage.getItem('brownie_bliss_cart') || '[]');
let checkoutState = { name: '', phone: '', address: '', city: '', pincode: '', verified: false, currentStep: 1 };

function saveCart() {
    localStorage.setItem('brownie_bliss_cart', JSON.stringify(cart));
}

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
        cartContainer.innerHTML = cart.map((item, index) => {
            const c = item.customizations;
            let customBadges = '';
            if (c) {
                if (c.dietary) customBadges += `<span class="cart-custom-badge">${c.dietary === 'eggless' ? '🌱 Eggless' : '🥚 Egg'}</span>`;
                if (c.toppings && c.toppings.length) customBadges += c.toppings.map(t => `<span class="cart-custom-badge">+ ${t.name}</span>`).join('');
                if (c.message) customBadges += `<span class="cart-custom-badge cart-custom-msg">✉ "${c.message}"</span>`;
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
        if (cartFooter) cartFooter.style.display = 'block';
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    cartContainer.innerHTML = cart.map((item, index) => `
        <div>
            ${item.name} x ${item.qty}
            <button onclick="changeQty(${index},1)">+</button>
            <button onclick="changeQty(${index},-1)">-</button>
        </div>
    `).join('');
}

// FIXED ADD TO CART
function addToCart(product) {
    const existing = cart.find(i => i.name === product.name);

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

// --- PRODUCT FILTER (FIXED BUTTON BUG) ---
function filterProducts(category) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const filtered = category === 'all'
        ? products
        : products.filter(p => p.category === category);

    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <img src="${p.img}" />
            <h3>${p.name}</h3>
            <p>₹${p.price}</p>

            <button onclick='addToCart(${JSON.stringify(p)})'>
                Add to Cart
            </button>
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

// --- CHECKOUT FLOW ---
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

function openCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty! 🍫');
        return;
    }
    injectCheckoutModal();
    closeCart();
    checkoutState = { name: '', phone: '', address: '', city: '', pincode: '', verified: false, currentStep: 1 };
    showCheckoutStep(1);
    document.getElementById('checkoutOverlay').classList.add('open');
}

function closeCheckout() {
    document.getElementById('checkoutOverlay').classList.remove('open');
}

function showCheckoutStep(n) {
    checkoutState.currentStep = n;
    [1, 2, 3, 4].forEach(i => {
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

    if (!name) { showToast('Please enter your name'); return; }
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
        showToast('Enter a valid 10-digit phone number'); return;
    }

    checkoutState.name = name;
    checkoutState.phone = phone;

    // Bypassing OTP
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

function otpNext(input, idx) {
    input.value = input.value.replace(/\D/, '');
    if (input.value && idx < 5) {
        document.querySelectorAll('.otp-box')[idx + 1]?.focus();
    }
}

async function verifyOTP() {
    const otp = [...document.querySelectorAll('.otp-box')].map(b => b.value).join('');
    if (otp.length !== 6) { showToast('Enter all 6 digits'); return; }

    try {
        const res = await fetch(`${API_BASE}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: checkoutState.phone, otp })
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
    const addr = document.getElementById('custAddr').value.trim();
    const city = document.getElementById('custCity').value.trim();
    const pin = document.getElementById('custPin').value.trim();

    if (!addr) { showToast('Enter your street address'); return; }
    if (!city) { showToast('Enter your city'); return; }
    if (!pin || pin.length !== 6) { showToast('Enter valid 6-digit pincode'); return; }

    checkoutState.address = addr;
    checkoutState.city = city;
    checkoutState.pincode = pin;

    document.getElementById('confirmCustomer').innerHTML = `
        <div style="font-weight:600; color:var(--brown-dark)">${checkoutState.name}</div>
        <div style="font-size:13px; color:var(--text-mid); margin-bottom:4px">+91 ${checkoutState.phone}</div>
        <div style="font-size:13px; color:var(--text-mid); line-height:1.4">${addr}, ${city} - ${pin}</div>
    `;

    document.getElementById('confirmItems').innerHTML = cart.map(i => `
        <div class="confirm-row">
            <span>${i.name} × ${i.qty}</span>
            <strong style="color:var(--brown-warm)">₹${(i.price * i.qty).toLocaleString()}</strong>
        </div>
    `).join('');

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    document.getElementById('confirmTotal').textContent = `₹${total.toLocaleString()}`;
    showCheckoutStep(4);
}

async function placeOrder() {
    const orderData = {
        customer_name: checkoutState.name,
        phone: checkoutState.phone,
        address: checkoutState.address,
        city: checkoutState.city,
        pincode: checkoutState.pincode,
        items: cart.map(i => ({
            id: typeof i.id === 'number' ? i.id : 0,
            name: i.name,
            price: i.price,
            qty: i.qty,
            emoji: i.emoji || '🍫',
            category: i.category || 'general',
            customizations: i.customizations || null
        })),
        total: cart.reduce((s, i) => s + i.price * i.qty, 0)
    };

    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();
        if (data.success) {
            const orderId = data.order_id;
            sendWhatsAppFinal(orderId);

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

// --- WHATSAPP FINAL ---
function sendWhatsAppFinal(orderId) {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const itemLines = cart.map(i => {
        let line = `• ${i.name} × ${i.qty} = ₹${(i.price * i.qty).toLocaleString()}`;
function sendWhatsAppFinal(orderId, itemsSnap, orderTotal) {

    const lines = Array.isArray(itemsSnap) && itemsSnap.length
        ? itemsSnap
        : cart;

    const total = typeof orderTotal === 'number' && Number.isFinite(orderTotal)
        ? orderTotal
        : lines.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
    const itemLines = lines.map(i => {
        let line = `• ${i.name} × ${i.qty} = ₹${(Number(i.price) * Number(i.qty)).toLocaleString('en-IN')}`;

    const itemLines = lines.map(i => {
        let line = `• ${i.name} × ${i.qty} = ₹${(Number(i.price) * Number(i.qty)).toLocaleString('en-IN')}`;
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

    const message =
        `🍫 *New Order Received — Brownie Bliss*\n\n` +
        `📋 *Order ID:* ${orderId}\n` +
        `👤 *Customer:* ${checkoutState.name}\n` +
        `📱 *Phone:* +91 ${checkoutState.phone}\n` +
        `📍 *Address:* ${checkoutState.address}, ${checkoutState.city} - ${checkoutState.pincode}\n\n` +
        `🛒 *Order Details:*\n${itemLines}\n\n` +
        `💰 *Total Amount: ₹${total.toLocaleString()}*\n\n` +
        `_Your order has been recorded. Please share the payment receipt for confirmation!_ ✨`;

    const encodedMsg = encodeURIComponent(message);

    const fullPhone = `918072596340`;

    const waUrl = `https://wa.me/${fullPhone}?text=${encodedMsg}`;

    window.open(waUrl, '_blank');
}
// Redirect old button
function sendToWhatsApp() {
    openCheckout();
}

let selectedPriceFilter = 'all';
function updatePriceFilter() {
    selectedPriceFilter =
        document.getElementById('priceFilter').value;

    const activeTab =
        document.querySelector('.filter-tab.active');

    const activeCategory =
        activeTab
            ? activeTab.textContent.toLowerCase()
            : 'all';

    filterProducts(activeCategory);
}
// --- PRODUCT FILTERING ---
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
}
else if (selectedPriceFilter === '200to500') {
    filtered = filtered.filter(
        p => p.price >= 200 && p.price <= 500
    );
}
else if (selectedPriceFilter === 'above500') {
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

// --- BIRTHDAY CAKE BUILDER ---
// bdayCakes object is now populated dynamically via loadProducts()

function updateBirthdayCake(flavor) {

    if (!bdayCakes[flavor]) {
        console.error("Cake flavor not found:", flavor);
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
    document.querySelectorAll('.filter-pill').forEach(btn => {
        if (btn.textContent.trim() === flavor) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    calculateBdayPrice();
}
function setCakeWeight(weight) {
// --- BIRTHDAY CAKE ---
let selectedFlavor = "Red Velvet";
let selectedWeight = "1.0";

const BIRTHDAY_BASE_PRICES = {
    "0.5": 450,
    "1.0": 850,
    "1.5": 1250,
    "2.0": 1600
};

function setCakeWeight(weight, event) {
    selectedWeight = weight;

    document.querySelectorAll('.weight-btn')
        .forEach(b => b.classList.remove('active'));

    if (event?.target)
        event.target.classList.add('active');

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
        category: 'cakes'
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
// --- FIXED WHATSAPP (ONLY ONE VERSION) ---
function sendWhatsAppFinal(orderId) {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
function toggleBirthdayFavourite() {
    toggleFavourite('dishes', getBirthdayFavouriteItem());
}

function addBirthdayToCart() {
    if (!bdayCakes[selectedFlavor]) return;

    const basePrices = {
        "0.5": 450,
        "1.0": 850,
        "1.5": 1250,
        "2.0": 1600
    };

    const fallbacks = {
        'Red Velvet': { img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860', emoji: '🎂' },
        'Dutch Truffle': { img: 'https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180', emoji: '🍰' },
        'Pineapple': { img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg?v=1711124785', emoji: '🍍' },
        'Chocoholic': { img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267', emoji: '🍫' },
        'Black Forest': { img: 'https://sweetandsavorymeals.com/wp-content/uploads/2020/02/black-forest-cake-recipe-SweetAndSavoryMeals4-1054x1536.jpg', emoji: '🌲' },
        'Cheesecake': { img: 'https://www.inspiredtaste.net/wp-content/uploads/2024/03/New-York-Cheesecake-Recipe-1.jpg', emoji: '🧀' }
    };

    const cakeInfo =
        bdayCakes[selectedFlavor] ||
        fallbacks[selectedFlavor] ||
        fallbacks['Red Velvet'];

    const finalPrice = basePrices[selectedWeight] || 850;

    const msgInput = document.getElementById('cakeMessage');
    const message = msgInput ? msgInput.value.trim() : '';

    const item = {
        id: `bday-${selectedFlavor}-${selectedWeight}`,
        name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
        price: finalPrice,
        img: cakeInfo.img,
        emoji: cakeInfo.emoji,
        category: 'cakes',
        message,
        qty: 1
    };

    addToCart(item);
    showToast('🎂 Birthday cake added to cart!');
    openCart();
    if (msgInput) msgInput.value = '';

    openCart();
}

function renderFavouritesPage() {
    const bakeryGrid = document.getElementById('favouriteBakeriesGrid');
    const dishesGrid = document.getElementById('favouriteDishesGrid');
    const emptyState = document.getElementById('favouritesEmpty');
    const bakeryGroup = document.getElementById('favouriteBakeriesGroup');
    const dishesGroup = document.getElementById('favouriteDishesGroup');

    if (!bakeryGrid && !dishesGrid) return;

    if (bakeryGrid) {
        bakeryGrid.innerHTML = favourites.bakeries.map(bakery => `
            <article class="favourite-bakery-card">
                <img src="${bakery.img}" alt="${bakery.name}">
                <div class="favourite-bakery-info">
                    <div class="product-category">${bakery.category}</div>
                    <h3>${bakery.name}</h3>
                    <p>${bakery.location}</p>
                    <button class="add-to-cart favourite-remove"
                        type="button"
                        onclick='toggleFavourite("bakeries", ${JSON.stringify(bakery)})'>
                        Remove Favourite
                    </button>
                </div>
            </article>
        `).join('');
    }

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

    const items = cart.map(i =>
        `• ${i.name} × ${i.qty} = ₹${i.price * i.qty}`
    ).join('\n');

    const msg =
        `🍫 Order ID: ${orderId}\n\n` +
        `${items}\n\nTotal: ₹${total}`;

    const url = `https://wa.me/918072596340?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
}

// --- TOAST ---
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem('bb_theme') || 'light');
    updateCartUI();
    loadProducts(); // Load and then automatically re-render main grid/birthday block
    updateFavouriteButtons('bakeries', BROWNIE_BLISS_BAKERY.id);
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
    loadProducts();
});
// Show/hide button on scroll
window.addEventListener("scroll", function () {
    const btn = document.getElementById("scrollTopBtn");

// --- TRACK ORDER LOGIC ---
async function trackOrder(id) {
    const orderIdInput = document.getElementById('orderIdInput');
    const trackError = document.getElementById('trackError');
    const result = document.getElementById('result');

    if (!orderIdInput) return;

    // Reset previous state
    if (trackError) {
        trackError.classList.remove('show');
        trackError.textContent = '';
    }

    if (result) {
        result.style.display = 'none';
    }

    const orderId = id || orderIdInput.value.trim();

    // Empty input validation
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

        // Successful order fetch
        if (data.success || data.order) {
            renderOrderDetails(data.order || data);

            if (result) {
                result.style.display = 'block';
            }
        }
        // Invalid order
        else {
            if (trackError) {
                trackError.textContent =
                    data.error || 'Order not found';
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
    if (!resOrderId) return; // Not on track page

    resOrderId.textContent = order.id || order.order_id;

    const statusLower = (order.status || 'pending').toLowerCase();
    
    // Update top total amount
    const resTotalTop = document.getElementById('resTotalTop');
    if (resTotalTop) resTotalTop.textContent = order.total;

    // Timeline Progression Logic
    const timeline = document.getElementById('trackingTimeline');
    const cancelledAlert = document.getElementById('cancelledAlert');
    
    if (timeline && cancelledAlert) {
        if (statusLower === 'cancelled') {
            timeline.style.display = 'none';
            cancelledAlert.style.display = 'block';
        } else {
            timeline.style.display = 'block';
            cancelledAlert.style.display = 'none';
            
            // Reset all steps
            const steps = ['pending', 'confirmed', 'preparing', 'delivered'];
            steps.forEach(s => {
                const el = document.getElementById(`step-${s}`);
                if (el) el.classList.remove('active', 'completed');
            });
            
            // Determine current step index
            const currentIndex = steps.indexOf(statusLower) > -1 ? steps.indexOf(statusLower) : 0;
            
            // Apply classes
            steps.forEach((s, i) => {
                const el = document.getElementById(`step-${s}`);
                if (!el) return;
                
                if (i < currentIndex) {
                    el.classList.add('completed');
                } else if (i === currentIndex) {
                    el.classList.add('active');
                }
            });
        }
    }

    if (order.created_at) {
        document.getElementById('resDate').textContent = new Date(order.created_at).toLocaleString();
    } else {
        btn.style.display = "none";
    }
});

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
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

    addToCart(cartItem);
    closeCustomizeModal();
    openCart();
    // Close mobile menu when any link inside it is clicked
document.querySelectorAll('.mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.remove('show');
  });
});
}
}
