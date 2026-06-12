const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

let modifiedCount = 0;

const initScript = `<script>
    (function () {
      try {
        var t = localStorage.getItem('bb_theme') || 'light';
        if (t === 'dark') document.documentElement.classList.add('dark');
      } catch (_) { }
    })();
  </script>`;

const toggleBtn = `<button id="themeToggleBtn" class="theme-toggle-btn" onclick="toggleTheme()" aria-label="Toggle dark mode" title="Toggle dark mode">
          <span id="themeIcon">🌙</span>
        </button>`;

files.forEach(file => {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add the head script if not present
  if (!content.includes('bb_theme') && content.includes('</head>')) {
    content = content.replace('</head>', initScript + '\n</head>');
    changed = true;
  }

  // Add the toggle button if not present
  if (content.includes('header-actions') && !content.includes('themeToggleBtn')) {
    content = content.replace('<div class="header-actions">', '<div class="header-actions">\n        ' + toggleBtn);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    modifiedCount++;
    console.log('Modified:', file);
  }
});

console.log('Total files modified:', modifiedCount);
