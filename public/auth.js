// ─── AUTHENTICATION HELPER MODULE ─────────────────────────────────────────────

const Auth = {
  // Get stored token
  getToken() {
    return localStorage.getItem('authToken');
  },

  // Get stored user data
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Store authentication data
  setAuth(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Clear authentication data
  clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get authorization header for API calls
  getAuthHeader() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  // Fetch with authentication
  async fetchWithAuth(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.clearAuth();
      window.location.href = 'login.html';
    }

    return response;
  },

  // Validate password strength
  validatePassword(password) {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }

    let strength = 'weak';
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      strength = 'medium';
    }
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
      strength = 'strong';
    }

    return { valid: true, strength };
  },

  // Validate email
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone
  validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }
};

// ─── AUTO-LOGIN FROM LOCAL STORAGE ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Update header if user is logged in
  if (Auth.isAuthenticated()) {
    updateHeaderForAuthenticatedUser();
  }
});

function updateHeaderForAuthenticatedUser() {
  const user = Auth.getUser();
  if (!user) return;

  const nav = document.querySelector('nav');
  const headerActions = document.querySelector('.header-actions');

  if (nav && headerActions) {
    // Add profile and logout links
    if (!document.getElementById('authLinks')) {
      const authLinks = document.createElement('div');
      authLinks.id = 'authLinks';
      authLinks.style.display = 'flex';
      authLinks.style.gap = '8px';
      authLinks.style.alignItems = 'center';

      authLinks.innerHTML = `
        <a href="dashboard.html" style="text-decoration: none; color: var(--text-mid); font-size: 13px; font-weight: 500; transition: color 0.2s;">
          👤 ${user.name}
        </a>
        <button onclick="logoutUser()" style="background: #d9534f; color: white; border: none; padding: 8px 16px; border-radius: var(--radius-md); font-size: 11px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
          Sign Out
        </button>
      `;

      headerActions.insertBefore(authLinks, headerActions.firstChild);
    }
  }
}

function logoutUser() {
  if (confirm('Are you sure you want to sign out?')) {
    Auth.clearAuth();
    window.location.href = 'index.html';
  }
}

// ─── FORM VALIDATION HELPERS ──────────────────────────────────────────────────

function validateSignupForm(name, email, password, confirmPassword) {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!Auth.validateEmail(email)) {
    errors.push('Invalid email address');
  }

  const passwordValidation = Auth.validatePassword(password);
  if (!passwordValidation.valid) {
    errors.push(passwordValidation.message);
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  return { valid: errors.length === 0, errors };
}

function validateAddressForm(label, street, city, state, pincode, phone) {
  const errors = [];

  if (!label) {
    errors.push('Address label is required');
  }

  if (!street || street.trim().length < 5) {
    errors.push('Street address must be at least 5 characters');
  }

  if (!city || city.trim().length < 2) {
    errors.push('City is required');
  }

  if (!state || state.trim().length < 2) {
    errors.push('State is required');
  }

  if (!pincode || pincode.length < 5) {
    errors.push('Pincode must be at least 5 characters');
  }

  if (!Auth.validatePhone(phone)) {
    errors.push('Phone number must be 10 digits');
  }

  return { valid: errors.length === 0, errors };
}

// ─── API HELPER FUNCTIONS ─────────────────────────────────────────────────────

async function apiSignup(name, email, phone, password, confirmPassword) {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, confirmPassword })
    });

    if (response.ok) {
      return response.json();
    }
    // if backend returns non-OK, fall through to mock
  } catch (err) {
    // network error — fall back to mock implementation
  }

  // Frontend-only mock signup (localStorage)
  return mockSignup({ name, email, phone, password });
}

async function apiLogin(email, password, rememberMe) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe })
    });

    if (response.ok) {
      return response.json();
    }
    // otherwise fall back
  } catch (err) {
    // network error — fall back to mock
  }

  // Frontend-only mock login (localStorage)
  return mockLogin({ email, password, rememberMe });
}

// ----------------- Mock Auth (frontend-only) -----------------
function getMockUsers() {
  const raw = localStorage.getItem('mockUsers');
  return raw ? JSON.parse(raw) : [];
}

function saveMockUsers(users) {
  localStorage.setItem('mockUsers', JSON.stringify(users));
}

function mockSignup({ name, email, phone, password }) {
  const users = getMockUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'Email already registered (mock)' };
  }

  const newUser = {
    id: 'u_' + Date.now(),
    name,
    email,
    phone: phone || '',
    password // stored in plain text for mock only
  };

  users.push(newUser);
  saveMockUsers(users);

  const token = 'mock-token-' + Date.now();
  return { success: true, token, user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone } };
}

function mockLogin({ email, password, rememberMe }) {
  const users = getMockUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { success: false, message: 'No account found for this email (mock)' };
  if (user.password !== password) return { success: false, message: 'Incorrect password (mock)' };

  const token = 'mock-token-' + Date.now();
  return { success: true, token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } };
}

async function apiGetProfile() {
  const response = await Auth.fetchWithAuth('/api/user/profile');
  return response.json();
}

async function apiUpdateProfile(name, phone) {
  const response = await Auth.fetchWithAuth('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, phone })
  });
  return response.json();
}

async function apiGetAddresses() {
  const response = await Auth.fetchWithAuth('/api/user/addresses');
  return response.json();
}

async function apiAddAddress(addressData) {
  const response = await Auth.fetchWithAuth('/api/user/addresses', {
    method: 'POST',
    body: JSON.stringify(addressData)
  });
  return response.json();
}

async function apiUpdateAddress(addressId, addressData) {
  const response = await Auth.fetchWithAuth(`/api/user/addresses/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(addressData)
  });
  return response.json();
}

async function apiDeleteAddress(addressId) {
  const response = await Auth.fetchWithAuth(`/api/user/addresses/${addressId}`, {
    method: 'DELETE'
  });
  return response.json();
}

async function apiGetOrders() {
  const response = await Auth.fetchWithAuth('/api/user/orders');
  return response.json();
}

// ─── LOCAL STORAGE HELPERS ────────────────────────────────────────────────────

function saveCart(cartData) {
  localStorage.setItem('cart', JSON.stringify(cartData));
}

function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

function clearCart() {
  localStorage.removeItem('cart');
}

// ─── THEME MANAGEMENT ─────────────────────────────────────────────────────────

function getCurrentTheme() {
  return localStorage.getItem('bb_theme') || 'light';
}

function setTheme(theme) {
  localStorage.setItem('bb_theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    const theme = getCurrentTheme();
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', updateThemeIcon);
