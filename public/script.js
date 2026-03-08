// --- CONFIG ---
// API_BASE is defined in cart.js

// --- PRODUCTS DATA ---
let products = [];
let bdayCakes = {};

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (data.success) {
            products = data.products.filter(p => p.type === 'standard').map(p => ({
                id: p.id_ref,
                name: p.name,
                category: p.category,
                price: p.price,
                emoji: p.emoji,
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

            // Re-render UI now that data is loaded
            if (document.getElementById('productsGrid')) {
                filterProducts('all');
            }
            if (document.getElementById('cakePrice')) {
                calculateBdayPrice();
            }
        }
    } catch (e) {
        console.error('Error loading products from database:', e);
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
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');
    const cartBadge = document.getElementById('cartBadge');

    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="cart-empty"><span class="cart-empty-icon">🍫</span>Your cart is empty</div>';
        if (cartFooter) cartFooter.style.display = 'none';
    } else {
        cartContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.img || 'https://via.placeholder.com/70'}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                    ${item.message ? `<div style="font-size:11px; color:#888; font-style:italic">Msg: "${item.message}"</div>` : ''}
                    <div class="cart-qty">
                        <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                        <span class="qty-num">${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${index})">✕</button>
            </div>
        `).join('');
        if (cartFooter) cartFooter.style.display = 'block';
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        if (cartTotal) cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    if (cartCount) cartCount.textContent = count;
    if (cartBadge) cartBadge.textContent = count;
}

function addToCart(product) {
    const existing = cart.find(i => i.name === product.name && i.message === product.message);
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
    checkoutState.verified = true;
    showCheckoutStep(3);
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
            category: i.category || 'general'
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
            showToast('🎉 Order placed successfully!');
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
    const itemLines = cart.map(i => `• ${i.name} × ${i.qty} = ₹${(i.price * i.qty).toLocaleString()}`).join('\n');

    const message = `🍫 *New Order Received — Brownie Bliss*\n\n` +
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
        <div class="product-card">
            <div class="product-img-wrap">
                <img src="${p.img}" alt="${p.name}">
                ${p.id < 4 ? '<div class="bestseller-badge">⭐ Bestseller</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-price">₹${p.price}</div>
                <button class="add-to-cart" onclick='addToCart(${JSON.stringify(p)})'>
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// --- BIRTHDAY CAKE BUILDER ---
let selectedFlavor = 'Red Velvet';
let selectedWeight = '1.0';
// bdayCakes object is now populated dynamically via loadProducts()

function updateBirthdayCake(flavor) {
    selectedFlavor = flavor;
    const cakeImg = document.getElementById('birthdayCakeImg');
    if (cakeImg) cakeImg.src = bdayCakes[flavor].img;

    if (event && event.target) {
        event.target.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
    }
    calculateBdayPrice();
}

function setCakeWeight(weight) {
    selectedWeight = weight;
    if (event && event.target) {
        event.target.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
    }
    calculateBdayPrice();
}

function calculateBdayPrice() {
    if (!bdayCakes[selectedFlavor]) return; // Wait until loaded
    const finalPrice = bdayCakes[selectedFlavor].price * parseFloat(selectedWeight);
    const priceEl = document.getElementById('cakePrice');
    if (priceEl) priceEl.textContent = `₹ ${Math.round(finalPrice)}`;
}

function addBirthdayToCart() {
    if (!bdayCakes[selectedFlavor]) return; // Wait until loaded
    const finalPrice = bdayCakes[selectedFlavor].price * parseFloat(selectedWeight);
    const msgInput = document.getElementById('cakeMessage');
    const message = msgInput ? msgInput.value.trim() : '';

    const item = {
        id: `bday-${selectedFlavor}-${selectedWeight}`,
        name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
        price: Math.round(finalPrice),
        img: bdayCakes[selectedFlavor].img,
        emoji: bdayCakes[selectedFlavor].emoji,
        category: "cakes",
        message: message,
        qty: 1
    };
    addToCart(item);
    if (msgInput) msgInput.value = '';
    openCart();
}

// --- UTILITIES ---
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    loadProducts(); // Load and then automatically re-render main grid/birthday block
});
