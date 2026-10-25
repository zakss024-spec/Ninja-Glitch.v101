/* NINJA GLITCH - navigation.js
 * SPA router stabil: halaman modul (pages/*.html) dimuat sebagai fragmen lewat fetch (relative path),
 * di-cache, diinisialisasi SEKALI (tanpa listener ganda), dengan timeout + tombol RETRY (tidak pernah blank).
 * Juga: bottom navigation (5 tab) dan drawer menu lengkap. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  NG.Pages = NG.Pages || {};

  var ROUTES = {
    'home':       { file: 'pages/home.html',       title: 'DASHBOARD' },
    'hack':       { file: 'pages/hack.html',       title: 'HACK LAB' },
    'osint':      { file: 'pages/osint.html',      title: 'OSINT LAB' },
    'report':     { file: 'pages/report.html',     title: 'REPORT LAB' },
    'bug':        { file: 'pages/bug.html',        title: 'BUG LAB' },
    'bug-group':  { file: 'pages/bug-group.html',  title: 'BUG GROUP' },
    'ban-group':  { file: 'pages/ban-group.html',  title: 'BAN GROUP' },
    'group':      { file: 'pages/group.html',      title: 'GROUP LAB' },
    'sender':     { file: 'pages/sender.html',     title: 'MANAGE SENDER' },
    'network':    { file: 'pages/network.html',    title: 'NETWORK LAB' },
    'terminal':   { file: 'pages/terminal.html',   title: 'TERMINAL' },
    'exploit':    { file: 'pages/exploit.html',    title: 'EXPLOIT LAB' },
    'security':   { file: 'pages/security.html',   title: 'SECURITY CENTER' },
    'activity':   { file: 'pages/activity.html',   title: 'ACTIVITY CENTER' },
    'statistics': { file: 'pages/statistics.html', title: 'STATISTICS' },
    'tools':      { file: 'pages/tools.html',      title: 'TOOLS' },
    'settings':   { file: 'pages/settings.html',   title: 'SETTINGS' }
  };

  var Nav = NG.Nav = {
    routes: ROUTES, current: '', _inited: false, _html: {}, _loading: {}, _ready: {},

    drawerOpen: false,
    drawer: function (open) {
      var dr = d.getElementById('drawer'), bk = d.getElementById('drawerBackdrop'), btn = d.getElementById('menuBtn');
      if (!dr) return;
      Nav.drawerOpen = !!open;
      dr.classList.toggle('open', !!open);
      if (bk) bk.classList.toggle('open', !!open);
      dr.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      d.body.classList.toggle('lock', !!open || !!NG._modalOpen);
      if (open) { var first = dr.querySelector('button'); if (first) setTimeout(function () { try { first.focus(); } catch (e) { /* abaikan */ } }, 60); }
      else if (btn && d.activeElement && dr.contains(d.activeElement)) { try { btn.focus(); } catch (e2) { /* abaikan */ } }
    },

    _fetch: function (name, cb) {
      if (Nav._html[name]) { cb(null, Nav._html[name]); return; }
      var r = ROUTES[name], done = false, ctl = null, to;
      function fin(err, html) { if (done) return; done = true; clearTimeout(to); if (!err) Nav._html[name] = html; cb(err, html); }
      try { ctl = w.AbortController ? new AbortController() : null; } catch (e) { ctl = null; }
      to = setTimeout(function () { try { if (ctl) ctl.abort(); } catch (e) { /* abaikan */ } fin(new Error('timeout')); }, 9000);
      if (!w.fetch) { fin(new Error('fetch tidak didukung')); return; }
      w.fetch(r.file, { cache: 'no-cache', signal: ctl ? ctl.signal : undefined })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + r.file); return res.text(); })
        .then(function (t) { if (!t || t.length < 10) throw new Error('halaman kosong: ' + r.file); fin(null, t); })
        .catch(function (e) { fin(e); });
    },

    _errorCard: function (sec, name, err) {
      var file = w.location.protocol === 'file:';
      sec.innerHTML = '<div class="card empty-state"><div class="es-art err" aria-hidden="true"></div><h3>MODULE FAILED TO LOAD</h3>' +
        '<p class="dim mono">' + (file ? 'Browser memblokir fetch pada file://. Buka lewat Vercel/GitHub Pages atau server statis lokal (python3 -m http.server).' : 'Periksa koneksi lalu coba lagi.') + '</p>' +
        '<p class="dim mono small">' + String(err && err.message || err).replace(/[<>&]/g, '') + '</p>' +
        '<button class="btn sm" type="button" data-retry="' + name + '">RETRY</button> <button class="btn ghost sm" type="button" data-route="home">HOME</button></div>';
      if (w.console) console.warn('[NG] gagal memuat modul', name, err);
    },

    _build: function (name, sec) {
      // dipanggil saat HTML tersedia
      sec.innerHTML = Nav._html[name];
      if (NG.Img) NG.Img.scan(sec);
      var page = NG.Pages[name];
      if (page && page.init && !Nav._ready[name]) {
        Nav._ready[name] = true;
        try { page.init(sec); } catch (e) { if (w.console) console.error('[NG] init ' + name, e); }
      }
    },

    _activate: function (name, opts) {
      var prev = Nav._shown;
      if (prev && prev !== name && NG.Pages[prev] && NG.Pages[prev].hide) { try { NG.Pages[prev].hide(d.getElementById('view-' + prev)); } catch (e0) { /* abaikan */ } }
      Nav._shown = name;
      var views = d.querySelectorAll('.view');
      for (var i = 0; i < views.length; i++) views[i].classList.toggle('active', views[i].id === 'view-' + name);
      var btns = d.querySelectorAll('[data-route]');
      for (var j = 0; j < btns.length; j++) {
        var b = btns[j];
        if (b.classList.contains('nav-btn') || b.classList.contains('dr-item')) {
          var on = b.getAttribute('data-route') === name;
          b.classList.toggle('active', on);
          if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
        }
      }
      d.title = 'NINJA GLITCH - ' + ROUTES[name].title;
      if (!opts || !opts.silent) {
        try { if (w.history && history.replaceState) history.replaceState(null, '', '#' + name); } catch (e) { /* abaikan */ }
        w.scrollTo(0, 0);
      }
      var sec = d.getElementById('view-' + name), page = NG.Pages[name];
      if (page && page.show && sec && Nav._ready[name]) { try { page.show(sec); } catch (e2) { if (w.console) console.warn('[NG] show ' + name, e2); } }
    },

    go: function (name, opts) {
      if (!ROUTES[name]) name = 'home';
      Nav.current = name;
      if (Nav.drawerOpen) Nav.drawer(false);
      var holder = d.getElementById('views');
      var sec = d.getElementById('view-' + name);
      if (!sec) {
        sec = d.createElement('section');
        sec.className = 'view'; sec.id = 'view-' + name;
        sec.setAttribute('aria-label', ROUTES[name].title);
        sec.innerHTML = '<div class="card empty-state"><div class="es-art spin" aria-hidden="true"></div><h3>LOADING MODULE...</h3></div>';
        holder.appendChild(sec);
      }
      Nav._activate(name, opts);
      if (Nav._ready[name]) return;
      if (Nav._loading[name]) return;
      Nav._loading[name] = true;
      Nav._fetch(name, function (err) {
        Nav._loading[name] = false;
        if (err) { Nav._errorCard(sec, name, err); return; }
        Nav._build(name, sec);
        if (Nav.current === name) Nav._activate(name, { silent: true });
        // modul hanya diisi saat user membuka -> jika sudah pindah, tetap siap
      });
    },

    /* prefetch halaman lain saat idle agar perpindahan cepat */
    prefetch: function () {
      var names = Object.keys(ROUTES).filter(function (n) { return !Nav._html[n]; }), i = 0;
      (function next() {
        if (i >= names.length) return;
        var n = names[i++];
        Nav._fetch(n, function () { setTimeout(next, 160); });
      })();
    },

    init: function (cfg) {
      if (Nav._inited) return;         // cegah listener ganda
      Nav._inited = true;

      d.addEventListener('click', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('[data-route],[data-retry]') : null;
        if (!t) return;
        if (t.hasAttribute('data-retry')) {
          var n = t.getAttribute('data-retry'), sec = d.getElementById('view-' + n);
          if (sec) { delete Nav._html[n]; Nav._ready[n] = false; sec.innerHTML = '<div class="card empty-state"><div class="es-art spin"></div><h3>LOADING MODULE...</h3></div>'; Nav.go(n); }
          return;
        }
        e.preventDefault();
        Nav.go(t.getAttribute('data-route'));
        if (NG.Sound) NG.Sound.play('tap');
      });
      var mb = d.getElementById('menuBtn'), bk = d.getElementById('drawerBackdrop'), cl = d.getElementById('drawerClose');
      if (mb) mb.addEventListener('click', function () { Nav.drawer(!Nav.drawerOpen); });
      if (bk) bk.addEventListener('click', function () { Nav.drawer(false); });
      if (cl) cl.addEventListener('click', function () { Nav.drawer(false); });
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && Nav.drawerOpen) Nav.drawer(false); });
      w.addEventListener('hashchange', function () {
        var h = (w.location.hash || '').replace('#', '');
        if (ROUTES[h] && h !== Nav.current) Nav.go(h, { silent: true });
      });

      var start = (w.location.hash || '').replace('#', '');
      Nav.go(ROUTES[start] ? start : (cfg && cfg.fallback) || 'home', { silent: true });
      setTimeout(Nav.prefetch, 1800);
    }
  };
})(window, document);
