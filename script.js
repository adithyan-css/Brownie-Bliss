// PRODUCTS DATA
const products = [
    {
        id: 1, name: 'Fresh Cream Pineapple Cake', price: 675, category: 'cakes', bestseller: true,
        img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785',
        fallback: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80'
    },
    {
        id: 2, name: 'Overload Brownie', price: 125, category: 'brownies', bestseller: true,
        img: 'https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338',
        fallback: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80'
    },
    {
        id: 3, name: 'Dense Loaf', price: 295, category: 'cakes', bestseller: true,
        img: 'https://theobroma.in/cdn/shop/files/HIGHRESDenseLoafStylised-Square_400x400.jpg?v=1711002439',
        fallback: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'
    },
    {
        id: 4, name: 'Blueberry Cheesecake Jar', price: 195, category: 'desserts', bestseller: false,
        img: 'https://theobroma.in/cdn/shop/files/BlueberryCheesecakeCup_400x400.jpg?v=1711514632',
        fallback: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80'
    },
    {
        id: 5, name: 'Chocoholic Mousse Pastry', price: 160, category: 'pastries', bestseller: false,
        img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267',
        fallback: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&q=80'
    },
    {
        id: 6, name: 'Chocolate Chip Cookies', price: 280, category: 'cookies', bestseller: true,
        img: 'https://theobroma.in/cdn/shop/files/HIGHRESEgglessChocolateChipCookies-Square_400x400.jpg?v=1711188293',
        fallback: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80'
    },
    {
        id: 7, name: 'Butter Palmiers', price: 95, category: 'cookies', bestseller: true,
        img: 'https://theobroma.in/cdn/shop/files/ButterPalmier02_400x400.jpg?v=1711187341',
        fallback: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80'
    },
    {
        id: 8, name: 'Baked Vada Pav', price: 55, category: 'pastries', bestseller: false,
        img: 'https://theobroma.in/cdn/shop/files/BakedVadaPav-Square_400x400.jpg?v=1711611145',
        fallback: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80'
    },
];

// Cart logic with LocalStorage persistence
let cart = JSON.parse(localStorage.getItem('brownie-bliss-cart')) || [];
let currentFilter = 'all';

function saveCart() {
    localStorage.setItem('bakery-cart', JSON.stringify(cart));
}

function renderProducts(filter) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    grid.innerHTML = filtered.map(p => `
      <div class="product-card">
        <div class="product-img-wrap">
          <img src="${p.img}" alt="${p.name}" onerror="this.src='${p.fallback}'">
          ${p.bestseller ? '<span class="bestseller-badge">⭐ Bestseller</span>' : ''}
        </div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-price">₹ ${p.price}</div>
          <button class="add-to-cart" id="addBtn${p.id}" onclick="addToCart(${p.id})">
            🛒 Add to Cart
          </button>
        </div>
      </div>
    `).join('');
}

function filterProducts(cat, el) {
    currentFilter = cat;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));

    // Find correctly matching tab and activate it
    const tabs = document.querySelectorAll('.filter-tab');
    const targetTab = Array.from(tabs).find(t => t.textContent.toLowerCase() === cat.toLowerCase());
    if (targetTab) targetTab.classList.add('active');
    else if (el) el.classList.add('active');

    renderProducts(cat);

    // Smooth scroll to products section
    const section = document.getElementById('products');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    saveCart();
    updateCartUI();
    showToast(`${product.name} added to cart! 🎉`);

    const btn = document.getElementById(`addBtn${id}`);
    if (btn) {
        btn.classList.add('added');
        btn.textContent = '✓ Added!';
        setTimeout(() => {
            btn.classList.remove('added');
            btn.innerHTML = '🛒 Add to Cart';
        }, 1500);
    }
}

function updateCartUI() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.textContent = count;

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const cartTotalEl = document.getElementById('cartTotal');
    if (cartTotalEl) cartTotalEl.textContent = `₹ ${total.toLocaleString('en-IN')}`;

    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="cart-empty"><span class="cart-empty-icon">🧁</span>Your cart is empty.<br>Add something delicious!</div>`;
        if (cartFooter) cartFooter.style.display = 'none';
    } else {
        if (cartFooter) cartFooter.style.display = 'block';
        cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.img}" alt="${item.name}" onerror="this.src='${item.fallback}'">
          <div style="flex:1">
            <div class="cart-item-name">${item.name}</div>
            ${item.message ? `<div class="cart-item-msg" style="font-size:12px; color:var(--gold); font-style:italic;">"${item.message}"</div>` : ''}
            <div class="cart-item-price">₹ ${item.price} each</div>
            <div class="cart-qty">
              <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
            </div>
          </div>
          <button class="cart-item-remove" onclick="removeItem(${item.id})">✕</button>
        </div>
      `).join('');
    }
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
}

function openCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function sendToWhatsApp() {
    if (cart.length === 0) return;
    confirmWhatsApp();
}

function closePhoneModal() {
    const modal = document.getElementById('phoneModal');
    if (modal) modal.classList.remove('open');
}

function confirmWhatsApp() {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const orderLines = cart.map(i => {
        let line = `• ${i.name} × ${i.qty} = ₹${(i.price * i.qty).toLocaleString('en-IN')}`;
        if (i.message) line += `\n  _Message: "${i.message}"_`;
        return line;
    }).join('\n');

    const message = `🍫 *New Order from Brownie Bliss*\n\n` +
        `📋 *Order Details:*\n${orderLines}\n\n` +
        `💰 *Total: ₹${total.toLocaleString('en-IN')}*\n\n` +
        `📍 Please confirm delivery address\n\n` +
        `_Happiness in every bite!_ ✨`;

    const encodedMsg = encodeURIComponent(message);
    const fullPhone = `918072596340`;
    const waUrl = `https://wa.me/${fullPhone}?text=${encodedMsg}`;

    window.open(waUrl, '_blank');
    closeCart();
    showToast('Redirecting to WhatsApp! 🚀');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMsg');
    if (msgEl) msgEl.textContent = msg;
    if (toast) toast.classList.add('show');
    setTimeout(() => { if (toast) toast.classList.remove('show'); }, 3000);
}

function scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.location.href = 'products.html';
    }
}

// Birthday Cake Logic
let selectedFlavor = 'Red Velvet';
let selectedWeight = '1.0';

const cakeData = {
    'Red Velvet': { price: 850, img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860' },
    'Dutch Truffle': { price: 950, img: 'https://theobroma.in/cdn/shop/files/DutchTruffleCakehalfkg_Square_400x400.jpg?v=1711124619' },
    'Pineapple': { price: 675, img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785' },
    'Chocoholic': { price: 900, img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267' },
    'Black Forest': { price: 750, img: 'https://theobroma.in/cdn/shop/files/BlackForestCakehalfkg_Square_400x400.jpg?v=1711124458' },
    'Cheesecake': { price: 1200, img: 'https://theobroma.in/cdn/shop/files/BlueberryCheesecakeCup_400x400.jpg?v=1711514632' }
};

function updateBirthdayCake(flavor) {
    selectedFlavor = flavor;
    const data = cakeData[flavor];
    const cakeImg = document.getElementById('birthdayCakeImg');
    if (cakeImg) cakeImg.src = data.img;
    calculatePrice();
    if (event && event.target) {
        event.target.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
    }
}

function setCakeWeight(weight) {
    selectedWeight = weight;
    calculatePrice();
    if (event && event.target) {
        event.target.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
    }
}

function calculatePrice() {
    const basePrice = cakeData[selectedFlavor].price;
    const weightFactor = parseFloat(selectedWeight);
    const finalPrice = basePrice * weightFactor;
    const priceEl = document.getElementById('cakePrice');
    if (priceEl) priceEl.textContent = `₹ ${Math.round(finalPrice)}`;
}

function addBirthdayToCart() {
    const finalPrice = cakeData[selectedFlavor].price * parseFloat(selectedWeight);
    const msgInput = document.getElementById('cakeMessage');
    const message = msgInput ? msgInput.value.trim() : '';

    const item = {
        id: Date.now(),
        name: `${selectedFlavor} Cake (${selectedWeight}kg)`,
        price: Math.round(finalPrice),
        img: cakeData[selectedFlavor].img,
        qty: 1,
        message: message
    };
    cart.push(item);
    saveCart();
    updateCartUI();
    showToast(`Added ${item.name} to your cart! 🎂`);

    if (msgInput) msgInput.value = ''; // Clear input
    openCart();
}

// Initialization and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();

    // Handle filter from URL query
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    if (filter) {
        currentFilter = filter;
        const tab = Array.from(document.querySelectorAll('.filter-tab')).find(t => t.textContent.toLowerCase() === filter.toLowerCase());
        if (tab) {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        }
    }

    renderProducts(currentFilter);

    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
        phoneInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') confirmWhatsApp();
        });
    }
});
