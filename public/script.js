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

// --- PRODUCTS DATA ---
let products = [];
let bdayCakes = {};

const DEFAULT_PRODUCTS = [
    { id: 1, name: "Velvet Dream Cake", category: "cakes", price: 850, img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
    { id: 2, name: "Dutch Truffle Delight", category: "cakes", price: 950, img: "https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180" },
    { id: 3, name: "Pineapple Fresh Cream", category: "cakes", price: 675, img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_400x400.jpg" }
];

const DEFAULT_BDAY_CAKES = {
    "Red Velvet": { price: 850, img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
    "Dutch Truffle": { price: 950, img: "https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180" }
};

const FAVOURITES_KEY = 'brownie_bliss_favourites';

let favourites = loadFavourites();

// FIXED LOAD PRODUCTS
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

    if (document.getElementById('productsGrid')) filterProducts('all');
    if (document.getElementById('cakePrice')) calculateBdayPrice();
}

function useFallbackProducts() {
    products = DEFAULT_PRODUCTS;
    bdayCakes = DEFAULT_BDAY_CAKES;
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
}

// --- CART ---
let cart = JSON.parse(localStorage.getItem('brownie_bliss_cart') || '[]');

function saveCart() {
    localStorage.setItem('brownie_bliss_cart', JSON.stringify(cart));
}

// --- CART UI ---
function updateCartUI() {
    const cartContainer = document.getElementById('cartItems');
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = "Cart empty 🍫";
        return;
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
        </div>
    `).join('');
}

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

    document.querySelectorAll('.weight-btn').forEach(b => b.classList.remove('active'));
    if (event?.target) event.target.classList.add('active');

    calculateBdayPrice();
}

function calculateBdayPrice() {
    const price = BIRTHDAY_BASE_PRICES[selectedWeight] || 850;
    const el = document.getElementById('cakePrice');
    if (el) el.textContent = "₹ " + price;
}

// --- FIXED WHATSAPP (ONLY ONE VERSION) ---
function sendWhatsAppFinal(orderId) {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

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
});
// Show/hide button on scroll
window.addEventListener("scroll", function () {
    const btn = document.getElementById("scrollTopBtn");

    if (window.scrollY > 300) {
        btn.style.display = "block";
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
}


const toggleBtn = document.getElementById("themeToggle");

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  toggleBtn.innerHTML = "☀️";
}

// Toggle theme
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("theme", "dark");
    toggleBtn.innerHTML = "☀️";
  } else {
    localStorage.setItem("theme", "light");
    toggleBtn.innerHTML = "🌙";
  }
});