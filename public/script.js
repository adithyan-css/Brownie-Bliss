// --- CONFIG ---
const API_BASE = '/api';

// --- SCROLL TO TOP (NEW FEATURE) ---
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const storedTheme = localStorage.getItem('bb_theme') || 'light';
    applyTheme(storedTheme);
    loadProducts();
    filterProducts('all');
    calculateBdayPrice();
    updateCartUI();
});

// Apply a class when viewport is narrow (fallback for environments where media queries aren't applied)
function applyMobileViewportClass() {
    try {
        const w = window.innerWidth || document.documentElement.clientWidth || screen.width;
        if (w <= 420) document.documentElement.classList.add('mobile-viewport');
        else document.documentElement.classList.remove('mobile-viewport');
    } catch (e) {
        // ignore
    }
}
applyMobileViewportClass();
window.addEventListener('resize', applyMobileViewportClass);

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

function toggleMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu) return;
    mobileMenu.classList.toggle('show');
}
window.toggleMenu = toggleMenu;

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.scrollToTop = scrollToTop;

// --- PRODUCTS DATA ---
const DEFAULT_PRODUCTS = [
    { id: 1, name: 'Velvet Dream Cake', category: 'cakes', price: 850, img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860' },
    { id: 2, name: 'Dutch Truffle Delight', category: 'cakes', price: 950, img: 'https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180' },
    { id: 3, name: 'Pineapple Fresh Cream', category: 'cakes', price: 675, img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg' },
    { id: 4, name: 'Choco Brownie Bliss', category: 'brownies', price: 210, img: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80' },
    { id: 5, name: 'Classic Chocolate Cookie', category: 'cookies', price: 120, img: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80' }
];

const DEFAULT_BDAY_CAKES = {
    'Red Velvet': { price: 850, img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860' },
    'Dutch Truffle': { price: 950, img: 'https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180' },
    'Pineapple': { price: 675, img: 'https://images.unsplash.com/photo-1542831371-d531d36971e6?auto=format&fit=crop&w=800&q=80' },
    'Chocoholic': { price: 980, img: 'https://images.unsplash.com/photo-1612865547334-09cb8cb455da?auto=format&fit=crop&w=800&q=80' },
    'Black Forest': { price: 1020, img: 'https://images.unsplash.com/photo-1505253158730-8e1d8d46e9a1?auto=format&fit=crop&w=800&q=80' },
    'Cheesecake': { price: 900, img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80' }
};

const BIRTHDAY_BASE_PRICES = {
    '0.5': 450,
    '1.0': 850,
    '1.5': 1250,
    '2.0': 1600
};

const FAVOURITES_KEY = 'brownie_bliss_favourites';
let products = [];
let bdayCakes = {};
let selectedFlavor = 'Red Velvet';
let selectedWeight = '1.0';
let favourites = loadFavourites();
let cart = JSON.parse(localStorage.getItem('brownie_bliss_cart') || '[]');

function loadFavourites() {
    try {
        return JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || { bakeries: [], dishes: [] };
    } catch {
        return { bakeries: [], dishes: [] };
    }
}

function saveFavourites() {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
}

function useFallbackProducts() {
    products = DEFAULT_PRODUCTS;
    bdayCakes = { ...DEFAULT_BDAY_CAKES };
    renderProducts();
}

function buildCatalogFromList(list) {
    if (Array.isArray(list) && list.length) {
        products = list.filter(p => p.type === 'standard').map(p => ({
            id: p.id_ref || p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            img: p.img,
            description: p.description || ''
        }));
        bdayCakes = {};
        list.filter(p => p.type === 'birthday').forEach(p => {
            bdayCakes[p.name] = {
                price: p.price,
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
        if (data.success && Array.isArray(data.products)) {
            buildCatalogFromList(data.products);
        } else {
            useFallbackProducts();
        }
    } catch (e) {
        useFallbackProducts();
    }
    renderProducts();
    calculateBdayPrice();
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const filtered = products;
    grid.innerHTML = filtered.map(product => `
        <div class="product-card">
            <div class="product-img-wrap"><img src="${product.img}" alt="${product.name}"></div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">Tasty homemade treats made with love.</p>
                <div class="product-price">₹${product.price}</div>
                <button class="add-to-cart" type="button" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

function filterProducts(category, btn) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    if (btn) {
        btn.parentElement.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    const filtered = category === 'all' ? products : products.filter(p => p.category === category);
    grid.innerHTML = filtered.map(product => `
        <div class="product-card">
            <div class="product-img-wrap"><img src="${product.img}" alt="${product.name}"></div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">Tasty homemade treats made with love.</p>
                <div class="product-price">₹${product.price}</div>
                <button class="add-to-cart" type="button" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}
window.filterProducts = filterProducts;

function addToCart(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    const existing = cart.find(item => item.id == product.id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    saveCart();
    updateCartUI();
    showToast('Added to cart!');
}
window.addToCart = addToCart;

function changeQty(index, delta) {
    if (!cart[index]) return;
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveCart();
    updateCartUI();
}
window.changeQty = changeQty;

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}
window.removeFromCart = removeFromCart;

function saveCart() {
    localStorage.setItem('brownie_bliss_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartContainer = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartContainer) return;
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="cart-empty"><span class="cart-empty-icon">🍫</span>Your cart is empty</div>';
        if (cartFooter) cartFooter.style.display = 'none';
        if (cartTotal) cartTotal.textContent = '₹0';
        return;
    }
    cartContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.img || 'https://via.placeholder.com/70'}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                <div class="cart-qty">
                    <button class="qty-btn" type="button" onclick="changeQty(${index}, -1)">-</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" type="button" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>
            <button class="cart-item-remove" type="button" onclick="removeFromCart(${index})">✕</button>
        </div>
    `).join('');
    if (cartFooter) cartFooter.style.display = 'block';
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    }
}

function openCart() {
    document.getElementById('cartSidebar')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
}
window.openCart = openCart;

function closeCart() {
    document.getElementById('cartSidebar')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
}
window.closeCart = closeCart;

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2500);
}

function toggleBakeryFavourite() {
    const btn = document.querySelector('[data-fav-type="bakeries"]');
    if (!btn) return;
    const pressed = btn.getAttribute('aria-pressed') === 'true';
    btn.setAttribute('aria-pressed', String(!pressed));
    btn.textContent = pressed ? '♥ Favourite Bakery' : '♥ Favourite Bakery';
}
window.toggleBakeryFavourite = toggleBakeryFavourite;

function toggleBirthdayFavourite() {
    const btn = document.getElementById('birthdayFavoriteBtn');
    if (!btn) return;
    const pressed = btn.getAttribute('aria-pressed') === 'true';
    btn.setAttribute('aria-pressed', String(!pressed));
    btn.textContent = pressed ? '♥' : '♥';
}
window.toggleBirthdayFavourite = toggleBirthdayFavourite;

function updateBirthdayCake(flavor) {
    selectedFlavor = flavor;
    const cake = DEFAULT_BDAY_CAKES[flavor] || bdayCakes[flavor] || { price: 850, img: '' };
    const img = document.getElementById('birthdayCakeImg');
    if (img && cake.img) img.src = cake.img;
    calculateBdayPrice();
    document.querySelectorAll('.flavor-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === flavor);
    });
}
window.updateBirthdayCake = updateBirthdayCake;

function setCakeWeight(weight) {
    selectedWeight = weight;
    calculateBdayPrice();
    document.querySelectorAll('#birthday .filter-tab').forEach(btn => {
        if (btn.textContent.includes(weight)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
window.setCakeWeight = setCakeWeight;

function calculateBdayPrice() {
    const price = BIRTHDAY_BASE_PRICES[selectedWeight] || 850;
    const priceElement = document.getElementById('cakePrice');
    if (priceElement) {
        priceElement.textContent = `₹${price.toLocaleString('en-IN')}`;
    }
}
window.calculateBdayPrice = calculateBdayPrice;

function addBirthdayToCart() {
    const message = document.getElementById('cakeMessage')?.value || '';
    const price = BIRTHDAY_BASE_PRICES[selectedWeight] || 850;
    const cake = DEFAULT_BDAY_CAKES[selectedFlavor] || bdayCakes[selectedFlavor] || { price: 850, img: '' };
    
    const bdayItem = {
        id: `bday-${Date.now()}`,
        name: `${selectedFlavor} Birthday Cake (${selectedWeight} kg)`,
        category: 'birthday',
        price: price,
        img: cake.img,
        qty: 1,
        message: message
    };
    
    const existing = cart.find(item => 
        item.name === bdayItem.name && item.message === bdayItem.message
    );
    
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push(bdayItem);
    }
    
    saveCart();
    updateCartUI();
    showToast(`${selectedFlavor} Birthday Cake added to cart! 🎂`);
    openCart();
}
window.addBirthdayToCart = addBirthdayToCart;

function sendToWhatsApp() {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const messageLines = cart.map(item => {
        let line = `• ${item.name} × ${item.qty} = ₹${(item.price * item.qty).toLocaleString('en-IN')}`;
        if (item.message) line += ` (Message: "${item.message}")`;
        return line;
    });
    const message = `Hello Brownie Bliss!%0A%0AI would like to order:%0A${messageLines.join('%0A')}%0A%0ATotal: ₹${total.toLocaleString('en-IN')}`;
    window.open(`https://wa.me/918072596340?text=${message}`, '_blank');
}
window.sendToWhatsApp = sendToWhatsApp;

function filterProductsByCategory(category) {
    filterProducts(category);
}
window.filterProductsByCategory = filterProductsByCategory;

function setThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    icon.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
}
setThemeIcon();
