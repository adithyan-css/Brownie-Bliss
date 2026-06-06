// Brownie Box Customizer - Core Logic
class BrownieBoxCustomizer {
  constructor() {
    this.boxSize = 4;
    this.slots = [];
    this.flavours = [
      { id: 'walnut', name: 'Walnut Bliss', emoji: '🌰', price: 399 },
      { id: 'redvelvet', name: 'Red Velvet', emoji: '❤️', price: 449 },
      { id: 'chocolate', name: 'Double Chocolate', emoji: '🍫', price: 399 },
      { id: 'caramel', name: 'Salted Caramel', emoji: '🍯', price: 429 },
      { id: 'oreo', name: 'Cookies & Cream', emoji: '🍪', price: 419 }
    ];
    this.selectedFlavour = null;
    this.init();
  }

  init() {
    this.renderSizeSelector();
    this.renderFlavourSelector();
    this.renderBox();
    this.attachEventListeners();
  }

  renderSizeSelector() {
    const container = document.getElementById('size-selector');
    if (!container) return;
    
    container.innerHTML = `
      <button class="size-btn ${this.boxSize === 4 ? 'active' : ''}" data-size="4">📦 4-Pack Box (₹399)</button>
      <button class="size-btn ${this.boxSize === 6 ? 'active' : ''}" data-size="6">📦 6-Pack Box (₹599)</button>
      <button class="size-btn ${this.boxSize === 12 ? 'active' : ''}" data-size="12">📦 12-Pack Box (₹1099)</button>
    `;
  }

  renderFlavourSelector() {
    const container = document.getElementById('flavour-selector');
    if (!container) return;
    
    container.innerHTML = this.flavours.map(flavour => `
      <button class="flavour-btn" data-flavour='${JSON.stringify(flavour)}'>
        ${flavour.emoji} ${flavour.name} (₹${flavour.price})
      </button>
    `).join('');
  }

  renderBox() {
    const container = document.getElementById('box-grid');
    if (!container) return;
    
    container.setAttribute('data-size', this.boxSize);
    
    while (this.slots.length < this.boxSize) {
      this.slots.push(null);
    }
    while (this.slots.length > this.boxSize) {
      this.slots.pop();
    }
    
    container.innerHTML = this.slots.map((slot, index) => `
      <div class="slot ${slot ? 'filled' : 'empty'}" data-index="${index}">
        ${slot ? `
          <div class="slot-content">
            <div class="slot-emoji">${slot.emoji}</div>
            <div class="slot-name">${slot.name}</div>
            <div class="slot-price">₹${slot.price}</div>
          </div>
          <button class="remove-slot" data-index="${index}">✕</button>
        ` : `
          <div class="empty-slot" style="font-size: 2rem;">+</div>
        `}
      </div>
    `).join('');
    
    this.updateCounter();
  }

  attachEventListeners() {
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newSize = parseInt(e.target.dataset.size);
        if (newSize !== this.boxSize) {
          if (this.slots.some(slot => slot !== null) && 
              !confirm('Changing box size will reset your current selection. Continue?')) {
            return;
          }
          this.boxSize = newSize;
          this.slots = [];
          this.renderSizeSelector();
          this.renderBox();
        }
      });
    });
    
    document.querySelectorAll('.flavour-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectedFlavour = JSON.parse(e.currentTarget.dataset.flavour);
        document.querySelectorAll('.flavour-btn').forEach(b => {
          b.style.background = 'white';
          b.style.color = '#333';
        });
        e.currentTarget.style.background = '#8B4513';
        e.currentTarget.style.color = 'white';
      });
    });
    
    const boxGrid = document.getElementById('box-grid');
    if (boxGrid) {
      boxGrid.addEventListener('click', (e) => {
        const slotDiv = e.target.closest('.slot');
        if (!slotDiv) return;
        
        const index = parseInt(slotDiv.dataset.index);
        
        if (e.target.classList.contains('remove-slot')) {
          this.removeFromBox(index);
        } 
        else if (slotDiv.classList.contains('empty') && this.selectedFlavour) {
          this.addToBox(index);
        }
        else if (slotDiv.classList.contains('filled')) {
          if (confirm('Remove this brownie from your box?')) {
            this.removeFromBox(index);
          }
        }
      });
    }
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Clear your entire brownie box?')) {
          this.slots = [];
          this.renderBox();
        }
      });
    }
    
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        if (this.isBoxFull()) {
          this.addToCart();
        }
      });
    }
  }

  addToBox(index) {
    if (this.slots[index] !== null) {
      alert('This slot is already filled! Click on a filled slot to remove it.');
      return;
    }
    
    if (this.getFilledCount() >= this.boxSize) {
      alert('Your box is full! Remove some brownies first.');
      return;
    }
    
    this.slots[index] = { ...this.selectedFlavour };
    this.renderBox();
  }

  removeFromBox(index) {
    if (this.slots[index]) {
      this.slots[index] = null;
      this.renderBox();
    }
  }

  getFilledCount() {
    return this.slots.filter(slot => slot !== null).length;
  }

  updateCounter() {
    const filled = this.getFilledCount();
    const total = this.boxSize;
    const counter = document.getElementById('counter');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    
    if (counter) {
      counter.innerHTML = `📦 ${filled} of ${total} slots filled`;
      counter.style.color = filled === total ? '#4CAF50' : '#333';
    }
    
    if (addToCartBtn) {
      if (filled === total) {
        addToCartBtn.classList.add('active');
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = '✨ Add Custom Box to Cart ✨';
      } else {
        addToCartBtn.classList.remove('active');
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = `➕ Add ${total - filled} more brownie${total - filled !== 1 ? 's' : ''}`;
      }
    }
  }

  isBoxFull() {
    return this.getFilledCount() === this.boxSize;
  }

  addToCart() {
    const customBox = {
      id: `custom-box-${Date.now()}`,
      name: `${this.boxSize}-Pack Custom Brownie Box`,
      items: this.slots.filter(s => s !== null),
      totalPrice: this.slots.reduce((sum, slot) => sum + (slot?.price || 0), 0),
      quantity: 1,
      type: 'custom-box'
    };
    
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(customBox);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    alert(`🎉 Custom ${this.boxSize}-Pack box added to cart! Total: ₹${customBox.totalPrice}`);
    
    if (confirm('Box added! Create another custom box?')) {
      this.slots = [];
      this.renderBox();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.brownieCustomizer = new BrownieBoxCustomizer();
});