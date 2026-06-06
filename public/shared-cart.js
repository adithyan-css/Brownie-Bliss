// ============================================
// SHARED CART SYSTEM - Works on all pages
// ============================================

// Global cart object
window.BrownieBlissCart = {
    items: [],
    
    // Initialize cart from localStorage
    init: function() {
        const savedCart = localStorage.getItem('brownieBlissCart');
        if (savedCart) {
            this.items = JSON.parse(savedCart);
        } else {
            this.items = [];
        }
        this.updateBadge();
        return this.items;
    },
    
    // Add item to cart
    addItem: function(item) {
        this.items.push({
            ...item,
            id: item.id || `item_${Date.now()}_${Math.random()}`,
            addedAt: new Date().toISOString()
        });
        this.save();
        this.showToast(`${item.name} added to cart! 🎉`);
        return this.items;
    },
    
    // Remove item from cart
    removeItem: function(index) {
        const removed = this.items[index];
        this.items.splice(index, 1);
        this.save();
        this.showToast(`${removed.name} removed from cart`);
        return this.items;
    },
    
    // Get cart total
    getTotal: function() {
        return this.items.reduce((sum, item) => sum + (item.totalPrice || item.price || 0), 0);
    },
    
    // Get item count
    getCount: function() {
        return this.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    },
    
    // Clear cart
    clear: function() {
        this.items = [];
        this.save();
        this.showToast('Cart cleared');
    },
    
    // Save to localStorage
    save: function() {
        localStorage.setItem('brownieBlissCart', JSON.stringify(this.items));
        this.updateBadge();
        this.updateCartDisplay();
    },
    
    // Update cart badge on all pages
    updateBadge: function() {
        const count = this.getCount();
        const badges = document.querySelectorAll('.cart-count');
        badges.forEach(badge => {
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'inline-block' : 'none';
            }
        });
    },
    
    // Update cart sidebar display
    updateCartDisplay: function() {
        const cartItemsDiv = document.getElementById('cartItemsList');
        const cartFooter = document.getElementById('cartFooter');
        
        if (!cartItemsDiv) return;
        
        if (this.items.length === 0) {
            cartItemsDiv.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 16px;">🛒</div>
                    <h3 style="margin-bottom: 8px;">Your cart is empty</h3>
                    <p style="color: #999;">Add some delicious treats!</p>
                </div>
            `;
            if (cartFooter) cartFooter.style.display = 'none';
            return;
        }
        
        if (cartFooter) cartFooter.style.display = 'block';
        
        let total = 0;
        cartItemsDiv.innerHTML = this.items.map((item, index) => {
            const itemTotal = item.totalPrice || item.price || 0;
            total += itemTotal;
            
            if (item.type === 'custom-box') {
                return `
                    <div class="cart-item-custom">
                        <div class="cart-item-header">
                            <div class="cart-item-name">🎁 ${item.name}</div>
                            <button class="cart-remove-item" onclick="window.BrownieBlissCart.removeItem(${index})">✕</button>
                        </div>
                        <div class="cart-item-details">
                            ${item.items.map(i => `${i.emoji} ${i.name}`).join(' • ')}
                        </div>
                        <div class="cart-item-price">₹${itemTotal}</div>
                    </div>
                `;
            } else {
                return `
                    <div class="cart-item">
                        <div class="cart-item-header">
                            <div class="cart-item-name">🍪 ${item.name}</div>
                            <button class="cart-remove-item" onclick="window.BrownieBlissCart.removeItem(${index})">✕</button>
                        </div>
                        <div class="cart-item-price">₹${itemTotal}</div>
                    </div>
                `;
            }
        }).join('');
        
        const totalElement = document.getElementById('cartTotalAmount');
        if (totalElement) totalElement.innerHTML = `₹${total}`;
    },
    
    // Show toast notification
    showToast: function(message) {
        let toast = document.getElementById('global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'global-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: #4CAF50;
                color: white;
                padding: 14px 28px;
                border-radius: 50px;
                z-index: 10000;
                font-family: 'DM Sans', sans-serif;
                font-weight: 600;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    },
    
    // Get cart for WhatsApp
    getWhatsAppMessage: function() {
        if (this.items.length === 0) return null;
        
        let message = "🛍️ *BROWNIE BLISS ORDER* 🛍️\n\n";
        message += "*Your Custom Order:*\n";
        message += "───────────────────\n";
        
        this.items.forEach((item, i) => {
            const itemTotal = item.totalPrice || item.price || 0;
            if (item.type === 'custom-box') {
                message += `\n📦 *${item.name}*\n`;
                message += `   ${item.items.map(i => `${i.emoji} ${i.name}`).join('\n   ')}\n`;
                message += `   💰 *₹${itemTotal}*\n`;
            } else {
                message += `\n🍪 *${item.name}*\n`;
                message += `   💰 *₹${itemTotal}*\n`;
            }
        });
        
        message += "\n───────────────────\n";
        message += `*TOTAL: ₹${this.getTotal()}*\n\n`;
        message += "📞 Please confirm my order!\n";
        message += "📍 Delivery address: \n";
        message += "⏰ Expected delivery: \n\n";
        message += "_Thank you! 🙏_";
        
        return message;
    },
    
    // Checkout via WhatsApp
    checkoutWhatsApp: function() {
        if (this.items.length === 0) {
            this.showToast('Your cart is empty!');
            return;
        }
        
        const message = this.getWhatsAppMessage();
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/918072596340?text=${encodedMessage}`, '_blank');
    },
    
    // Toggle cart sidebar
    toggleCart: function() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open');
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.BrownieBlissCart.init();
});