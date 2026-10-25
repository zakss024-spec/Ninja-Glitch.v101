/* NINJA GLITCH - security.js : SECURITY CENTER (skor LOKAL; memeriksa kondisi aplikasi di perangkat ini saja). */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData, S = w.NGStorage;
  NG.Pages = NG.Pages || {};
  function esc(s) { return NG.UI.esc(s); }

  /* hitung skor + daftar pemeriksaan; cb(result) */
  NG.Security = {
    run: function (cb) {
      var items = [], pen = 2;                                  // baseline 98% (tidak pernah 100 - simulasi)
      function add(group, label, ok, val, penalty) { items.push({ group: group, label: label, ok: ok, val: val }); if (!ok) pen += penalty || 0; }
      var sess = D.session.active();
      add('SESSION', 'Local session', sess, sess ? 'ACTIVE (' + NG.fmtDur(Date.now() - D.session.startedAt()) + ')' : 'NONE', 15);
      add('SESSION', 'Logins this device', true, String(D.session.logins()), 0);
      var bytes = 0, leak = false;
      S.keys().forEach(function (k) { var v = S.get(k, ''); bytes += (k.length + String(v).length); if (/Glitch76/.test(String(v))) leak = true; });
      add('LOCAL STORAGE', 'Storage available', S.available, S.available ? 'localStorage OK' : 'FALLBACK (memory)', 8);
      add('LOCAL STORAGE', 'Used by app', true, (bytes / 1024).toFixed(1) + ' KB / ' + S.keys().length + ' keys', 0);
      add('AUTH STATUS', 'Password not stored', !leak, leak ? 'FOUND IN STORAGE!' : 'NOT STORED', 30);
      add('AUTH STATUS', 'Biometric (simulation)', sess, sess ? 'GRANTED' : 'NO', 5);
      add('DEVICE STATUS', 'Network', w.navigator.onLine !== false, w.navigator.onLine !== false ? 'ONLINE (no external requests)' : 'OFFLINE', 0);
      add('DEVICE STATUS', 'Input', true, ('ontouchstart' in w || navigator.maxTouchPoints > 0) ? 'TOUCH' : 'POINTER', 0);
      add('DEVICE STATUS', 'Viewport', true, w.innerWidth + 'x' + w.innerHeight + ' @' + (w.devicePixelRatio || 1) + 'x', 0);
      var secure = w.isSecureContext || /^(localhost|127\.0\.0\.1)$/.test(w.location.hostname) || w.location.protocol === 'file:';
      add('DEVICE STATUS', 'Secure context (HTTPS)', secure, secure ? 'YES' : 'NO (use HTTPS)', 2);
      var missing = Object.keys(NG.Nav.routes).filter(function (r) { return !(NG.Pages[r] && NG.Pages[r].init); });
      add('APP INTEGRITY', 'Modules registered', !missing.length, (Object.keys(NG.Nav.routes).length - missing.length) + '/' + Object.keys(NG.Nav.routes).length + (missing.length ? ' missing: ' + missing.join(',') : ''), 4 * missing.length);
      NG.Img.testAll(function (res) {
        var bad = res.filter(function (r) { return !r.ok; });
        add('APP INTEGRITY', 'Assets loaded', !bad.length, (res.length - bad.length) + '/' + res.length + (bad.length ? ' failed: ' + bad.map(function (b) { return b.id; }).join(',') : ''), 3 * bad.length);
        var score = Math.max(0, 100 - pen);
        cb({ score: score, items: items });
      });
    }
  };

  NG.Pages.security = {
    init: function (sec) {
      var gauge = sec.querySelector('#scGauge'), list = sec.querySelector('#scList'), btn = sec.querySelector('#scRun'), lbl = sec.querySelector('#scLabel');
      function go() {
        btn.disabled = true; btn.textContent = 'SCANNING...';
        lbl.textContent = 'CHECKING...';
        NG.Security.run(function (r) {
          gauge.style.setProperty('--v', r.score); gauge.querySelector('b').textContent = r.score + '%';
          lbl.textContent = r.score >= 90 ? 'SECURE (LOCAL SCORE)' : r.score >= 70 ? 'ATTENTION NEEDED' : 'AT RISK';
          lbl.className = 'sc-label ' + (r.score >= 90 ? 'ok' : r.score >= 70 ? 'warn' : 'bad');
          var groups = {}; r.items.forEach(function (i) { (groups[i.group] = groups[i.group] || []).push(i); });
          list.innerHTML = Object.keys(groups).map(function (g) {
            return '<section class="card sc-grp"><h3>' + g + '</h3><ul class="kv">' + groups[g].map(function (i) { return '<li><span>' + esc(i.label) + '</span><b class="' + (i.ok ? 'ok' : 'bad') + '">' + (i.ok ? '&#10003; ' : '! ') + esc(i.val) + '</b></li>'; }).join('') + '</ul></section>';
          }).join('');
          btn.disabled = false; btn.textContent = 'RE-SCAN';
          D.activity.add('SYSTEM', 'SECURITY CHECK: ' + r.score + '%');
        });
      }
      btn.addEventListener('click', go);
      NG.Pages.security._go = go;
      go();
    },
    show: function () { /* hasil terakhir tetap; tekan RE-SCAN untuk memperbarui */ }
  };
})(window, document);
