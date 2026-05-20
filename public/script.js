// --- CONFIG ---

const API_BASE = '/api';

// --- THEME ---
function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const next = isDark ? 'light' : 'dark';
    localStorage.setItem('bb_theme', next);
    applyTheme(next);
}

// --- PRODUCTS DATA ---
let products = [];
let bdayCakes = {};
buildCatalogFromList(null);
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Velvet Dream Cake", category: "cakes", price: 850, emoji: "", img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
    { id: 2, name: "Dutch Truffle Delight", category: "cakes", price: 950, emoji: "", img: "https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180" },
    { id: 3, name: "Pineapple Fresh Cream", category: "cakes", price: 675, emoji: "", img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785" },
    { id: 4, name: "Overload Brownie", category: "brownies", price: 120, emoji: "", img: "https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338" },
    { id: 5, name: "Walnut Fudge", category: "brownies", price: 95, emoji: "", img: "https://theobroma.in/cdn/shop/files/WalnutBrownie_400x400.jpg?v=1711183181" },
    { id: 6, name: "Classic Choco", category: "brownies", price: 80, emoji: "", img: "https://www.labonelfinebaking.shop/wp-content/uploads/2021/02/CLASSIC-CHOCOLATE-CAKE.jpg" },
    { id: 7, name: "Chocolate Mousse", category: "desserts", price: 150, emoji: "", img: "https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427" },
    { id: 8, name: "Tiramisu Jar", category: "desserts", price: 180, emoji: "", img: "https://brokenovenbaking.com/wp-content/uploads/2021/12/gingerbread-tiramisu-jars-14-1024x1024.jpg" },
    { id: 9, name: "Choco Chip Cookies", category: "cookies", price: 250, emoji: "", img: "https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg" },
    { id: 10, name: "Almond Biscotti", category: "cookies", price: 300, emoji: "", img: "https://theglutenfreeaustrian.com/wp-content/uploads/2023/12/almondbiscotti9-768x768.jpg" }
];
const DEFAULT_BDAY_CAKES = {
    "Red Velvet": { price: 850, emoji: "", img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
    "Dutch Truffle": { price: 950, emoji: "", img: "https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180" },
    "Pineapple": { price: 675, emoji: "", img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785" },
    "Chocoholic": { price: 900, emoji: "", img: "https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267" },
    "Black Forest": { price: 750, emoji: "", img: "https://sweetandsavorymeals.com/wp-content/uploads/2020/02/black-forest-cake-recipe-SweetAndSavoryMeals4-1054x1536.jpg" },
    "Cheesecake": { price: 1200, emoji: "", img: "https://www.inspiredtaste.net/wp-content/uploads/2024/03/New-York-Cheesecake-Recipe-1.jpg" }
};
const FAVOURITES_KEY = 'brownie_bliss_favourites';
const BROWNIE_BLISS_BAKERY = {
    id: 'brownie-bliss',
    name: 'Brownie Bliss',
    category: 'Homemade Bakery',
    location: 'Krishnagiri',
    img: 'https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338'
};
let favourites = loadFavourites();

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

function loadFavourites() {
    try {
        const saved = JSON.parse(localStorage.getItem(FAVOURITES_KEY) || '{}');
        return {
            bakeries: Array.isArray(saved.bakeries) ? saved.bakeries : [],
            dishes: Array.isArray(saved.dishes) ? saved.dishes : []
        };
    } catch (e) {
        return { bakeries: [], dishes: [] };
    }
}

function saveFavourites() {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
}

function getFavouriteList(type) {
    return type === 'bakeries' ? favourites.bakeries : favourites.dishes;
}

function isFavourite(type, id) {
    return getFavouriteList(type).some(item => String(item.id) === String(id));
}

function updateFavouriteButtons(type, id) {
    const active = isFavourite(type, id);
    document.querySelectorAll(`[data-fav-type="${type}"][data-fav-id="${id}"]`).forEach(btn => {
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.setAttribute('title', active ? 'Remove from favourites' : 'Add to favourites');
        btn.innerHTML = btn.classList.contains('hero-favourite-btn')
            ? `${active ? '&hearts;' : '&#9825;'} ${active ? 'Favourite Saved' : 'Favourite Bakery'}`
            : (active ? '&hearts;' : '&#9825;');
    });
}

function updateFavouritesCount() {
    const count = favourites.bakeries.length + favourites.dishes.length;
    document.querySelectorAll('[data-favourites-count]').forEach(el => {
        el.textContent = count;
        el.style.display = count ? 'inline-flex' : 'none';
    });
}

function toggleFavourite(type, item) {
    const list = getFavouriteList(type);
    const id = String(item.id);
    const existingIndex = list.findIndex(fav => String(fav.id) === id);

    if (existingIndex >= 0) {
        list.splice(existingIndex, 1);
        showToast('Removed from favourites');
    } else {
        list.push({ ...item, id });
        showToast('Saved to favourites');
    }

    saveFavourites();
    updateFavouriteButtons(type, id);
    updateFavouritesCount();
    renderFavouritesPage();
}

function toggleBakeryFavourite() {
    toggleFavourite('bakeries', BROWNIE_BLISS_BAKERY);
}

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
            buildCatalogFromList(data.products);
        } else {
            buildCatalogFromList(null);
        }
    } catch (e) {
        console.error('Error loading products from database:', e);
        buildCatalogFromList(null);
    }
    if (document.getElementById('productsGrid')) {
        filterProducts('all');
    }
    if (document.getElementById('cakePrice')) {
        calculateBdayPrice();
        if (data.success && Array.isArray(data.products) && data.products.length) {
            products = data.products.filter(p => p.type === 'standard').map(p => ({
                id: p.id_ref,
                name: p.name,
                category: p.category,
                price: p.price,
                emoji: p.emoji,
                img: p.img,
                description: p.description || ''
            }));

            const bd = data.products.filter(p => p.type === 'birthday');
            bd.forEach(p => {
                bdayCakes[p.id_ref] = {
                    price: p.price,
                    emoji: p.emoji,
                    img: p.img
                };
            });

            // Re-render UI now that data is loaded
            if (document.getElementById('productsGrid')) {
                filterProducts('all');
            }
            if (document.getElementById('cakePrice')) {
                calculateBdayPrice();
            }
        } else {
            useFallbackProducts();
        }
    } catch (e) {
        console.error('Error loading products from database:', e);
        useFallbackProducts();
    }
}

// --- CART STATE ---
let cart = JSON.parse(localStorage.getItem('brownie_bliss_cart') || '[]');
let checkoutState = { name: '', phone: '', email: '', address: '', city: '', pincode: '', verified: false, currentStep: 1 };

function saveCart() {
    localStorage.setItem('brownie_bliss_cart', JSON.stringify(cart));
}

// --- CART UI ---
function updateCartUI() {
    // Cart contract expected across pages: #cartItems, #cartFooter, #cartTotal, #cartCount, #cartBadge
    const cartContainer = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');
    const cartBadge = document.getElementById('cartBadge');

    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="cart-empty"><span class="cart-empty-icon">🍫</span>Your cart is empty</div>';
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

    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    if (cartCount) cartCount.textContent = count;
    if (cartBadge) cartBadge.textContent = count;
}

function addToCart(product) {
    // Generate a unique key from name + customizations to prevent incorrect merging
    const customKey = product.customizations ? JSON.stringify(product.customizations) : (product.message || '');
    const existing = cart.find(i => i.name === product.name && (
        (i.customizations ? JSON.stringify(i.customizations) : (i.message || '')) === customKey
    ));
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    saveCart();
    updateCartUI();
    showToast('Added to cart! 🛒');
    openCart();
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
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
                    <div class="form-group">
                        <label>Email <span style="font-weight:400;color:var(--text-mid);font-size:12px;">(for your receipt)</span></label>
                        <input type="email" id="custEmail" placeholder="you@example.com" autocomplete="email">
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
    checkoutState = { name: '', phone: '', email: '', address: '', city: '', pincode: '', verified: false, currentStep: 1 };
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
    const email = document.getElementById('custEmail')?.value.trim() || '';

    if (!name) { showToast('Please enter your name'); return; }
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
        showToast('Enter a valid 10-digit phone number'); return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Enter a valid email address'); return;
    }

    checkoutState.name = name;
    checkoutState.phone = phone;
    checkoutState.email = email;

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
        ${checkoutState.email ? `<div style="font-size:13px; color:var(--text-mid); margin-bottom:4px">${checkoutState.email}</div>` : ''}
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
    const lineTotal = cart.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
    const orderData = {
        customer_name: checkoutState.name,
        phone: checkoutState.phone,
        email: checkoutState.email || undefined,
        address: checkoutState.address,
        city: checkoutState.city,
        pincode: checkoutState.pincode,
        items: cart.map(i => ({
            id: typeof i.id === 'number' && Number.isFinite(i.id) ? i.id : 0,
            name: i.name,
            price: Number(i.price),
            qty: Math.max(1, Math.floor(Number(i.qty)) || 1),
            emoji: i.emoji || '🍫',
            category: i.category || 'general',
            customizations: i.customizations || null
        })),
        total: Math.round(lineTotal * 100) / 100
    };

    const waSnapshot = cart.map(i => ({
        name: i.name,
        price: Number(i.price),
        qty: Math.max(1, Math.floor(Number(i.qty)) || 1)
    }));
    const waTotal = orderData.total;

    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        let data;
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
            data = await res.json();
        } else {
            const text = await res.text();
            showToast(text ? text.slice(0, 160) : `Order failed (${res.status})`);
            return;
        }

        if (data.success) {
            const orderId = data.order_id;
            sendWhatsAppFinal(orderId, waSnapshot, waTotal);

            cart = [];
            saveCart();
            updateCartUI();
            closeCheckout();
            showToast(`🎉 Order ${orderId} placed! <a href="track.html?id=${orderId}" class="toast-track-link">Track Order</a>`);
        } else {
            const errText = (data && (data.message || data.error)) ? String(data.message || data.error) : '';
            showToast(errText || `Could not save order (HTTP ${res.status}). Try again or check the server.`);
        }
    } catch (e) {
        console.error(e);
        showToast('Error placing order. Please try again.');
    }
}

// --- WHATSAPP FINAL ---
function sendWhatsAppFinal(orderId, itemsSnap, orderTotal) {
    const lines = Array.isArray(itemsSnap) && itemsSnap.length ? itemsSnap : cart;
    const total = typeof orderTotal === 'number' && Number.isFinite(orderTotal)
        ? orderTotal
        : lines.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
    const itemLines = lines.map(i => `• ${i.name} × ${i.qty} = ₹${(Number(i.price) * Number(i.qty)).toLocaleString('en-IN')}`).join('\n');
function sendWhatsAppFinal(orderId) {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const itemLines = cart.map(i => {
        let line = `• ${i.name} × ${i.qty} = ₹${(i.price * i.qty).toLocaleString()}`;
        if (i.customizations) {
            const c = i.customizations;
            const details = [];
            if (c.dietary) details.push(c.dietary === 'eggless' ? 'Eggless' : 'Egg');
            if (c.toppings && c.toppings.length) details.push(c.toppings.map(t => `+${t.name}`).join(', '));
            if (c.message) details.push(`Msg: "${c.message}"`);
            if (details.length) line += `\n   _${details.join(' | ')}_`;
        }
        return line;
    }).join('\n');

    const message = `🍫 *New Order Received — Brownie Bliss*\n\n` +
        `📋 *Order ID:* ${orderId}\n` +
        `👤 *Customer:* ${checkoutState.name}\n` +
        `📱 *Phone:* +91 ${checkoutState.phone}\n` +
        `📍 *Address:* ${checkoutState.address}, ${checkoutState.city} - ${checkoutState.pincode}\n\n` +
        `🛒 *Order Details:*\n${itemLines}\n\n` +
        `💰 *Total Amount: ₹${total.toLocaleString('en-IN')}*\n\n` +
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

// --- PRODUCT FILTERING ---
function filterProducts(category, btn) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (btn) {
        btn.parentElement.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    const filtered = category === 'all' ? products : products.filter(p => p.category === category);

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
                <button type="button" class="add-to-cart" data-product-id="${String(p.id)}">
                    Add to Cart
                <button class="add-to-cart">
                    Customize & Add
                </button>
            </div>
        </div>
    `).join('');
}

// --- BIRTHDAY CAKE BUILDER ---
let selectedFlavor = 'Red Velvet';
let selectedWeight = '1.0';
const BIRTHDAY_BASE_PRICES = {
    '0.5': 450,
    '1.0': 850,
    '1.5': 1250,
    '2.0': 1600
};
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

    selectedWeight = weight;

    const weightButtons = document.querySelectorAll(
        'button[onclick^="setCakeWeight"]'
    );

    weightButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    if (event && event.target) {
        event.target.classList.add('active');
    }

    calculateBdayPrice();
}

function calculateBdayPrice() {
    const finalPrice = BIRTHDAY_BASE_PRICES[selectedWeight];

    const priceEl = document.getElementById('cakePrice');

    if (priceEl) {
        priceEl.textContent = `₹ ${finalPrice}`;
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
    btn.setAttribute('title', active ? 'Remove from favourites' : 'Add to favourites');
    btn.innerHTML = active ? '&hearts;' : '&#9825;';
}

function toggleBirthdayFavourite() {
    toggleFavourite('dishes', getBirthdayFavouriteItem());
}

function addBirthdayToCart() {
    // Fallback data in case API fails to load
    const fallbacks = {
        'Red Velvet': { img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860', emoji: '🎂' },
        'Dutch Truffle': { img: 'https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180', emoji: '🍰' },
        'Pineapple': { img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg?v=1711124785', emoji: '🍍' },
        'Chocoholic': { img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267', emoji: '🍫' },
        'Black Forest': { img: 'https://sweetandsavorymeals.com/wp-content/uploads/2020/02/black-forest-cake-recipe-SweetAndSavoryMeals4-1054x1536.jpg', emoji: '🌲' },
        'Cheesecake': { img: 'https://www.inspiredtaste.net/wp-content/uploads/2024/03/New-York-Cheesecake-Recipe-1.jpg', emoji: '🧀' }
    };

    const cakeInfo = bdayCakes[selectedFlavor] || fallbacks[selectedFlavor] || fallbacks['Red Velvet'];
    const finalPrice = BIRTHDAY_BASE_PRICES[selectedWeight] || 850;
    const msgInput = document.getElementById('cakeMessage');
    const message = msgInput ? msgInput.value.trim() : '';

    const item = {
        id: `bday-${selectedFlavor}-${selectedWeight}`,
        name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
        price: Math.round(finalPrice),
        img: cakeInfo.img,
        emoji: cakeInfo.emoji,
        category: 'cakes',
        message: message,
        qty: 1
    };
    addToCart(item);
    if (msgInput) msgInput.value = '';
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

    const hasFavourites = favourites.bakeries.length || favourites.dishes.length;
    if (emptyState) emptyState.style.display = hasFavourites ? 'none' : 'block';
    if (bakeryGroup) bakeryGroup.style.display = favourites.bakeries.length ? 'block' : 'none';
    if (dishesGroup) dishesGroup.style.display = favourites.dishes.length ? 'block' : 'none';
}

function addDessertToCart() {
    const item = {
        id: "dessert-macarons",
        name: "Assorted Macarons (Box of 4)",
        price: 350,
        img: "https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427",
        emoji: "🍮",
        category: "desserts",
        qty: 1
    };
    addToCart(item);
    openCart();
}

function addBrownieToCart() {
    const item = {
        id: "brownie-overload",
        name: "Overload Brownie (Pack of 4)",
        price: 250,
        img: "https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338",
        emoji: "🍫",
        category: "brownies",
        qty: 1
    };
    addToCart(item);
    openCart();
}

function addCookieToCart() {
    const item = {
        id: "cookie-choco-chip",
        name: "Choco Chip Cookies (Box of 6)",
        price: 250,
        img: "https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg",
        emoji: "🍪",
        category: "cookies",
        qty: 1
    };
    addToCart(item);
    openCart();
}

// --- UTILITIES ---
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Sync toggle icon with current theme (class was set by blocking <script> in <head>)
    applyTheme(localStorage.getItem('bb_theme') || 'light');

    updateCartUI();
    if (document.getElementById('productsGrid')) {
        filterProducts('all');
    }
    if (document.getElementById('cakePrice')) {
        calculateBdayPrice();
    }
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.add-to-cart');
            if (!btn || !productsGrid.contains(btn)) return;
            const rawId = btn.getAttribute('data-product-id');
            if (rawId == null || rawId === '') return;
            const product = products.find((pr) => String(pr.id) === String(rawId));
            if (product) addToCart({ ...product });
        });
    }
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
});

// --- TRACK ORDER LOGIC ---
async function trackOrder(id) {
    const orderIdInput = document.getElementById('orderIdInput');
    const trackError = document.getElementById('trackError');
    if (!orderIdInput) return;

    if (trackError) trackError.style.display = 'none';

    const orderId = id || orderIdInput.value.trim();
    if (!orderId) {
        if (trackError) {
            trackError.textContent = 'Please enter an Order ID';
            trackError.style.display = 'block';
        }
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/orders/${orderId}`);
        const data = await res.json();
        if (data.success || data.order) {
            renderOrderDetails(data.order || data);
        } else {
            if (trackError) {
                trackError.textContent = data.error || 'Order not found';
                trackError.style.display = 'block';
            }
            document.getElementById('result').style.display = 'none';
        }
    } catch (e) {
        if (trackError) {
            trackError.textContent = 'Error fetching order. Make sure the server is running!';
            trackError.style.display = 'block';
        }
        document.getElementById('result').style.display = 'none';
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
        document.getElementById('resDate').textContent = 'N/A';
    }

    let itemsHtml = '';
    try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        itemsHtml = items.map(i => {
            const itemTotal = (i.price && i.qty) ? i.price * i.qty : i.price || 0;
            const priceHtml = itemTotal ? `₹${itemTotal.toLocaleString('en-IN')}` : '';
            return `<tr>
                        <td>${i.emoji || ''} ${i.name} × ${i.qty}</td>
                        <td class="text-right track-item-price">${priceHtml}</td>
                    </tr>`;
        }).join('');
    } catch (e) {
        itemsHtml = `<tr><td colspan="2">${order.items}</td></tr>`;
    }

    document.getElementById('resItems').innerHTML = itemsHtml;
    document.getElementById('resTotal').textContent = order.total;

    document.getElementById('result').style.display = 'block';
}
function toggleMenu(){
  document
    .getElementById("mobileMenu")
    .classList.toggle("show");
}

// --- PRODUCT CUSTOMIZATION MODAL ---
let _customizeProduct = null;

function injectCustomizeModal() {
    if (document.getElementById('customizeOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'customizeOverlay';
    overlay.className = 'customize-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) closeCustomizeModal(); };
    overlay.innerHTML = `
        <div class="customize-modal">
            <button class="customize-close" onclick="closeCustomizeModal()">✕</button>
            <div class="customize-header">
                <img id="customizeImg" src="" alt="">
                <div class="customize-header-info">
                    <div class="customize-product-name" id="customizeName"></div>
                    <div class="customize-product-cat" id="customizeCat"></div>
                    <div class="customize-base-price">Base: ₹<span id="customizeBasePrice">0</span></div>
                </div>
            </div>

            <div class="customize-body">
                <!-- Dietary -->
                <div class="customize-section">
                    <h4 class="customize-section-title">🥚 Dietary Preference</h4>
                    <div class="customize-options dietary-options">
                        <label class="customize-option">
                            <input type="radio" name="dietary" value="egg" checked>
                            <span class="customize-option-label">Egg</span>
                        </label>
                        <label class="customize-option">
                            <input type="radio" name="dietary" value="eggless">
                            <span class="customize-option-label">🌱 Eggless</span>
                        </label>
                    </div>
                </div>

                <!-- Toppings -->
                <div class="customize-section">
                    <h4 class="customize-section-title">🍫 Add Toppings</h4>
                    <div class="customize-options topping-options">
                        <label class="customize-option topping-check">
                            <input type="checkbox" name="topping" value="Extra Choco Chips" data-price="50">
                            <span class="customize-option-label">Extra Choco Chips <span class="topping-price">+₹50</span></span>
                        </label>
                        <label class="customize-option topping-check">
                            <input type="checkbox" name="topping" value="Caramel Drizzle" data-price="30">
                            <span class="customize-option-label">Caramel Drizzle <span class="topping-price">+₹30</span></span>
                        </label>
                        <label class="customize-option topping-check">
                            <input type="checkbox" name="topping" value="Walnuts" data-price="40">
                            <span class="customize-option-label">Walnuts <span class="topping-price">+₹40</span></span>
                        </label>
                    </div>
                </div>

                <!-- Personalization -->
                <div class="customize-section">
                    <h4 class="customize-section-title">✉️ Custom Message</h4>
                    <textarea id="customizeMessage" class="customize-message" placeholder="e.g. Happy Birthday Adithi!" maxlength="100" rows="2"></textarea>
                </div>
            </div>

            <div class="customize-footer">
                <div class="customize-total">
                    <span>Total Price</span>
                    <strong id="customizeTotalPrice">₹0</strong>
                </div>
                <button class="customize-confirm-btn" onclick="confirmCustomization()">
                    Confirm & Add to Cart →
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Attach live price listeners
    overlay.querySelectorAll('input[name="topping"]').forEach(cb => {
        cb.addEventListener('change', updateCustomizePrice);
    });
}

function openCustomizeModal(product) {
    injectCustomizeModal();
    _customizeProduct = product;

    document.getElementById('customizeImg').src = product.img;
    document.getElementById('customizeName').textContent = product.name;
    document.getElementById('customizeCat').textContent = product.category;
    document.getElementById('customizeBasePrice').textContent = product.price;

    // Reset selections
    document.querySelector('input[name="dietary"][value="egg"]').checked = true;
    document.querySelectorAll('input[name="topping"]').forEach(cb => cb.checked = false);
    document.getElementById('customizeMessage').value = '';

    updateCustomizePrice();
    document.getElementById('customizeOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCustomizeModal() {
    const overlay = document.getElementById('customizeOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    _customizeProduct = null;
}

function updateCustomizePrice() {
    if (!_customizeProduct) return;
    let total = _customizeProduct.price;
    document.querySelectorAll('input[name="topping"]:checked').forEach(cb => {
        total += parseInt(cb.dataset.price) || 0;
    });
    document.getElementById('customizeTotalPrice').textContent = `₹${total}`;
}

function confirmCustomization() {
    if (!_customizeProduct) return;

    const dietary = document.querySelector('input[name="dietary"]:checked')?.value || 'egg';
    const toppings = [];
    document.querySelectorAll('input[name="topping"]:checked').forEach(cb => {
        toppings.push({ name: cb.value, price: parseInt(cb.dataset.price) || 0 });
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
