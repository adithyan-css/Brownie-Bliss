const products = [

    {
        id: 1,
        name: "Velvet Dream Cake",
        category: "cakes",
        price: 850,
        img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860",
        description: "Rich red velvet cake layered with cream cheese frosting."
    },

    {
        id: 2,
        name: "Dutch Truffle Delight",
        category: "cakes",
        price: 950,
        img: "https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa",
        description: "Moist chocolate truffle cake with silky ganache."
    },

    {
        id: 3,
        name: "Overload Brownie",
        category: "brownies",
        price: 120,
        img: "https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338",
        description: "Fudgy brownie loaded with chocolate chunks."
    },

    {
        id: 4,
        name: "Chocolate Mousse",
        category: "desserts",
        price: 150,
        img: "https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427",
        description: "Light and creamy chocolate mousse dessert."
    },

    {
        id: 5,
        name: "Choco Chip Cookies",
        category: "cookies",
        price: 250,
        img: "https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg",
        description: "Freshly baked cookies with chocolate chips."
    }

];

let cart = JSON.parse(localStorage.getItem('brownie_bliss_cart')) || [];

function saveCart() {
    localStorage.setItem('brownie_bliss_cart', JSON.stringify(cart));
}

function updateCartCount() {

    const cartBadge = document.getElementById('cartBadge');

    const total = cart.reduce((sum, item) => sum + item.qty, 0);

    cartBadge.textContent = total;
}

function renderProducts(category = 'all', btn = null) {

    const grid = document.getElementById('menuGrid');

    if (btn) {

        document.querySelectorAll('.filter-btn')
            .forEach(b => b.classList.remove('active'));

        btn.classList.add('active');
    }

    const filtered = category === 'all'
        ? products
        : products.filter(p => p.category === category);

    grid.innerHTML = filtered.map(product => `

        <div class="menu-card">

            <img src="${product.img}" alt="${product.name}">

            <div class="menu-content">

                <div class="menu-category">
                    ${product.category}
                </div>

                <h3 class="menu-name">
                    ${product.name}
                </h3>

                <p class="menu-description">
                    ${product.description.substring(0, 60)}...
                </p>

                <div class="menu-price">
                    ₹${product.price}
                </div>

                <div class="menu-actions">

                    <button class="menu-btn view-btn"
                        onclick="openModal(${product.id})">
                        View
                    </button>

                    <button class="menu-btn menu-add-btn"
                        onclick="addToCart(${product.id})">
                        Add
                    </button>

                </div>

            </div>

        </div>

    `).join('');
}

function openModal(id) {

    const product = products.find(p => p.id === id);

    document.getElementById('modalImg').src = product.img;
    document.getElementById('modalCategory').textContent = product.category;
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalDescription').textContent = product.description;
    document.getElementById('modalPrice').textContent = `₹${product.price}`;

    document.getElementById('modalAddBtn')
        .setAttribute('onclick', `addToCart(${product.id})`);

    document.getElementById('productModal')
        .classList.add('show');
}

function closeModal() {

    document.getElementById('productModal')
        .classList.remove('show');
}

function addToCart(id) {

    const product = products.find(p => p.id === id);

    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.qty += 1;
    } else {

        cart.push({
            ...product,
            qty: 1
        });
    }

    saveCart();

    updateCartCount();

    showToast(`${product.name} added to cart 🛒`);
}

function showToast(message) {

    const toast = document.getElementById('toast');

    toast.textContent = message;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {

    renderProducts();

    updateCartCount();

});