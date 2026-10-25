/* NINJA GLITCH - fingerprint.js
 * Simulasi fingerprint INTERAKTIF (UI lokal saja, BUKAN sensor biometrik asli).
 * Tekan -> SCANNING -> 25% -> 50% -> 75% -> 100% -> ACCESS GRANTED -> onGranted() */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};

  NG.Fingerprint = {
    _inited: false,
    _api: null,

    init: function (cfg) {
      if (NG.Fingerprint._inited) return NG.Fingerprint._api;   // cegah listener ganda
      NG.Fingerprint._inited = true;

      var btn = cfg.btn, pctEl = cfg.pct, statusEl = cfg.status, steps = cfg.steps || [];
      var state = 'idle';   // idle | scan | granted
      var handle = null;
      var gotoTimer = null;

      function vibrate(p) { try { if (w.navigator && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* abaikan */ } }

      function setP(p) {
        btn.style.setProperty('--fp', p + '%');
        if (pctEl) pctEl.textContent = p + '%';
        for (var i = 0; i < steps.length; i++) {
          var need = parseInt(steps[i].getAttribute('data-p'), 10) || 0;
          if (p >= need) steps[i].classList.add('on'); else steps[i].classList.remove('on');
        }
      }
      function label(p) {
        if (!statusEl) return;
        if (p < 50) statusEl.textContent = 'SCANNING...';
        else if (p < 100) statusEl.textContent = 'VERIFYING...';
      }
      function grant(delay) {
        if (state === 'granted') return;
        state = 'granted';
        if (handle) handle.cancel();
        setP(100);
        btn.classList.remove('scanning');
        btn.classList.add('done');
        btn.setAttribute('aria-disabled', 'true');
        if (statusEl) { statusEl.textContent = 'ACCESS GRANTED'; statusEl.classList.add('granted'); }
        vibrate([30, 40, 70]);
        gotoTimer = setTimeout(function () { if (cfg.onGranted) cfg.onGranted(); }, delay);
      }
      function start() {
        if (state !== 'idle') return;
        state = 'scan';
        btn.classList.add('scanning');
        setP(0);
        label(0);
        vibrate(25);
        handle = NG.runProgress({
          duration: cfg.duration || 2800,
          onTick: function (p) { setP(p); label(p); },
          onDone: function () { grant(900); }
        });
      }
      function reset() {
        if (handle) handle.cancel();
        clearTimeout(gotoTimer);
        state = 'idle';
        btn.classList.remove('scanning', 'done');
        btn.removeAttribute('aria-disabled');
        if (statusEl) { statusEl.textContent = 'TAP TO SCAN'; statusEl.classList.remove('granted'); }
        setP(0);
      }

      btn.addEventListener('click', start);
      if (cfg.skipBtn) cfg.skipBtn.addEventListener('click', function (e) { e.preventDefault(); grant(250); });

      setP(0);
      NG.Fingerprint._api = { start: start, reset: reset, grant: grant };
      return NG.Fingerprint._api;
    }
  };
})(window, document);
