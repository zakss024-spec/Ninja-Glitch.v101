/* NINJA GLITCH - image-loader.js
 * - Satu sumber kebenaran path asset (semua RELATIF: ./assets/...)
 * - Preload gambar penting, deteksi gagal, catat path yang gagal (console + daftar), fallback bertahap:
 *   gambar asli -> assets/images/fallback.webp -> placeholder neon CSS (tidak pernah broken-image icon)
 * - Dipakai juga oleh IMAGE TEST (Tools). */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};

  var BASE = './assets/';
  var ASSETS = [
    { id: 'blackhole',  label: 'BLACK HOLE', group: 'IMAGES',  path: BASE + 'images/blackhole.webp',  critical: true },
    { id: 'ninja',      label: 'NINJA',      group: 'IMAGES',  path: BASE + 'images/ninja.webp',      critical: true },
    { id: 'background', label: 'BACKGROUND', group: 'IMAGES',  path: BASE + 'images/background.webp', critical: true },
    { id: 'fallback',   label: 'FALLBACK',   group: 'IMAGES',  path: BASE + 'images/fallback.webp' },
    { id: 'favicon',    label: 'ICON SVG',   group: 'ICONS',   path: BASE + 'icons/favicon.svg' },
    { id: 'icon192',    label: 'ICON 192',   group: 'ICONS',   path: BASE + 'icons/icon-192.png' },
    { id: 'grid',       label: 'GRID',       group: 'EFFECTS', path: BASE + 'effects/grid.svg' }
  ];
  var byId = {};
  ASSETS.forEach(function (a) { byId[a.id] = a; });

  var Img = NG.Img = {
    assets: ASSETS,
    failed: [],                 // path yang gagal
    status: {},                 // id -> {ok, ms, w, h, path}
    path: function (id) { return byId[id] ? byId[id].path : ''; },

    /* markup <img> dengan path yang benar (untuk HTML yang dibuat dari JS) */
    tag: function (id, cls, size) {
      var s = size ? ' width="' + size + '" height="' + size + '"' : '';
      return '<img class="' + (cls || '') + '" data-asset="' + id + '" src="' + Img.path(id) + '" alt=""' + s + ' decoding="async">';
    },

    _noteFail: function (path) {
      if (Img.failed.indexOf(path) < 0) {
        Img.failed.push(path);
        if (w.console) console.warn('[NG] Asset gagal dimuat:', path);
        try {
          if (w.NGData && NG._dashReady) NGData.activity.add('SYSTEM', 'Asset failed: ' + path);
        } catch (e) { /* abaikan */ }
      }
    },

    /* placeholder neon CSS (tidak butuh file apa pun) */
    _placeholder: function (img) {
      var id = img.getAttribute('data-asset') || 'img';
      var ph = d.createElement('span');
      ph.className = (img.className || '') + ' img-ph ph-' + id;
      ph.setAttribute('role', 'img');
      ph.setAttribute('aria-label', id + ' (placeholder)');
      ph.setAttribute('data-asset', id);
      ph.setAttribute('data-src', img.getAttribute('data-orig') || img.getAttribute('src') || '');
      var wd = img.getAttribute('width'), ht = img.getAttribute('height');
      if (wd) ph.style.width = wd + 'px';
      if (ht) ph.style.height = ht + 'px';
      if (img.parentNode) img.parentNode.replaceChild(ph, img);
    },

    _onFail: function (img) {
      if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-asset')) return;
      var id = img.getAttribute('data-asset');
      var cur = img.getAttribute('src') || '';
      var orig = img.getAttribute('data-orig') || cur;
      if (!img.hasAttribute('data-orig')) img.setAttribute('data-orig', orig);
      Img._noteFail(orig);
      var fb = Img.path('fallback');
      // 1) coba fallback.webp (kecuali untuk blackhole/fallback itu sendiri)
      if (cur.indexOf('fallback.webp') < 0 && id !== 'blackhole' && id !== 'fallback' && !img.hasAttribute('data-fb')) {
        img.setAttribute('data-fb', '1');
        img.src = fb;
        return;
      }
      // 2) placeholder CSS
      Img._placeholder(img);
    },

    /* periksa gambar yang sudah terlanjur gagal sebelum listener terpasang */
    scan: function (root) {
      var list = (root || d).querySelectorAll('img[data-asset]');
      for (var i = 0; i < list.length; i++) {
        var im = list[i];
        if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) Img._onFail(im);
      }
    },

    /* uji satu path via Image() */
    probe: function (a, cb) {
      var t0 = Date.now(), im = new Image(), done = false;
      function fin(ok) {
        if (done) return; done = true;
        var r = { id: a.id, label: a.label, group: a.group, path: a.path, ok: ok, ms: Date.now() - t0, w: ok ? im.naturalWidth : 0, h: ok ? im.naturalHeight : 0 };
        Img.status[a.id] = r;
        if (!ok) Img._noteFail(a.path);
        cb(r);
      }
      im.onload = function () { fin(true); };
      im.onerror = function () { fin(false); };
      setTimeout(function () { fin(false); }, 8000);       // timeout -> tidak menggantung
      im.src = a.path + (a._bust ? '?r=' + a._bust : '');
    },

    testAll: function (cb, bust) {
      var res = [], n = ASSETS.length;
      ASSETS.forEach(function (a, i) {
        a._bust = bust || 0;
        Img.probe(a, function (r) { res[i] = r; if (--n === 0) cb(res); });
      });
    },

    /* RELOAD ASSETS: bersihkan status, muat ulang <img> & placeholder, uji ulang */
    reload: function (cb) {
      var stamp = Date.now();
      Img.failed = []; Img.status = {};
      var phs = d.querySelectorAll('.img-ph[data-src]');
      for (var i = 0; i < phs.length; i++) {
        var ph = phs[i], im = d.createElement('img');
        im.className = ph.className.replace(/\bimg-ph\b/, '').replace(/\bph-[a-z0-9]+\b/g, '').replace(/\s+/g, ' ').trim();
        im.setAttribute('data-asset', ph.getAttribute('data-asset'));
        im.alt = '';
        var src = ph.getAttribute('data-src').replace(/\?r=\d+$/, '');
        im.src = src + '?r=' + stamp;
        im.setAttribute('data-orig', src);
        if (ph.style.width) im.setAttribute('width', parseInt(ph.style.width, 10));
        if (ph.style.height) im.setAttribute('height', parseInt(ph.style.height, 10));
        if (ph.parentNode) ph.parentNode.replaceChild(im, ph);
      }
      var imgs = d.querySelectorAll('img[data-asset]');
      for (var j = 0; j < imgs.length; j++) {
        var cur = imgs[j];
        if (cur.hasAttribute('data-fb') || cur.getAttribute('src').indexOf('fallback.webp') > -1) {
          var o = cur.getAttribute('data-orig'); cur.removeAttribute('data-fb'); if (o) cur.src = o + '?r=' + stamp;
        }
      }
      Img.testAll(function (res) { if (cb) cb(res); }, stamp);
    },

    /* preload gambar kritis (non-blocking); callback bila semua selesai */
    preload: function (cb) {
      var crit = ASSETS.filter(function (a) { return a.critical; }), n = crit.length, out = [];
      if (!n) { if (cb) cb([]); return; }
      crit.forEach(function (a) {
        Img.probe(a, function (r) {
          out.push(r);
          if (r.id === 'background' && !r.ok) d.body.classList.add('bg-missing');
          if (--n === 0 && cb) cb(out);
        });
      });
    }
  };

  /* error pada <img> tidak bubble -> pakai capture di document */
  d.addEventListener('error', function (e) { Img._onFail(e.target); }, true);

  function boot() { Img.scan(d); Img.preload(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})(window, document);
