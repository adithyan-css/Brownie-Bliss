/* ============================================================
   Brownie Bliss — Loading Screen JS
   File: public/loader.js
   ============================================================ */

(function () {
  'use strict';

  const loader   = document.getElementById('bb-loader');
  const bar      = document.getElementById('bb-progress-bar');
  const statusEl = document.getElementById('bb-status-text');

  if (!loader) return;

  /* ── Status messages ──────────────────────────────────── */
  const messages = [
    'Loading',
    'Preheating the oven…',
    'Mixing the batter…',
    'Adding chocolate…',
    'Almost ready…',
    'Serving fresh…',
  ];

  /* ── Simulated progress ───────────────────────────────── */
  let progress  = 0;
  let msgIndex  = 0;
  let dismissed = false;

  const progressSteps = [
    { target: 25,  delay: 200  },
    { target: 50,  delay: 600  },
    { target: 72,  delay: 1100 },
    { target: 88,  delay: 1700 },
    { target: 95,  delay: 2200 },
  ];

  function setProgress(value) {
    progress = Math.min(value, 100);
    if (bar) bar.style.width = progress + '%';
  }

  function nextMessage() {
    if (!statusEl || dismissed) return;
    msgIndex = (msgIndex + 1) % messages.length;
    statusEl.style.opacity = '0';
    setTimeout(function () {
      if (statusEl) {
        statusEl.textContent = messages[msgIndex];
        statusEl.style.opacity = '1';
      }
    }, 300);
  }

  /* Queue the simulated progress steps */
  progressSteps.forEach(function (step) {
    setTimeout(function () { setProgress(step.target); }, step.delay);
  });

  /* Cycle status messages every 900ms */
  var msgInterval = setInterval(nextMessage, 900);

  /* ── Dismiss the loader ───────────────────────────────── */
  function dismissLoader() {
    if (dismissed) return;
    dismissed = true;

    clearInterval(msgInterval);
    setProgress(100);

    /* Short pause so users see 100% before fade */
    setTimeout(function () {
      if (!loader) return;
      loader.classList.add('bb-hiding');

      /* Remove from DOM after animation completes */
      loader.addEventListener('animationend', function () {
        loader.style.display = 'none';
        loader.setAttribute('aria-hidden', 'true');
      }, { once: true });
    }, 400);
  }

  // WITH THIS:
  var MIN_TIME = 3500; // ← change this value (milliseconds)
  var startTime = Date.now();

  function dismissWhenReady() {
    var elapsed = Date.now() - startTime;
    var remaining = MIN_TIME - elapsed;
    setTimeout(dismissLoader, Math.max(0, remaining));
  }

  if (document.readyState === 'complete') {
    dismissWhenReady();
  } else {
    window.addEventListener('load', dismissWhenReady);
    setTimeout(dismissLoader, 8000); // hard fallback
  }

})();
