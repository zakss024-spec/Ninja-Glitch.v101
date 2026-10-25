/* NINJA GLITCH - animation.js
 * - NG.runProgress : progress berbasis WAKTU (Date.now) -> tidak bergantung pada animasi CSS/rAF, tidak bisa stuck
 * - NG.Boot        : kontroler progress + status + SKIP (dipakai Intro & Ninja Loading)
 * - NG.Particles   : efek partikel canvas (opsional; jika gagal, flow tetap jalan)
 * - NG.Fps         : pengukur FPS nyata */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};

  /* ---------- Progress berbasis timer ---------- */
  var active = [];
  NG.runProgress = function (o) {
    var start = Date.now();
    var dur = Math.max(200, o.duration || 3000);
    var stopped = false;
    var id = null;
    var handle = { cancel: stop };

    function stop() {
      if (stopped) return;
      stopped = true;
      if (id !== null) { clearInterval(id); id = null; }
      var i = active.indexOf(handle);
      if (i > -1) active.splice(i, 1);
    }
    function tick() {
      if (stopped) return;
      var p = Math.min(100, Math.floor((Date.now() - start) / dur * 100));
      try { if (o.onTick) o.onTick(p); } catch (e) { if (w.console) console.warn('[NG] onTick', e); }
      if (p >= 100) {
        stop();
        try { if (o.onDone) o.onDone(); } catch (e2) { if (w.console) console.warn('[NG] onDone', e2); }
      }
    }
    active.push(handle);
    id = setInterval(tick, 60);
    tick();
    return handle;
  };
  NG.cancelAllProgress = function () { var a = active.slice(); for (var i = 0; i < a.length; i++) a[i].cancel(); };
  w.addEventListener('pagehide', NG.cancelAllProgress);

  /* ---------- Boot controller (Intro & Loading) ---------- */
  NG.Boot = {
    run: function (cfg) {
      var done = false, h = null, wd = null;
      var els = cfg.els || {};
      var lastStep = -1;

      function render(p) {
        if (els.bar) els.bar.style.width = p + '%';
        if (els.pct) els.pct.textContent = p + '%';
        if (els.bar && els.bar.parentNode) els.bar.parentNode.setAttribute('aria-valuenow', String(p));
        var idx = 0;
        for (var i = 0; i < cfg.steps.length; i++) if (p >= cfg.steps[i][0]) idx = i;
        if (idx !== lastStep) {
          lastStep = idx;
          if (els.status) els.status.textContent = cfg.steps[idx][1];
          if (cfg.onStep) { try { cfg.onStep(idx, cfg.steps[idx][1]); } catch (e) { /* abaikan */ } }
        }
      }
      function finish() {
        if (done) return;
        done = true;
        if (h) h.cancel();
        clearTimeout(wd);
        try { render(100); } catch (e) { /* abaikan */ }
        try { if (cfg.onDone) cfg.onDone(); } catch (e2) { if (w.console) console.warn('[NG] boot onDone', e2); }
      }

      // 1) Pasang SKIP lebih dulu agar selalu bekerja
      if (cfg.skipBtn) {
        cfg.skipBtn.addEventListener('click', function (e) { e.preventDefault(); finish(); });
      }
      // 2) Watchdog: apapun yang terjadi, lanjut
      wd = setTimeout(finish, (cfg.duration || 5000) + 4000);
      // 3) Progress timer
      h = NG.runProgress({ duration: cfg.duration, onTick: render, onDone: finish });
      return { finish: finish };
    }
  };

  /* ---------- Partikel ---------- */
  var P = NG.Particles = { speed: 1, running: false, raf: 0, canvas: null, ctx: null, parts: [], w: 0, h: 0, last: 0 };
  var COLORS = ['168,85,247', '34,211,238', '74,222,128'];

  function pResize() {
    if (!P.canvas) return;
    var dpr = Math.min(w.devicePixelRatio || 1, 2);
    P.w = w.innerWidth; P.h = w.innerHeight;
    P.canvas.width = Math.floor(P.w * dpr);
    P.canvas.height = Math.floor(P.h * dpr);
    P.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.max(18, Math.min(58, Math.floor(P.w * P.h / 17000)));
    P.parts = [];
    for (var i = 0; i < n; i++) P.parts.push(mk(true));
  }
  function mk(rand) {
    return {
      x: Math.random() * P.w, y: rand ? Math.random() * P.h : P.h + 10,
      r: Math.random() * 1.8 + .6, vy: -(Math.random() * .35 + .12), vx: (Math.random() - .5) * .18,
      c: COLORS[(Math.random() * COLORS.length) | 0], a: Math.random() * .6 + .25, ph: Math.random() * 6.28
    };
  }
  function pFrame(ts) {
    if (!P.running) return;
    P.raf = w.requestAnimationFrame(pFrame);
    if (d.hidden || ts - P.last < 33) return;  // ~30fps, hemat baterai
    P.last = ts;
    var ctx = P.ctx;
    ctx.clearRect(0, 0, P.w, P.h);
    for (var i = 0; i < P.parts.length; i++) {
      var p = P.parts[i];
      p.x += (p.vx + Math.sin(ts / 1500 + p.ph) * .15) * P.speed;
      p.y += p.vy * P.speed;
      if (p.y < -10) P.parts[i] = p = mk(false);
      var tw = .6 + .4 * Math.sin(ts / 600 + p.ph);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + p.c + ',' + (p.a * tw).toFixed(3) + ')';
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + p.c + ',' + (p.a * tw * .15).toFixed(3) + ')';
      ctx.arc(p.x, p.y, p.r * 3.2, 0, 6.2832);
      ctx.fill();
    }
  }
  P.start = function (canvas) {
    try {
      if (canvas) P.canvas = canvas;
      if (!P.canvas || P.running) return;
      if (d.body.classList.contains('fx-off') || d.body.classList.contains('reduce')) return;
      if (w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      P.ctx = P.canvas.getContext('2d');
      if (!P.ctx) return;
      pResize();
      P.running = true;
      P.raf = w.requestAnimationFrame(pFrame);
      if (!P._bound) { P._bound = true; w.addEventListener('resize', function () { if (P.running) pResize(); }); }
    } catch (e) {
      P.running = false;   // animasi gagal -> aplikasi tetap lanjut
    }
  };
  P.stop = function () {
    P.running = false;
    try { if (P.raf) w.cancelAnimationFrame(P.raf); } catch (e) { /* abaikan */ }
    try { if (P.ctx) P.ctx.clearRect(0, 0, P.w, P.h); } catch (e2) { /* abaikan */ }
  };
  w.addEventListener('pagehide', P.stop);

  /* ---------- FPS (satu pengukur global, ringan) ---------- */
  NG.Fps = {
    raf: 0, running: false, value: 0, subs: [],
    on: function (cb) { NG.Fps.subs.push(cb); if (NG.Fps.value) cb(NG.Fps.value); },
    start: function () {
      var self = NG.Fps;
      if (self.running || !w.requestAnimationFrame) return;
      self.running = true;
      var frames = 0, t0 = w.performance ? performance.now() : Date.now();
      function loop(ts) {
        if (!self.running) return;
        frames++;
        var now = ts || Date.now();
        if (now - t0 >= 1000) {
          if (!d.hidden) {
            self.value = Math.round(frames * 1000 / (now - t0));
            for (var i = 0; i < self.subs.length; i++) { try { self.subs[i](self.value); } catch (e) { /* abaikan */ } }
          }
          frames = 0; t0 = now;
        }
        self.raf = w.requestAnimationFrame(loop);
      }
      self.raf = w.requestAnimationFrame(loop);
    },
    stop: function () { NG.Fps.running = false; try { w.cancelAnimationFrame(NG.Fps.raf); } catch (e) { /* abaikan */ } }
  };
  w.addEventListener('pagehide', function () { NG.Fps.stop(); });
})(window, document);
