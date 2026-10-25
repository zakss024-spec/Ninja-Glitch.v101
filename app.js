/* NINJA GLITCH - app.js
 * Inti aplikasi: helper UI (toast, modal), suara, pengaturan visual, Intro, Login (+Fingerprint +Ninja Loading), shell Dashboard.
 * Semua SIMULASI LOKAL. Tidak ada jaringan ke target apa pun, tidak ada backend.
 * Catatan: kredensial di bawah hanya untuk simulasi UI (kode sisi-klien) - bukan keamanan sungguhan. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var S = w.NGStorage, D = w.NGData;

  var USER = 'Ninja67';
  var PASS = 'Glitch76';
  var MAX_FAILS = 5;
  var LOCK_MS = 30000;

  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function on(el, ev, fn) {
    if (!el) { if (w.console) console.warn('[NG] elemen tidak ditemukan untuk event:', ev); return; }
    el.addEventListener(ev, fn);
  }
  NG.$ = $; NG.$$ = $$; NG.on = on;

  NG.go = function (url) {
    if (NG._going) return;
    NG._going = true;
    try { d.body.classList.add('leaving'); } catch (e) { /* abaikan */ }
    setTimeout(function () { try { w.location.replace(url); } catch (e) { w.location.href = url; } }, 180);
  };
  w.addEventListener('error', function (ev) { if (w.console) console.warn('[NG] runtime:', ev && ev.message); });

  /* ---------- Suara (opsional, default OFF) ---------- */
  var cfg = D.settings.get();
  NG.cfg = function () { return cfg; };
  D.on('settings', function () { cfg = D.settings.get(); });
  var actx = null;
  NG.Sound = {
    play: function (kind) {
      if (!cfg.sound) return;
      try {
        var AC = w.AudioContext || w.webkitAudioContext; if (!AC) return;
        actx = actx || new AC();
        if (actx.state === 'suspended') actx.resume();
        var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
        var f = { tap: 520, start: 360, done: 880, warn: 200 }[kind] || 440;
        o.type = kind === 'warn' ? 'sawtooth' : 'sine';
        o.frequency.setValueAtTime(f, t); if (kind === 'done') o.frequency.linearRampToValueAtTime(1320, t + .12);
        g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.001, t + .16);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + .18);
      } catch (e) { /* abaikan */ }
    }
  };

  /* ---------- Pengaturan visual ---------- */
  function applySettings() {
    cfg = D.settings.get();
    var b = d.body, spd = { slow: 1.7, normal: 1, fast: .6 }[cfg.speed] || 1;
    b.classList.toggle('fx-off', !cfg.particles);
    b.classList.toggle('scan-off', !cfg.scanlines);
    b.classList.toggle('glitch-off', !cfg.glitch);
    b.classList.toggle('compact', cfg.compact);
    b.classList.toggle('reduce', cfg.reduce);
    d.documentElement.style.setProperty('--spd', String(spd));
    if (NG.Particles) {
      NG.Particles.speed = 1 / spd;
      if (cfg.particles && !cfg.reduce) NG.Particles.start($('#fx')); else NG.Particles.stop();
    }
  }
  NG.applySettings = applySettings;

  /* ---------- UI helpers ---------- */
  var toastEl = null, toastT = null;
  var UI = NG.UI = {
    esc: function (s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    toast: function (t) {
      toastEl = toastEl || $('#toast'); if (!toastEl) return;
      toastEl.textContent = t; toastEl.classList.add('show');
      clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2300);
    },
    /* empty state neon */
    empty: function (o) {
      return '<div class="empty-state"><div class="es-art" data-g="' + UI.esc(o.glyph || '+') + '" aria-hidden="true"></div><h3>' + UI.esc(o.title) + '</h3><p class="dim mono">' + UI.esc(o.sub || '') + '</p>' +
        (o.action ? '<button class="btn sm" type="button" data-empty-action="' + UI.esc(o.action) + '">' + UI.esc(o.label) + '</button>' : '') + '</div>';
    },
    /* tab sederhana: .tabs > [data-tab], panel [data-panel] */
    tabs: function (root, onChange) {
      var btns = $$('.tabs [data-tab]', root), panels = $$('[data-panel]', root);
      function show(n) {
        btns.forEach(function (b) { var a = b.getAttribute('data-tab') === n; b.classList.toggle('active', a); b.setAttribute('aria-selected', a ? 'true' : 'false'); });
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== n; });
        if (onChange) onChange(n);
      }
      btns.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-tab')); }); });
      if (btns.length) show(btns[0].getAttribute('data-tab'));
      return show;
    },

    /* ---------- Modal ---------- */
    _modalCleanup: null,
    modal: function (title, bodyHtml, onReady) {
      var m = $('#modal'), body = $('#modalBody'), tt = $('#modalTitle');
      if (!m || !body) return null;
      tt.textContent = title; body.innerHTML = bodyHtml;
      m.hidden = false; m.setAttribute('aria-hidden', 'false');
      NG._modalOpen = true; d.body.classList.add('lock');
      var prev = d.activeElement;
      UI._modalCleanup = function () { m.hidden = true; m.setAttribute('aria-hidden', 'true'); NG._modalOpen = false; d.body.classList.toggle('lock', !!(NG.Nav && NG.Nav.drawerOpen)); body.innerHTML = ''; try { if (prev && prev.focus) prev.focus(); } catch (e) { /* abaikan */ } };
      if (onReady) onReady(body);
      var f = body.querySelector('input,select,textarea,button'); if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }, 80);
      return body;
    },
    closeModal: function () { if (UI._modalCleanup) { var c = UI._modalCleanup; UI._modalCleanup = null; c(); } },

    /* form modal: fields [{id,label,type,value,placeholder,maxlength,options,inputmode,hint}] ; onSubmit(values) -> true | {id:msg} */
    form: function (o) {
      var h = '<form class="mform" novalidate autocomplete="off" onsubmit="return false;">';
      o.fields.forEach(function (f) {
        h += '<label class="field"><span>' + UI.esc(f.label) + '</span>';
        if (f.type === 'select') {
          h += '<select class="input" id="mf-' + f.id + '">' + f.options.map(function (op) { return '<option value="' + UI.esc(op.v) + '"' + (op.v === f.value ? ' selected' : '') + '>' + UI.esc(op.l) + '</option>'; }).join('') + '</select>';
        } else if (f.type === 'textarea') {
          h += '<textarea class="input ta" id="mf-' + f.id + '" rows="3" maxlength="' + (f.maxlength || 200) + '" placeholder="' + UI.esc(f.placeholder || '') + '">' + UI.esc(f.value || '') + '</textarea>';
        } else {
          h += '<input class="input" id="mf-' + f.id + '" type="' + (f.type || 'text') + '" value="' + UI.esc(f.value || '') + '" maxlength="' + (f.maxlength || 40) + '" placeholder="' + UI.esc(f.placeholder || '') + '" inputmode="' + (f.inputmode || 'text') + '" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off">';
        }
        h += (f.hint ? '<small class="hint">' + UI.esc(f.hint) + '</small>' : '') + '<small class="err" id="me-' + f.id + '"></small></label>';
      });
      h += '<div class="m-actions"><button class="btn ghost" type="button" data-mcancel>CANCEL</button><button class="btn" type="submit">' + UI.esc(o.submit || 'SAVE') + '</button></div></form>';
      UI.modal(o.title, h, function (body) {
        var form = $('form', body);
        function run() {
          var vals = {};
          o.fields.forEach(function (f) { var e = $('#mf-' + f.id, body); vals[f.id] = e ? e.value : ''; $('#me-' + f.id, body).textContent = ''; });
          var r = o.onSubmit(vals);
          if (r === true) { UI.closeModal(); return; }
          if (r && typeof r === 'object') { for (var k in r) { var er = $('#me-' + k, body); if (er) er.textContent = r[k]; } if (NG.Sound) NG.Sound.play('warn'); }
        }
        form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
        $('[data-mcancel]', body).addEventListener('click', UI.closeModal);
      });
    },
    confirm: function (o) {
      var h = '<p class="mtext">' + UI.esc(o.text) + '</p><div class="m-actions"><button class="btn ghost" type="button" data-mcancel>CANCEL</button><button class="btn ' + (o.danger ? 'danger' : '') + '" type="button" data-mok>' + UI.esc(o.ok || 'CONFIRM') + '</button></div>';
      UI.modal(o.title || 'CONFIRM', h, function (body) {
        $('[data-mcancel]', body).addEventListener('click', UI.closeModal);
        $('[data-mok]', body).addEventListener('click', function () { UI.closeModal(); if (o.onOk) o.onOk(); });
      });
    }
  };

  /* =====================================================
   *  INTRO
   * ===================================================== */
  function initIntro() {
    var replay = /[?&]replay=1/.test(w.location.search);
    if (!replay && D.session.active()) { NG.go('dashboard.html'); return; }
    var lines = $('#bootLines'), shown = [];
    NG.Boot.run({
      duration: 4800,
      steps: [[0, 'INITIALIZING'], [22, 'LOADING CORE'], [55, 'PREPARING SYSTEM'], [90, 'SYSTEM READY']],
      els: { bar: $('#introBar'), pct: $('#introPct'), status: $('#introStatus') },
      skipBtn: $('#skipIntro'),
      onStep: function (i, text) { if (!lines) return; shown.push('<b>&gt;</b> ' + text + '...'); lines.innerHTML = shown.slice(-3).join('<br>'); },
      onDone: function () { NG.go('login.html'); }
    });
    applySettings();
  }

  /* =====================================================
   *  LOGIN + FINGERPRINT + NINJA LOADING
   * ===================================================== */
  function initLogin() {
    var stages = { login: $('#stage-login'), finger: $('#stage-finger'), loading: $('#stage-loading') };
    function show(name) { for (var k in stages) if (stages[k]) stages[k].classList.toggle('active', k === name); w.scrollTo(0, 0); }
    var qs = w.location.search;

    var loadingStarted = false;
    function startLoading() {
      if (loadingStarted) return;
      loadingStarted = true;
      show('loading');
      NG.Boot.run({
        duration: 6500,
        steps: [[0, 'INITIALIZING'], [18, 'LOADING MODULES'], [42, 'SYNCING'], [72, 'RENDERING'], [93, 'READY']],
        els: { bar: $('#ldgBar'), pct: $('#ldgPct'), status: $('#ldgStatus') },
        skipBtn: $('#ldgSkip'),
        onDone: function () { if (!D.session.active()) D.session.start(); NG.go('dashboard.html'); }
      });
    }

    var fpReady = false;
    function showFinger() {
      show('finger');
      if (fpReady) return;
      fpReady = true;
      NG.Fingerprint.init({
        btn: $('#fpBtn'), pct: $('#fpPct'), status: $('#fpStatus'), steps: $$('.fp-steps span'),
        skipBtn: $('#fpSkip'), duration: 2800,
        onGranted: function () { D.activity.add('FINGERPRINT', 'FINGERPRINT VERIFIED'); startLoading(); }
      });
      on($('#fpBack'), 'click', function () {
        S.remove('authed');
        if (NG.Fingerprint._api) NG.Fingerprint._api.reset();
        show('login');
      });
    }

    if (D.session.active()) {
      if (/[?&]stage=loading/.test(qs)) { applySettings(); startLoading(); } else NG.go('dashboard.html');
      return;
    }
    applySettings();

    var form = $('#loginForm'), uEl = $('#username'), pEl = $('#password');
    var btn = $('#loginBtn'), btnTxt = $('#loginBtnTxt'), msg = $('#loginMsg'), eye = $('#togglePass');
    var busy = false, lockTimer = null;

    function setMsg(text, cls) { msg.textContent = text || ''; msg.className = 'msg' + (cls ? ' ' + cls : ''); }
    function setBusy(v, label) {
      busy = v; btn.disabled = v; uEl.disabled = v; pEl.disabled = v;
      btnTxt.textContent = label || 'ENTER SYSTEM';
      var sp = $('.spinner', btn);
      if (v && !sp) { sp = d.createElement('span'); sp.className = 'spinner'; btn.insertBefore(sp, btnTxt); }
      if (!v && sp) sp.parentNode.removeChild(sp);
    }
    function lockLeft() {
      var left = (parseInt(S.get('lockUntil', '0'), 10) || 0) - Date.now();
      if (left > LOCK_MS) left = LOCK_MS;
      return left > 0 ? left : 0;
    }
    function startLockUI() {
      if (lockTimer) clearInterval(lockTimer);
      function tick() {
        var left = lockLeft();
        if (left <= 0) { clearInterval(lockTimer); lockTimer = null; S.remove('lockUntil'); S.remove('fails'); setBusy(false); setMsg('SILAKAN COBA LAGI', 'info'); return; }
        setBusy(true, 'LOCKED ' + Math.ceil(left / 1000) + 's');
        setMsg('TOO MANY ATTEMPTS - LOCKED ' + Math.ceil(left / 1000) + 's', 'denied');
      }
      tick();
      if (lockLeft() > 0) lockTimer = setInterval(tick, 250);
    }
    function onSuccess() {
      S.set('authed', '1'); S.remove('fails'); S.remove('lockUntil');
      pEl.value = '';
      D.activity.add('LOGIN', 'LOGIN SUCCESS');
      setBusy(true, 'LOGIN OK');
      setMsg('LOGIN SUCCESS', 'good');
      setTimeout(function () { setBusy(false); setMsg(''); showFinger(); }, 650);
    }
    function onFail() {
      var fails = (parseInt(S.get('fails', '0'), 10) || 0) + 1;
      S.set('fails', fails);
      pEl.value = '';
      D.activity.add('LOGIN', 'LOGIN FAILED (' + fails + '/' + MAX_FAILS + ')');
      var card = $('#loginForm'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      if (fails >= MAX_FAILS) { S.set('lockUntil', Date.now() + LOCK_MS); startLockUI(); return; }
      setBusy(false);
      setMsg('ACCESS DENIED (' + fails + '/' + MAX_FAILS + ')', 'denied');
      try { pEl.focus(); } catch (e) { /* abaikan */ }
    }
    function attempt() {
      if (busy) return;
      if (lockLeft() > 0) { startLockUI(); return; }
      var u = uEl.value.replace(/^\s+|\s+$/g, ''), p = pEl.value;
      if (!u || !p) { setMsg('ISI USERNAME DAN PASSWORD', 'info'); return; }
      setBusy(true, 'VERIFYING...'); setMsg('VERIFYING...', 'info');
      setTimeout(function () { if (u === USER && p === PASS) onSuccess(); else onFail(); }, 900);
    }

    on(form, 'submit', function (e) { e.preventDefault(); e.stopPropagation(); attempt(); });
    on(uEl, 'keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); pEl.focus(); } });
    on(eye, 'click', function () {
      var s = pEl.type === 'password';
      pEl.type = s ? 'text' : 'password';
      eye.setAttribute('aria-pressed', s ? 'true' : 'false');
      eye.setAttribute('aria-label', s ? 'Sembunyikan password' : 'Tampilkan password');
    });
    if (S.get('authed', '') === '1') showFinger(); else show('login');
    if (lockLeft() > 0) startLockUI();
  }

  /* =====================================================
   *  DASHBOARD SHELL
   * ===================================================== */
  function initDashboard() {
    if (!D.session.active()) { NG.go('login.html'); return; }
    D.seed();
    applySettings();
    D.on('settings', applySettings);

    // notifikasi awal sesi (sekali per sesi)
    var sid = String(D.session.startedAt());
    if (S.get('noteSession', '') !== sid) {
      S.set('noteSession', sid);
      D.notes.add('SYSTEM READY', 'Engine & modul simulasi lokal siap.', 'ok');
      D.notes.add('SESSION ACTIVE', 'Sesi lokal dimulai. Tidak ada koneksi eksternal.', 'info');
      D.activity.add('SYSTEM', 'Dashboard opened - session active');
    }
    D.flushCorrupt();
    NG._dashReady = true;

    // modal: tutup via backdrop / tombol X / Esc
    var modal = $('#modal');
    if (modal) {
      on(modal, 'click', function (e) { if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-close')) UI.closeModal(); });
      d.addEventListener('keydown', function (e) {
        if (modal.hidden) return;
        if (e.key === 'Escape') UI.closeModal();
        if (e.key === 'Tab') {   // focus trap
          var f = $$('button,input,select,textarea,[href]', modal).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
          if (!f.length) return;
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
    }
    // aksi empty-state generik
    d.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-empty-action]');
      if (!t) return;
      var a = t.getAttribute('data-empty-action');
      if (a === 'new-sender' && NG.Sender) NG.Sender.openForm();
      else if (a === 'new-group' && NG.Group) NG.Group.openForm();
      else if (NG.Nav) NG.Nav.go(a);
    });

    // keyboard / visual viewport (modal & bottom nav aman saat keyboard terbuka)
    var vv = w.visualViewport, baseH = Math.max(w.innerHeight, vv ? vv.height : 0);
    function vvUpdate() {
      if (!vv) return;
      var root = d.documentElement.style;
      root.setProperty('--vvh', Math.round(vv.height) + 'px');
      root.setProperty('--vvt', Math.round(vv.offsetTop) + 'px');
      var a = d.activeElement, typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
      d.body.classList.toggle('kb-open', !!typing && vv.height < baseH * .8);
    }
    if (vv) { vv.addEventListener('resize', vvUpdate); vv.addEventListener('scroll', vvUpdate); }
    w.addEventListener('orientationchange', function () { setTimeout(function () { baseH = Math.max(w.innerHeight, vv ? vv.height : 0); vvUpdate(); }, 400); });
    d.addEventListener('focusout', function () { setTimeout(vvUpdate, 120); });

    function logout() {
      D.activity.add('LOGIN', 'LOGOUT');
      D.session.end();
      NG.go('login.html');
    }
    NG.logout = logout;
    on($('#logoutTop'), 'click', logout);
    on($('#drawerLogout'), 'click', logout);

    if (NG.Notif) NG.Notif.init();
    NG.Nav.init({ fallback: 'home' });
    // pagehide: bersihkan semua timer progress (sudah ditangani di animation.js)
  }

  /* ---------- Bootstrap ---------- */
  function boot() {
    var page = d.body.getAttribute('data-page');
    try {
      if (page === 'intro') initIntro();
      else if (page === 'login') initLogin();
      else if (page === 'dashboard') initDashboard();
    } catch (e) {
      if (w.console) console.error('[NG] init error', e);
      if (page === 'intro') { var sk = $('#skipIntro'); if (sk) sk.addEventListener('click', function () { NG.go('login.html'); }); setTimeout(function () { NG.go('login.html'); }, 4000); }
      if (page === 'dashboard') { try { NG.Nav.init({ fallback: 'home' }); } catch (e2) { /* abaikan */ } }
    }
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})(window, document);
