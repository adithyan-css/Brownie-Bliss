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
lectedFlavor = 'Red Velvet';
let selectedWeight = '1.0';

const BIRTHDAY_BASE_PRICES = {
    '0.5': 450,
    '1.0': 850,
    '1.5': 1250,
    '2.0': 1600
};

const DEFAUlet seLT_PRODUCTS = [
    { id: 1, name: "Velvet Dream Cake", category: "cakes", price: 850, img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
    { id: 2, name: "Dutch Truffle Delight", category: "cakes", price: 950, img: "https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180" },
    { id: 3, name: "Pineapple Fresh Cream", category: "cakes", price: 675, img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg" }
];

const DEFAULT_BDAY_CAKES = {
    "Red Velvet": { price: 850, img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
    "Dutch Truffle": { price: 950, img: "https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180" }
};


// --- FAVOURITES ---
const FAVOURITES_KEY = 'brownie_bliss_favourites';

let favourites = loadFavourites();

function loadFavourites() {
    try {
        return JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || {
            bakeries: [],
            dishes: []
        };
    } catch (e) {
        console.error("Favourites load error:", e);
        return { bakeries: [], dishes: [] };
    }
}

function saveFavourites() {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
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
    currentStep: 1
};

function saveCart() {
    localStorage.setItem('brownie_bliss_cart', JSON.stringify(cart));
}


// --- CART UI ---
function updateCartUI() {
    const cartContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartFooter = document.getElementById('cartFooter');

    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = "Cart empty 🍫";
        if (cartFooter) cartFooter.style.display = "none";
        if (cartTotal) cartTotal.textContent = "₹0";
        return;
    }

    cartContainer.innerHTML = cart.map((item, index) => {

        const c = item.customizations;
        let customBadges = '';

        if (c) {
            if (c.dietary) {
                customBadges += `<span class="cart-custom-badge">
                    ${c.dietary === 'eggless' ? '🌱 Eggless' : '🥚 Egg'}
                </span>`;
            }

            if (c.toppings?.length) {
                customBadges += c.toppings
                    .map(t => `<span class="cart-custom-badge">+ ${t.name}</span>`)
                    .join('');
            }

            if (c.message) {
                customBadges += `<span class="cart-custom-badge">✉ "${c.message}"</span>`;
            }
        }

        return `
        <div class="cart-item">
            <img src="${item.img || 'https://via.placeholder.com/70'}" alt="${item.name}">

            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${Number(item.price).toLocaleString('en-IN')}</div>

                ${customBadges ? `<div class="cart-custom-tags">${customBadges}</div>` : ''}

                <div class="cart-qty">
                    <button onclick="changeQty(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>

            <button onclick="removeFromCart(${index})">✕</button>
        </div>
        `;
    }).join('');

    const total = cart.reduce((sum, item) =>
        sum + (Number(item.price) * item.qty), 0
    );

    if (cartTotal) {
        cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    if (cartFooter) {
        cartFooter.style.display = "block";
    }
}


// --- CART FUNCTIONS ---
function addToCart(product) {
    const existing = cart.find(i => i.name === product.name);

    if (existing) existing.qty++;
    else cart.push({ ...product, qty: 1 });

    saveCart();
    updateCartUI();
    showToast("Added to cart! 🛒");
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


// --- PRODUCT FILTER ---
function filterProducts(category) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const filtered =
        category === 'all'
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

// --- PRODUCT FILTER ---
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
        </div>
    `).join('');
}

// --- CART FUNCTIONS ---
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

                <!-- STEP 1 -->
                <div id="checkStep1">
                    <h3 class="checkout-title">Contact Information</h3>
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" id="custName">
                    </div>

                    <div class="form-group">
                        <label>Phone Number</label>
                        <div class="phone-input-group">
                            <span class="prefix">+91</span>
                            <input type="tel" id="custPhone" maxlength="10">
                        </div>
                    </div>

                    <button class="hero-cta" style="width:100%" onclick="sendOTP()">
                        Send OTP →
                    </button>
                </div>

                <!-- STEP 2 -->
                <div id="checkStep2" class="hidden">
                    <h3 class="checkout-title">Confirm Number</h3>

                    <div class="otp-container">
                        <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,0)">
                        <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,1)">
                        <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,2)">
                        <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,3)">
                        <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,4)">
                        <input type="text" class="otp-box" maxlength="1" onkeyup="otpNext(this,5)">
                    </div>

                    <button class="hero-cta" style="width:100%" onclick="verifyOTP()">
                        Verify →
                    </button>
                </div>

                <!-- STEP 3 -->
                <div id="checkStep3" class="hidden">
                    <h3 class="checkout-title">Delivery Details</h3>

                    <textarea id="custAddr"></textarea>

                    <input type="text" id="custCity" placeholder="City">
                    <input type="text" id="custPin" maxlength="6" placeholder="Pincode">

                    <button class="hero-cta" style="width:100%" onclick="goToConfirm()">
                        Review →
                    </button>
                </div>

                <!-- STEP 4 -->
                <div id="checkStep4" class="hidden">
                    <h3 class="checkout-title">Final Review</h3>

                    <button class="whatsapp-btn" onclick="placeOrder()">
                        Place Order →
                    </button>
                </div>

            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

function openCheckout() {
    if (cart.length === 0) {
        showToast('Cart is empty 🍫');
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
        currentStep: 1
    };

    document.getElementById('checkoutOverlay').classList.add('open');
}

function closeCheckout() {
    document.getElementById('checkoutOverlay').classList.remove('open');
}



// --- CHECKOUT STEP NAVIGATION ---
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

// --- SEND OTP ---
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
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Send Verification OTP →';
        }
    }
}

// --- OTP INPUT ---
function otpNext(input, idx) {
    input.value = input.value.replace(/\D/g, '');
    if (input.value && idx < 5) {
        document.querySelectorAll('.otp-box')[idx + 1]?.focus();
    }
}

// --- VERIFY OTP ---
async function verifyOTP() {
    const otp = [...document.querySelectorAll('.otp-box')]
        .map(b => b.value)
        .join('');

    if (otp.length !== 6) {
        showToast('Enter all 6 digits');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: checkoutState.phone,
                otp
            })
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

// --- ADDRESS STEP ---
function goToConfirm() {
    const addr = document.getElementById('custAddr').value.trim();
    const city = document.getElementById('custCity').value.trim();
    const pin = document.getElementById('custPin').value.trim();

    if (!addr) return showToast('Enter your street address');
    if (!city) return showToast('Enter your city');
    if (!pin || pin.length !== 6) return showToast('Enter valid 6-digit pincode');

    checkoutState.address = addr;
    checkoutState.city = city;
    checkoutState.pincode = pin;

    document.getElementById('confirmCustomer').innerHTML = `
        <div style="font-weight:600">${checkoutState.name}</div>
        <div>+91 ${checkoutState.phone}</div>
        <div>${addr}, ${city} - ${pin}</div>
    `;

    document.getElementById('confirmItems').innerHTML = cart.map(i => `
        <div class="confirm-row">
            <span>${i.name} × ${i.qty}</span>
            <strong>₹${(i.price * i.qty).toLocaleString()}</strong>
        </div>
    `).join('');

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    document.getElementById('confirmTotal').textContent =
        `₹${total.toLocaleString()}`;

    showCheckoutStep(4);
}

// --- PLACE ORDER ---
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

            showToast(
                `🎉 Order ${orderId} placed!`
            );
        } else {
            showToast('Failed to save order. Try again.');
        }
    } catch (e) {
        showToast('Error placing order.');
    }
}

// --- FIXED WHATSAPP FUNCTION (ONLY ONE VERSION) ---
function sendWhatsAppFinal(orderId) {

    const lines = cart;

    const total = lines.reduce(
        (s, i) => s + Number(i.price) * Number(i.qty),
        0
    );

    const itemLines = lines.map(i => {
        let line = `• ${i.name} × ${i.qty} = ₹${(i.price * i.qty).toLocaleString('en-IN')}`;

        if (i.customizations) {
            const c = i.customizations;
            const details = [];

            if (c.dietary) {
                details.push(c.dietary === 'eggless' ? 'Eggless' : 'Egg');
            }

            if (c.toppings?.length) {
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
        `💰 *Total: ₹${total.toLocaleString('en-IN')}*\n\n` +
        `_Thank you for your order!_`;

    const encoded = encodeURIComponent(message);

    const phone = "918072596340";

    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
}

// --- CATEGORY FILTER ---
function filterProducts(category, btn) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let filtered =
        category === 'all'
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
        </div>
    `).join('');
}

// --- BIRTHDAY FUNCTION FIX (ONLY START FIXED) ---
function updateBirthdayCake(flavor) {
    if (!bdayCakes[flavor]) {
        console.error("Cake flavor not found:", flavor);
        return;
    }
}

// --- BIRTHDAY CAKE FLAVOR ---
function setCakeFlavor(flavor) {
    selectedFlavor = flavor;

    const cakeImg = document.getElementById('birthdayCakeImg');

    if (cakeImg && bdayCakes[flavor]) {
        cakeImg.src = bdayCakes[flavor].img;
    }

    document.querySelectorAll('.filter-pill').forEach(btn => {
        if (btn.textContent.trim() === flavor) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    calculateBdayPrice();
}

// --- BIRTHDAY CAKE STATE (ONLY ONCE) ---
let selectedFlavor = "Red Velvet";
let selectedWeight = "1.0";

const BIRTHDAY_BASE_PRICES = {
    "0.5": 450,
    "1.0": 850,
    "1.5": 1250,
    "2.0": 1600
};

// --- SET WEIGHT ---
function setCakeWeight(weight, event) {
    selectedWeight = weight;

    document.querySelectorAll('.weight-btn')
        .forEach(b => b.classList.remove('active'));

    if (event?.target) {
        event.target.classList.add('active');
    }

    calculateBdayPrice();
}

// --- PRICE CALCULATION ---
function calculateBdayPrice() {
    const price = BIRTHDAY_BASE_PRICES[selectedWeight] || 850;

    const priceEl = document.getElementById('cakePrice');
    if (priceEl) {
        priceEl.textContent = `₹ ${price}`;
    }

    updateBirthdayFavouriteButton();
}

// --- FAV ITEM ---
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

// --- FAVORITE BUTTON UPDATE ---
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

// --- TOGGLE FAVORITE ---
function toggleBirthdayFavourite() {
    toggleFavourite('dishes', getBirthdayFavouriteItem());
}

// --- ADD TO CART ---
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
}

// --- WHATSAPP (REMOVED DUPLICATE BUG SECTION) ---
function sendWhatsAppFinal(orderId) {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

    const itemLines = cart.map(i => {
        let line = `• ${i.name} × ${i.qty} = ₹${(i.price * i.qty).toLocaleString('en-IN')}`;

        if (i.customizations) {
            const c = i.customizations;
            const details = [];

            if (c.dietary) {
                details.push(c.dietary === 'eggless' ? 'Eggless' : 'Egg');
            }

            if (c.toppings?.length) {
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
        `🍫 *New Order Received*\n\n` +
        `📋 Order ID: ${orderId}\n` +
        `👤 ${checkoutState.name}\n` +
        `📱 +91 ${checkoutState.phone}\n` +
        `📍 ${checkoutState.address}, ${checkoutState.city} - ${checkoutState.pincode}\n\n` +
        `🛒 Items:\n${itemLines}\n\n` +
        `💰 Total: ₹${total.toLocaleString('en-IN')}`;

    window.open(
        `https://wa.me/918072596340?text=${encodeURIComponent(message)}`,
        "_blank"
    );
}

// --- FAVOURITES PAGE RENDER ---
function renderFavouritesPage() {
    const bakeryGrid = document.getElementById('favouriteBakeriesGrid');
    const dishesGrid = document.getElementById('favouriteDishesGrid');

    if (bakeryGrid) {
        bakeryGrid.innerHTML = favourites.bakeries.map(bakery => `
            <article class="favourite-bakery-card">
                <img src="${bakery.img}" alt="${bakery.name}">
                <div>
                    <h3>${bakery.name}</h3>
                    <p>${bakery.location}</p>
                </div>
            </article>
        `).join('');
    }

    if (dishesGrid) {
        dishesGrid.innerHTML = favourites.dishes.map(dish => `
            <div class="product-card">
                <img src="${dish.img}" alt="${dish.name}">
                <div>
                    <h3>${dish.name}</h3>
                    ${dish.price ? `<p>₹${dish.price}</p>` : ''}
                </div>
            </div>
        `).join('');
    }
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
    loadProducts();
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

    loadProducts();
});


// ✅ FIXED SCROLL EVENT (was broken in your code)
window.addEventListener("scroll", function () {
    const btn = document.getElementById("scrollTopBtn");
    if (!btn) return;

    if (window.scrollY > 300) {
        btn.style.display = "block";
    } else {
        btn.style.display = "none";
    }
});


// --- TRACK ORDER LOGIC ---
async function trackOrder(id) {
    const orderIdInput = document.getElementById('orderIdInput');
    const trackError = document.getElementById('trackError');
    const result = document.getElementById('result');

    if (!orderIdInput) return;

    if (trackError) {
        trackError.classList.remove('show');
        trackError.textContent = '';
    }

    if (result) {
        result.style.display = 'none';
    }

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

            if (result) {
                result.style.display = 'block';
            }
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

    const statusLower = (order.status || 'pending').toLowerCase();

    const resTotalTop = document.getElementById('resTotalTop');
    if (resTotalTop) resTotalTop.textContent = order.total;

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

            steps.forEach(s => {
                const el = document.getElementById(`step-${s}`);
                if (el) el.classList.remove('active', 'completed');
            });

            const currentIndex =
                steps.indexOf(statusLower) > -1 ? steps.indexOf(statusLower) : 0;

            steps.forEach((s, i) => {
                const el = document.getElementById(`step-${s}`);
                if (!el) return;

                if (i < currentIndex) el.classList.add('completed');
                else if (i === currentIndex) el.classList.add('active');
            });
        }
    }

    if (order.created_at) {
        document.getElementById('resDate').textContent =
            new Date(order.created_at).toLocaleString();
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function initFAQ() {
    const items = document.querySelectorAll(".faq-item");

    items.forEach((item) => {
        const question = item.querySelector(".faq-question");

        if (!question) return;

        question.addEventListener("click", () => {
            item.classList.toggle("active");
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initFAQ();
});