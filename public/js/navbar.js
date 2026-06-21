// Highlight current page in navigation
(function () {
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';
  var links = document.querySelectorAll('header nav a');
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    if (href && href.split('#')[0] === currentPath) {
      links[i].classList.add('active');
    }
  }

  // Sync cart badge from localStorage
  var badge = document.getElementById('cartBadge');
  if (badge) {
    try {
      var cart = JSON.parse(localStorage.getItem('bb_cart') || '[]');
      var total = 0;
      for (var j = 0; j < cart.length; j++) {
        total += cart[j].quantity || 1;
      }
      badge.textContent = total;
      if (total > 0) {
        badge.style.display = 'inline';
      }
    } catch (_) {}
  }
})();
