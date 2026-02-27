// ─── CONFIG ────────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';
// Change this to your WhatsApp business number (with country code, no +)
const BUSINESS_WHATSAPP = '918072596340';

// ─── CART STATE ────────────────────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('bb_cart') || '[]');
let checkoutState = { name: '', phone: '', address: '', city: '', pincode: '', verified: false, currentStep: 1 };

function saveCart() { localStorage.setItem('bb_cart', JSON.stringify(cart)); }

// ─── CART UI ───────────────────────────────────────────────────────────────────
function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartUI();
  updateCartBadge();
  showToast(`${product.emoji} ${product.name} added to cart!`);
  openCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
  updateCartBadge();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
  updateCartBadge();
}

function getCartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = cart.reduce((s, i) => s + i.qty, 0);
}

function updateCartUI() {
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  const totalDisp = document.getElementById('cartTotalDisp');
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `<div class="cart-empty-state"><div style="font-size:48px">🍫</div><p>Your cart is empty!</p></div>`;
    if (foot) foot.style.display = 'none';
  } else {
    body.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="ci-emoji">${item.emoji}</div>
        <div class="ci-info">
          <div class="ci-name">${item.name}</div>
          <div class="ci-price">₹${item.price} each</div>
        </div>
        <div class="ci-controls">
          <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
        </div>
        <button class="ci-remove" onclick="removeFromCart(${item.id})">✕</button>
      </div>
    `).join('');
    if (foot) foot.style.display = 'block';
    if (totalDisp) totalDisp.textContent = `₹${getCartTotal()}`;
  }
}

function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
  updateCartUI();
}

function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── CHECKOUT FLOW ─────────────────────────────────────────────────────────────
function openCheckout() {
  if (cart.length === 0) { showToast('Add items first!'); return; }
  closeCart();
  checkoutState = { name: '', phone: '', address: '', city: '', pincode: '', verified: false, currentStep: 1 };
  showCheckoutStep(1);
  document.getElementById('checkoutOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('open');
  document.body.style.overflow = '';
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

// ─── OTP ───────────────────────────────────────────────────────────────────────
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
  setTimeout(() => document.getElementById('custAddr')?.focus(), 100);
}

function otpNext(input, idx) {
  input.value = input.value.replace(/\D/, '');
  if (input.value && idx < 5) {
    document.querySelectorAll('.otp-box')[idx + 1]?.focus();
  }
  // Auto-verify when all 6 filled
  const boxes = document.querySelectorAll('.otp-box');
  const full = [...boxes].every(b => b.value.length === 1);
  if (full) setTimeout(verifyOTP, 200);
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
      setTimeout(() => document.getElementById('custAddr')?.focus(), 100);
    } else {
      showToast(data.message || 'Invalid OTP. Try again.');
      document.querySelectorAll('.otp-box').forEach(b => { b.value = ''; b.classList.add('shake'); });
      setTimeout(() => document.querySelectorAll('.otp-box').forEach(b => b.classList.remove('shake')), 500);
      document.querySelectorAll('.otp-box')[0]?.focus();
    }
  } catch (e) {
    showToast('Server error');
  }
}

// ─── ADDRESS + CONFIRM ─────────────────────────────────────────────────────────
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

  // Populate confirm screen
  document.getElementById('confirmCustomer').innerHTML = `
    <div class="confirm-row"><span>Name</span><strong>${checkoutState.name}</strong></div>
    <div class="confirm-row"><span>Phone</span><strong>+91 ${checkoutState.phone}</strong></div>
    <div class="confirm-row"><span>Address</span><strong>${addr}, ${city} - ${pin}</strong></div>
  `;

  document.getElementById('confirmItems').innerHTML = cart.map(i => `
    <div class="confirm-row">
      <span>${i.emoji} ${i.name} × ${i.qty}</span>
      <strong>₹${i.price * i.qty}</strong>
    </div>
  `).join('');

  document.getElementById('confirmTotal').textContent = `₹${getCartTotal()}`;
  showCheckoutStep(4);
}

// ─── PLACE ORDER ───────────────────────────────────────────────────────────────
async function placeOrder() {
  const orderData = {
    customer_name: checkoutState.name,
    phone: checkoutState.phone,
    address: checkoutState.address,
    city: checkoutState.city,
    pincode: checkoutState.pincode,
    items: cart,
    total: getCartTotal()
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
      sendWhatsApp(orderId);

      // Clear cart
      cart = [];
      saveCart();
      updateCartBadge();
      closeCheckout();

      showToast(`🎉 Order ${orderId} placed!`);
    } else {
      showToast('Failed to place order. Try again.');
    }
  } catch (e) {
    showToast('Server error. Please try again.');
  }
}

function sendWhatsApp(orderId) {
  const itemLines = cart.map(i => `  • ${i.emoji} ${i.name} × ${i.qty} = ₹${i.price * i.qty}`).join('\n');
  const total = getCartTotal();

  const msg = `🍫 *New Order — Brownie Bliss*\n\n` +
    `📋 *Order ID:* ${orderId}\n\n` +
    `👤 *Customer:* ${checkoutState.name}\n` +
    `📱 *Phone:* +91 ${checkoutState.phone}\n` +
    `📍 *Address:* ${checkoutState.address}, ${checkoutState.city} - ${checkoutState.pincode}\n\n` +
    `🛒 *Order Items:*\n${itemLines}\n\n` +
    `💰 *Total: ₹${total}*\n\n` +
    `_Please confirm this order and share payment details. Thank you!_ 🙏`;

  window.open(`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ─── TOAST ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// Init
updateCartBadge();
