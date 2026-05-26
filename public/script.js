// --- CONFIG ---
const API_BASE = '/api';
const FAVOURITES_KEY = 'brownie_bliss_favourites';
const CART_KEY = 'brownie_bliss_cart';
const THEME_KEY = 'bb_theme';

const BIRTHDAY_BASE_PRICES = {
    '0.5': 450,
    '1.0': 850,
    '1.5': 1250,
    '2.0': 1600
};

const DEFAULT_PRODUCTS = [
    { id: 1, name: "Velvet Dream Cake", category: "cakes", price: 850, img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860", description: "Soft, velvety red cake with cream cheese frosting." },
    { id: 2, name: "Dutch Truffle Delight", category: "cakes", price: 950, img: "https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180", description: "Rich chocolate truffle cake for chocolate lovers." },
    { id: 3, name: "Pineapple Fresh Cream", category: "cakes", price: 675, img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg", description: "Light and fruity pineapple cake with fresh cream." },
    { id: 4, name: "Walnut Brownie", category: "brownies", price: 90, img: "https://theobroma.in/cdn/shop/files/WalnutBrownie_400x400.jpg?v=1711183281", description: "Classic chocolate brownie with crunchy walnuts." }
];

const DEFAULT_BDAY_CAKES = {
    "Red Velvet": { price: 850, img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860", emoji: "🎂" },
    "Dutch Truffle": { price: 950, img: "https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180", emoji: "🍰" },
    "Pineapple": { price: 675, img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg?v=1711124785", emoji: "🍍" },
    "Chocoholic": { price: 950, img: "https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267", emoji: "🍫" },
    "Black Forest": { price: 750, img: "https://sweetandsavorymeals.com/wp-content/uploads/2020/02/black-forest-cake-recipe-SweetAndSavoryMeals4-1054x1536.jpg", emoji: "🌲" },
    "Cheesecake": { price: 1200, img: "https://www.inspiredtaste.net/wp-content/uploads/2024/03/New-York-Cheesecake-Recipe-1.jpg", emoji: "🧀" }
};

const BROWNIE_BLISS_BAKERY = {
    id: 'brownie-bliss',
    name: 'Brownie Bliss',
    category: 'Homemade Bakery',
    location: 'Krishnagiri, Tamil Nadu',
    img: 'https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338'
};

// --- STATE ---
let products = [];
let bdayCakes = {};
let favourites = { bakeries: [], dishes: [] };
let cart = [];
let checkoutState = { name: '', phone: '', address: '', city: '', pincode: '', verified: false, currentStep: 1 };
let selectedFlavor = "Red Velvet";
let selectedWeight = "1.0";
let selectedPriceFilter = 'all';

// --- THEME ---
function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const next = isDark ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Theme
    applyTheme(localStorage.getItem(THEME_KEY) || 'light');
    
    // Load state from local storage
    cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    favourites = loadFavourites();
    
    // UI Updates
    updateCartUI();
    updateFavouritesCount();
    
    // Data Loading
    loadProducts();
    
    // Page specific initializers
    if (document.getElementById('favouriteBakeriesGrid')) {
        renderFavouritesPage();
    }
    
    // Theme toggle init
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Track Order auto-fill
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const trackInput = document.getElementById('orderIdInput');
    if (idParam && trackInput) {
        trackInput.value = idParam;
        trackOrder(idParam);
    }
    
    // Scroll to Top visibility
    window.addEventListener("scroll", () => {
        const btn = document.getElementById("scrollTopBtn");
        if (btn) {
            btn.style.display = window.scrollY > 300 ? "flex" : "none";
        }
    });

    // Mobile Menu
    const toggleBtn = document.querySelector('.menu-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleMenu);
    }
});

// Key shortcut for scroll to top
document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "t") {
        scrollToTop();
    }
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- DATA HANDLING ---
async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();

        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
            buildCatalogFromList(data.products);
        } else {
            useFallbackProducts();
        }
    } catch (e) {
        console.error('Error loading products:', e);
        useFallbackProducts();
    }
    
    // Initial Render
    if (document.getElementById('productsGrid')) {
        filterProducts('all');
    }
    if (document.getElementById('cakePrice')) {
        calculateBdayPrice();
    }
}

function buildCatalogFromList(list) {
    products = list.filter(p => p.type === 'standard').map(p => ({
        id: p.id_ref || p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        emoji: p.emoji,
        img: p.img,
        description: p.description || ''
    }));

    bdayCakes = {};
    list.filter(p => p.type === 'birthday').forEach(p => {
        bdayCakes[p.name] = {
            id: p.id_ref || p.id,
            price: p.price,
            img: p.img,
            emoji: p.emoji || '🎂'
        };
    });
}

function useFallbackProducts() {
    products = DEFAULT_PRODUCTS;
    bdayCakes = DEFAULT_BDAY_CAKES;
}

// --- PRODUCT UI ---
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

    // Apply Price Filter
    if (selectedPriceFilter === 'under200') {
        filtered = filtered.filter(p => p.price < 200);
    } else if (selectedPriceFilter === '200to500') {
        filtered = filtered.filter(p => p.price >= 200 && p.price <= 500);
    } else if (selectedPriceFilter === 'above500') {
        filtered = filtered.filter(p => p.price > 500);
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <div class="product-img-wrap">
                <img src="${p.img}" alt="${p.name}">
                <button class="favorite-btn ${isFavourite('dishes', p.id) ? 'active' : ''}"
                    type="button"
                    onclick='toggleFavourite("dishes", ${JSON.stringify(p).replace(/'/g, "&apos;")})'
                    title="${isFavourite('dishes', p.id) ? 'Remove from favourites' : 'Add to favourites'}">
                    ${isFavourite('dishes', p.id) ? '&hearts;' : '&#9825;'}
                </button>
                ${p.id < 4 ? '<div class="bestseller-badge">⭐ Bestseller</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <div class="product-name">${p.name}</div>
                ${p.description ? \`<div class="product-desc">\${p.description}</div>\` : ''}
                <div class="product-price">₹\${p.price.toLocaleString('en-IN')}</div>
                <button class="add-to-cart" onclick='addToCart(\${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                    Add to Cart 🛒
                </button>
            </div>
        </div>
    `).join('');
}

function updatePriceFilter() {
    const filterEl = document.getElementById('priceFilter');
    if (!filterEl) return;
    selectedPriceFilter = filterEl.value;

    const activeTab = document.querySelector('.filter-tab.active');
    const activeCategory = activeTab ? activeTab.textContent.toLowerCase() : 'all';
    filterProducts(activeCategory === 'all' ? 'all' : activeCategory);
}

// --- BIRTHDAY CAKE BUILDER ---
function updateBirthdayCake(flavor) {
    if (!bdayCakes[flavor]) {
        console.error("Cake flavor not found:", flavor);
        return;
    }
    selectedFlavor = flavor;
    
    const cakeImg = document.getElementById('birthdayCakeImg');
    if (cakeImg) cakeImg.src = bdayCakes[flavor].img;

    document.querySelectorAll('.flavor-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === flavor);
    });

    calculateBdayPrice();
}

function setCakeWeight(weight, event) {
    selectedWeight = weight;
    document.querySelectorAll('.weight-btn, .birthday-section .filter-tab').forEach(b => {
        if (b.textContent.includes(weight)) b.classList.add('active');
        else b.classList.remove('active');
    });
    calculateBdayPrice();
}

function calculateBdayPrice() {
    const price = BIRTHDAY_BASE_PRICES[selectedWeight] || 850;
    const priceEl = document.getElementById('cakePrice');
    if (priceEl) priceEl.textContent = `₹ ${price}`;
    updateBirthdayFavouriteButton();
}

function addBirthdayToCart() {
    const cakeInfo = bdayCakes[selectedFlavor] || DEFAULT_BDAY_CAKES[selectedFlavor] || DEFAULT_BDAY_CAKES["Red Velvet"];
    const finalPrice = BIRTHDAY_BASE_PRICES[selectedWeight] || 850;
    const msgInput = document.getElementById('cakeMessage');
    const message = msgInput ? msgInput.value.trim() : '';

    const item = {
        id: `bday-${selectedFlavor}-${selectedWeight}`,
        name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
        price: finalPrice,
        img: cakeInfo.img,
        emoji: cakeInfo.emoji || '🎂',
        category: 'cakes',
        message: message,
        qty: 1
    };

    addToCart(item);
    showToast('🎂 Birthday cake added to cart!');
    if (msgInput) msgInput.value = '';
    openCart();
}

function addDessertToCart() {
    addToCart({ id: 101, name: "Gourmet Dessert Box", price: 350, img: "https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427", emoji: "🍮", category: "desserts" });
    openCart();
}

function addBrownieToCart() {
    addToCart({ id: 102, name: "Signature Brownie Pack", price: 250, img: "https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338", emoji: "🍫", category: "brownies" });
    openCart();
}

function addCookieToCart() {
    addToCart({ id: 103, name: "Gourmet Cookie Box", price: 250, img: "https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg", emoji: "🍪", category: "cookies" });
    openCart();
}

// --- CART LOGIC ---
function addToCart(product) {
    const existing = cart.find(i => i.id === product.id && i.name === product.name && i.message === product.message);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    saveCart();
    updateCartUI();
    showToast('Added to cart! 🛒');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const badge = document.getElementById('cartBadge');
    const footer = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotal');
    
    if (!cartItems) return;

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    if (badge) badge.textContent = totalQty;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="cart-empty"><span class="cart-empty-icon">🍫</span>Your cart is empty</div>';
        if (footer) footer.style.display = 'none';
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.img || 'https://via.placeholder.com/70'}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                    ${item.message ? `<div class="cart-custom-tags"><span class="cart-custom-badge cart-custom-msg">✉ "${item.message}"</span></div>` : ''}
                    <div class="cart-qty">
                        <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                        <span class="qty-num">${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${index})">✕</button>
            </div>
        `).join('');
        
        if (footer) footer.style.display = 'block';
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        if (totalEl) totalEl.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
    }
}

function openCart() {
    document.getElementById('cartSidebar')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
}

function closeCart() {
    document.getElementById('cartSidebar')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
}

// --- FAVOURITES ---
function loadFavourites() {
    try {
        return JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || { bakeries: [], dishes: [] };
    } catch {
        return { bakeries: [], dishes: [] };
    }
}

function saveFavourites() {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
    updateFavouritesCount();
}

function isFavourite(type, id) {
    return favourites[type].some(item => item.id === id);
}

function toggleFavourite(type, item) {
    const index = favourites[type].findIndex(i => i.id === item.id);
    if (index > -1) {
        favourites[type].splice(index, 1);
        showToast('Removed from favourites');
    } else {
        favourites[type].push(item);
        showToast('Added to favourites! ❤️');
    }
    saveFavourites();
    
    // Update UI if on index or favourites page
    if (type === 'dishes') {
        if (document.getElementById('productsGrid')) {
            const activeTab = document.querySelector('.filter-tab.active');
            filterProducts(activeTab ? activeTab.textContent.toLowerCase() : 'all');
        }
        updateBirthdayFavouriteButton();
    }
    if (document.getElementById('favouriteBakeriesGrid')) {
        renderFavouritesPage();
    }
}

function updateFavouritesCount() {
    const counts = document.querySelectorAll('[data-favourites-count]');
    const total = favourites.bakeries.length + favourites.dishes.length;
    counts.forEach(el => {
        el.textContent = total;
        el.style.display = total > 0 ? 'inline-flex' : 'none';
    });
}

function toggleBakeryFavourite() {
    toggleFavourite('bakeries', BROWNIE_BLISS_BAKERY);
    const btn = document.querySelector('.hero-favourite-btn');
    if (btn) btn.classList.toggle('active', isFavourite('bakeries', BROWNIE_BLISS_BAKERY.id));
}

function updateBirthdayFavouriteButton() {
    const btn = document.getElementById('birthdayFavoriteBtn');
    if (!btn) return;
    const item = { id: `bday-${selectedFlavor}-${selectedWeight}` };
    btn.classList.toggle('active', isFavourite('dishes', item.id));
    btn.innerHTML = isFavourite('dishes', item.id) ? '&hearts;' : '&#9825;';
}

function toggleBirthdayFavourite() {
    const cakeInfo = bdayCakes[selectedFlavor] || DEFAULT_BDAY_CAKES[selectedFlavor];
    const item = {
        id: `bday-${selectedFlavor}-${selectedWeight}`,
        name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
        price: BIRTHDAY_BASE_PRICES[selectedWeight],
        img: cakeInfo.img,
        emoji: cakeInfo.emoji || '🎂',
        category: 'cakes'
    };
    toggleFavourite('dishes', item);
}

function renderFavouritesPage() {
    const bakeryGrid = document.getElementById('favouriteBakeriesGrid');
    const dishesGrid = document.getElementById('favouriteDishesGrid');
    const emptyState = document.getElementById('favouritesEmpty');

    if (!bakeryGrid && !dishesGrid) return;

    const hasBakeries = favourites.bakeries.length > 0;
    const hasDishes = favourites.dishes.length > 0;

    if (emptyState) emptyState.style.display = (!hasBakeries && !hasDishes) ? 'block' : 'none';

    if (bakeryGrid) {
        bakeryGrid.innerHTML = favourites.bakeries.map(bakery => `
            <article class="favourite-bakery-card">
                <img src="${bakery.img}" alt="${bakery.name}">
                <div class="favourite-bakery-info">
                    <div class="product-category">${bakery.category}</div>
                    <h3>${bakery.name}</h3>
                    <p>${bakery.location}</p>
                    <button class="add-to-cart favourite-remove" onclick='toggleFavourite("bakeries", \${JSON.stringify(bakery).replace(/'/g, "&apos;")})'>
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
                    <img src="${dish.img}" alt="${dish.name}">
                    <button class="favorite-btn active" onclick='toggleFavourite("dishes", \${JSON.stringify(dish).replace(/'/g, "&apos;")})'>
                        &hearts;
                    </button>
                </div>
                <div class="product-info">
                    <div class="product-category">${dish.category || 'favourite'}</div>
                    <div class="product-name">${dish.name}</div>
                    <div class="product-price">₹\${dish.price.toLocaleString('en-IN')}</div>
                    <button class="add-to-cart" onclick='addToCart(\${JSON.stringify(dish).replace(/'/g, "&apos;")})'>
                        Add to Cart 🛒
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// --- CHECKOUT FLOW ---
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
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) overlay.classList.remove('open');
}

function injectCheckoutModal() {
    if (document.getElementById('checkoutOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'checkoutOverlay';
    overlay.className = 'checkout-overlay';
    overlay.innerHTML = \`
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
                    <button class="hero-cta" style="width: 100%; margin-top: 20px;" onclick="sendOTP()">
                        Send Verification OTP &rarr;
                    </button>
                </div>
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
                    <button class="hero-cta" style="width: 100%;" onclick="verifyOTP()">
                        Verify & Continue &rarr;
                    </button>
                    <button class="text-link" onclick="showCheckoutStep(1)">Change Phone Number</button>
                </div>
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
                <div id="checkStep4" class="hidden">
                    <h3 class="checkout-title">Final Review</h3>
                    <div class="confirm-summary">
                        <div class="confirm-section"><label>Delivery to</label><div id="confirmCustomer"></div></div>
                        <div class="confirm-section">
                            <label>Order Items</label>
                            <div id="confirmItems"></div>
                            <div class="confirm-total"><span>Total Payable</span><strong id="confirmTotal"></strong></div>
                        </div>
                    </div>
                    <button class="whatsapp-btn" style="border-radius: 0; width:100%;" onclick="placeOrder()">
                        Place Order & Confirm via WhatsApp &rarr;
                    </button>
                </div>
            </div>
        </div>
    \`;
    document.body.appendChild(overlay);
}

function showCheckoutStep(n) {
    checkoutState.currentStep = n;
    [1, 2, 3, 4].forEach(i => {
        const step = document.getElementById(\`checkStep\${i}\`);
        const ind = document.getElementById(\`step\${i}ind\`);
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
    if (!name || !phone || phone.length !== 10) {
        showToast('Please enter valid name and phone');
        return;
    }
    checkoutState.name = name;
    checkoutState.phone = phone;
    
    try {
        const res = await fetch(\`\${API_BASE}/send-otp\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('otpPhoneDisp').textContent = '+91 ' + phone;
            showCheckoutStep(2);
            showToast('OTP sent! 📱');
        } else {
            showToast(data.message || 'Error sending OTP');
        }
    } catch (e) {
        showToast('Server error');
    }
}

function otpNext(input, idx) {
    input.value = input.value.replace(/\\D/, '');
    if (input.value && idx < 5) {
        document.querySelectorAll('.otp-box')[idx + 1]?.focus();
    }
}

async function verifyOTP() {
    const otp = [...document.querySelectorAll('.otp-box')].map(b => b.value).join('');
    if (otp.length !== 6) { showToast('Enter 6-digit code'); return; }
    try {
        const res = await fetch(\`\${API_BASE}/verify-otp\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: checkoutState.phone, otp })
        });
        const data = await res.json();
        if (data.success) {
            checkoutState.verified = true;
            showCheckoutStep(3);
            showToast('Verified! ✅');
        } else {
            showToast('Invalid OTP');
        }
    } catch (e) {
        showToast('Verification failed');
    }
}

function goToConfirm() {
    const addr = document.getElementById('custAddr').value.trim();
    const city = document.getElementById('custCity').value.trim();
    const pin = document.getElementById('custPin').value.trim();
    if (!addr || !city || pin.length !== 6) { showToast('Please fill all details'); return; }
    
    checkoutState.address = addr;
    checkoutState.city = city;
    checkoutState.pincode = pin;

    document.getElementById('confirmCustomer').innerHTML = \`
        <strong>\${checkoutState.name}</strong><br>
        +91 \${checkoutState.phone}<br>
        \${addr}, \${city} - \${pin}
    \`;

    document.getElementById('confirmItems').innerHTML = cart.map(i => \`
        <div class="confirm-row">
            <span>\${i.name} × \${i.qty}</span>
            <span>₹\${(i.price * i.qty).toLocaleString()}</span>
        </div>
    \`).join('');

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    document.getElementById('confirmTotal').textContent = \`₹\${total.toLocaleString()}\`;
    showCheckoutStep(4);
}

async function placeOrder() {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const orderData = {
        customer_name: checkoutState.name,
        phone: checkoutState.phone,
        address: checkoutState.address,
        city: checkoutState.city,
        pincode: checkoutState.pincode,
        items: cart,
        total
    };

    try {
        const res = await fetch(\`\${API_BASE}/orders\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();
        if (data.success) {
            sendWhatsAppFinal(data.order_id);
            cart = [];
            saveCart();
            updateCartUI();
            closeCheckout();
            showToast(\`Order Placed! ID: \${data.order_id}\`);
        } else {
            showToast('Order failed');
        }
    } catch (e) {
        showToast('Error placing order');
    }
}

function sendWhatsAppFinal(orderId) {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const itemLines = cart.map(i => {
        let line = \`• \${i.name} × \${i.qty} = ₹\${(i.price * i.qty).toLocaleString('en-IN')}\`;
        if (i.message) line += \`\\n   _Msg: "\${i.message}"_\`;
        return line;
    }).join('\\n');

    const message = encodeURIComponent(
        \`🍫 *New Order Received — Brownie Bliss*\\n\\n\` +
        \`📋 *Order ID:* \${orderId}\\n\` +
        \`👤 *Customer:* \${checkoutState.name}\\n\` +
        \`📱 *Phone:* +91 \${checkoutState.phone}\\n\` +
        \`📍 *Address:* \${checkoutState.address}, \${checkoutState.city} - \${checkoutState.pincode}\\n\\n\` +
        \`🛒 *Order Details:*\\n\${itemLines}\\n\\n\` +
        \`💰 *Total Amount: ₹\${total.toLocaleString()}*\\n\\n\` +
        \`_Please share your payment confirmation!_ ✨\`
    );

    window.open(\`https://wa.me/918072596340?text=\${message}\`, '_blank');
}

function sendToWhatsApp() {
    openCheckout();
}

// --- TRACK ORDER ---
async function trackOrder(id) {
    const orderIdInput = document.getElementById('orderIdInput');
    const orderId = id || orderIdInput?.value.trim();
    if (!orderId) { showToast('Enter Order ID'); return; }
    
    try {
        const res = await fetch(\`\${API_BASE}/orders/\${orderId}\`);
        const data = await res.json();
        if (data.success || data.order) {
            renderOrderDetails(data.order || data);
            const resBox = document.getElementById('result');
            if (resBox) resBox.style.display = 'block';
        } else {
            showToast('Order not found');
        }
    } catch (e) {
        showToast('Tracking failed');
    }
}

function renderOrderDetails(order) {
    const resId = document.getElementById('resOrderId');
    if (!resId) return;
    resId.textContent = order.order_id || order.id;
    document.getElementById('resTotalTop').textContent = order.total;
    document.getElementById('resDate').textContent = new Date(order.created_at || Date.now()).toLocaleString();
    
    const status = (order.status || 'pending').toLowerCase();
    const steps = ['pending', 'confirmed', 'preparing', 'delivered'];
    const currentIndex = steps.indexOf(status);
    
    steps.forEach((s, i) => {
        const el = document.getElementById(\`step-\${s}\`);
        if (el) {
            el.classList.remove('active', 'completed');
            if (i < currentIndex) el.classList.add('completed');
            else if (i === currentIndex) el.classList.add('active');
        }
    });
}

function toggleMenu() {
    document.getElementById('mobileMenu')?.classList.toggle('open');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
