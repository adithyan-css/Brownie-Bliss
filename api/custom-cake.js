// === CUSTOM CAKE BUILDER JAVASCRIPT ===

document.addEventListener('DOMContentLoaded', function() {
    // Get all required elements
    const flavorSelect = document.getElementById('flavor-select');
    const fillingSelect = document.getElementById('filling-select');
    const sizeSelect = document.getElementById('size-select');
    const customMessage = document.getElementById('custom-message');
    const categoryFilter = document.getElementById('category-filter');
    const totalPriceEl = document.getElementById('total-price');
    const messageCount = document.getElementById('message-count');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    
    // Preview elements
    const previewFlavor = document.getElementById('preview-flavor');
    const previewFilling = document.getElementById('preview-filling');
    const previewSize = document.getElementById('preview-size');
    const previewMessage = document.getElementById('preview-message');
    const cakePreviewImage = document.getElementById('cake-preview-image');
    
    // Base prices
    let basePrice = 25;
    let fillingPrice = 0;
    let sizePrice = 0;
    
    // Flavor options data (for filtering)
    const flavorOptions = Array.from(flavorSelect.options);
    
    // === CALCULATE TOTAL PRICE ===
    function calculateTotalPrice() {
        basePrice = parseFloat(flavorSelect.selectedOptions[0]?.dataset.price) || 25;
        fillingPrice = parseFloat(fillingSelect.selectedOptions[0]?.dataset.price) || 0;
        sizePrice = parseFloat(sizeSelect.selectedOptions[0]?.dataset.price) || 0;
        
        const total = basePrice + fillingPrice + sizePrice;
        totalPriceEl.textContent = `$${total}`;
        
        return total;
    }
    
    // === UPDATE PREVIEW ===
    function updatePreview() {
        // Update text previews
        previewFlavor.textContent = flavorSelect.selectedOptions[0]?.text.split(' - ')[0] || 'Chocolate';
        previewFilling.textContent = fillingSelect.selectedOptions[0]?.text.split(' - ')[0] || 'None';
        previewSize.textContent = sizeSelect.selectedOptions[0]?.text.split(' ')[0] + ' Inch' || '6 Inch';
        previewMessage.textContent = customMessage.value || 'None';
        
        // Update image (you'll need to add actual images to your repo)
        const selectedFlavor = flavorSelect.value;
        cakePreviewImage.src = `images/${selectedFlavor}-cake.jpg`;
        cakePreviewImage.alt = `${selectedFlavor} Cake Preview`;
        
        // Update price
        calculateTotalPrice();
    }
    
    // === FILTER FLAVORS BY CATEGORY ===
    function filterFlavors() {
        const selectedCategory = categoryFilter.value;
        
        flavorOptions.forEach(option => {
            if (selectedCategory === 'all') {
                option.style.display = 'block';
            } else {
                if (option.classList.contains(`${selectedCategory}-option`)) {
                    option.style.display = 'block';
                } else {
                    option.style.display = 'none';
                }
            }
        });
        
        // Reset selection to first visible option
        const firstVisible = Array.from(flavorSelect.options).find(opt => opt.style.display !== 'none');
        if (firstVisible) {
            flavorSelect.value = firstVisible.value;
            updatePreview();
        }
    }
    
    // === UPDATE MESSAGE CHARACTER COUNT ===
    function updateMessageCount() {
        const currentLength = customMessage.value.length;
        messageCount.textContent = `${currentLength}/50 characters`;
        
        if (currentLength >= 50) {
            messageCount.style.color = 'red';
        } else {
            messageCount.style.color = '#666';
        }
    }
    
    // === ADD TO CART FUNCTIONALITY ===
    function addToCart() {
        const customCakeOrder = {
            id: 'custom-' + Date.now(),
            type: 'custom-cake',
            flavor: flavorSelect.value,
            flavorName: flavorSelect.selectedOptions[0]?.text.split(' - ')[0],
            filling: fillingSelect.value,
            fillingName: fillingSelect.selectedOptions[0]?.text.split(' - ')[0],
            size: sizeSelect.value,
            message: customMessage.value,
            category: categoryFilter.value,
            price: calculateTotalPrice(),
            timestamp: new Date().toISOString()
        };
        
        // Get existing cart from localStorage
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cart.push(customCakeOrder);
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Show success message (adjust based on your repo's styling)
        alert(`Custom cake added to cart! Total: ${totalPriceEl.textContent}`);
        
        // Update cart count if your repo has one
        updateCartCount();
    }
    
    // === UPDATE CART COUNT ===
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartCountElement = document.querySelector('.cart-count') || document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cart.length;
        }
    }
    
    // === EVENT LISTENERS ===
    flavorSelect.addEventListener('change', updatePreview);
    fillingSelect.addEventListener('change', updatePreview);
    sizeSelect.addEventListener('change', updatePreview);
    customMessage.addEventListener('input', updateMessageCount);
    categoryFilter.addEventListener('change', filterFlavors);
    addToCartBtn.addEventListener('click', addToCart);
    
    // === INITIALIZE ===
    updatePreview();
    updateMessageCount();
    updateCartCount();
});