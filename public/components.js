document.addEventListener("DOMContentLoaded", () => {
    // Load Header
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        fetch('header.html')
            .then(res => res.text())
            .then(data => {
                headerPlaceholder.innerHTML = data;
                // Try to initialize components if they are available in script.js
                if (typeof updateCartUI === 'function') updateCartUI();
                const themeIcon = document.getElementById('themeIcon');
                if (themeIcon) {
                    const isDark = document.documentElement.classList.contains('dark');
                    themeIcon.textContent = isDark ? '☀️' : '🌙';
                }
            })
            .catch(err => console.error('Error loading header:', err));
    }

    // Load Footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('footer.html')
            .then(res => res.text())
            .then(data => {
                footerPlaceholder.innerHTML = data;
            })
            .catch(err => console.error('Error loading footer:', err));
    }
});
