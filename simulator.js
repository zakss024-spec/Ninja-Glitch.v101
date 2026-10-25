/* NINJA GLITCH - simulator.js
 * Mesin SIMULASI LOKAL. Tidak ada jaringan, tidak ada request keluar, tidak ada aksi terhadap akun/grup/nomor nyata.
 * Semua "target", "grup", "sender" hanyalah data fiktif/lokal; keluaran hanya teks & animasi di layar.
 *  - NG.Console  : util baris console
 *  - NG.Sim      : engine (satu simulasi pada satu waktu, berbasis timer -> tidak bisa stuck)
 *  - NG.SimPanel : komponen UI bersama (status, progress, console, START/STOP/RESET) */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};

  /* ---------- Console util ---------- */
  NG.Console = {
    line: function (box, tag, text, cls) {
      if (!box) return;
      var ln = d.createElement('span');
      ln.className = 'ln' + (cls ? ' ' + cls : '');
      var t = d.createElement('i'); t.textContent = w.NGData ? NGData.fmtTime() : '';
      var g = d.createElement('em'); g.textContent = '[' + tag + '] ';
      ln.appendChild(t); ln.appendChild(g); ln.appendChild(d.createTextNode(text));
      box.appendChild(ln);
      while (box.childNodes.length > 140) box.removeChild(box.firstChild);
      box.scrollTop = box.scrollHeight;
    },
    clear: function (box) { if (box) box.textContent = ''; }
  };


  /* ---------- Generator data FIKTIF deterministik (tidak ada lookup nyata) ---------- */
  NG.Fake = {
    hash: function (str) {
      var h = 1779033703 ^ str.length;
      for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
      h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^ (h >>> 16)) >>> 0;
    },
    rng: function (seed) {
      var a = typeof seed === 'string' ? NG.Fake.hash(seed) : (seed >>> 0);
      return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    },
    int: function (r, a, b) { return a + Math.floor(r() * (b - a + 1)); },
    pick: function (r, arr) { return arr[Math.floor(r() * arr.length)]; },
    /* hanya target fiktif: *.local, *.test, *.example, *.invalid, atau range dokumentasi RFC5737 */
    validTarget: function (t) {
      t = (t || '').trim().toLowerCase();
      if (/^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?\.(local|test|example|invalid)$/.test(t)) return true;
      var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(t);
      if (!m) return false;
      var o = m.slice(1).map(Number);
      if (o.some(function (n) { return n > 255; })) return false;
      return (o[0] === 192 && o[1] === 0 && o[2] === 2) || (o[0] === 198 && o[1] === 51 && o[2] === 100) || (o[0] === 203 && o[1] === 0 && o[2] === 113) || (o[0] === 192 && o[1] === 168);
    }
  };

  var STATUS_CLS = { READY: 'dim', COMPLETE: 'ok', STOPPED: 'bad' };

  /* ---------- Engine ---------- */
  var subs = [];
  var Sim = NG.Sim = {
    state: { running: false, owner: '', kind: '', label: '', status: 'READY', pct: 0 },
    _h: null, _cfg: null, _sched: null, _next: 0, _stageIdx: -1,

    on: function (fn) { subs.push(fn); },
    _emit: function (type, extra) {
      var s = Sim.state;
      for (var i = 0; i < subs.length; i++) { try { subs[i](type, s, extra); } catch (e) { if (w.console) console.warn('[NG] sim sub', e); } }
    },
    statusClass: function (st) { return STATUS_CLS[st] || 'warn'; },

    /* cfg: {owner, kind, statKey, label, duration, stages:[{at,status,lines:[]}], act:{type,start,done,stop}, notif:{title,text}, sender:true} */
    start: function (cfg) {
      if (Sim.state.running) return false;
      var stages = cfg.stages.slice().sort(function (a, b) { return a.at - b.at; });
      var sched = [];
      stages.forEach(function (s, i) {
        var end = i + 1 < stages.length ? stages[i + 1].at : 100;
        var L = s.lines || [];
        for (var k = 0; k < L.length; k++) sched.push({ at: s.at + (end - s.at) * (k / Math.max(1, L.length)) * 0.9, text: L[k] });
      });
      sched.sort(function (a, b) { return a.at - b.at; });
      Sim._cfg = cfg; Sim._sched = sched; Sim._next = 0; Sim._stageIdx = -1;
      Sim.state = { running: true, owner: cfg.owner, kind: cfg.kind, label: cfg.label, status: stages[0].status, pct: 0 };
      var sender = w.NGData ? NGData.senders.active() : null;
      Sim._emit('start');
      if (cfg.sender !== false) {
        Sim._emit('line', sender ? 'Sender identity: ' + sender.name + ' (' + NGData.maskPhone(sender.cc, sender.phone) + ') - local profile only' : 'Sender identity: DEFAULT SIMULATOR (no active sender)');
      }
      Sim._emit('line', 'LOCAL SIMULATION - no network request, no real target.');
      if (w.NGData && cfg.act) NGData.activity.add(cfg.act.type, cfg.act.start);
      if (NG.Sound) NG.Sound.play('start');

      Sim._h = NG.runProgress({
        duration: cfg.duration || 5000,
        onTick: function (p) {
          var st = Sim.state;
          st.pct = p;
          var idx = 0;
          for (var i = 0; i < stages.length; i++) if (p >= stages[i].at) idx = i;
          if (idx !== Sim._stageIdx) { Sim._stageIdx = idx; st.status = (p >= 100) ? 'COMPLETE' : stages[idx].status; Sim._emit('status'); }
          while (Sim._next < sched.length && p >= sched[Sim._next].at) { Sim._emit('line', sched[Sim._next].text); Sim._next++; }
          Sim._emit('tick');
        },
        onDone: function () { Sim._finish(true); }
      });
      return true;
    },

    stop: function () {
      if (!Sim.state.running) return;
      if (Sim._h) Sim._h.cancel();
      Sim._finish(false);
    },

    _finish: function (ok) {
      var cfg = Sim._cfg, st = Sim.state;
      if (!st.running) return;
      st.running = false;
      st.status = ok ? 'COMPLETE' : 'STOPPED';
      if (ok) st.pct = 100;
      Sim._h = null;
      try {
        if (w.NGData && cfg) {
          if (cfg.statKey) NGData.stats.record(cfg.statKey, ok);
          if (ok && cfg.sender !== false) NGData.senders.touch(cfg.senderStat || null);
          if (cfg.act) NGData.activity.add(cfg.act.type, ok ? cfg.act.done : cfg.act.stop);
          if (ok && cfg.notif) NGData.notes.add(cfg.notif.title, cfg.notif.text || '', 'ok');
        }
      } catch (e) { if (w.console) console.warn('[NG] sim finish', e); }
      if (NG.Sound) NG.Sound.play(ok ? 'done' : 'warn');
      Sim._emit('line', ok ? (cfg.doneText || 'SIMULATION COMPLETE') + ' - no external action was performed.' : 'Simulation stopped by user.');
      Sim._emit('end', ok);
      if (cfg && cfg.onDone) { try { cfg.onDone(ok); } catch (e2) { if (w.console) console.warn('[NG] sim onDone', e2); } }
    }
  };
  w.addEventListener('pagehide', function () { if (Sim._h) Sim._h.cancel(); });

  /* ---------- Panel UI bersama ---------- */
  NG.SimPanel = {
    /* opts: {id, kind, statKey, senderStat, label, act, notif, doneText, collect(), stages(params), duration(params), fx(params), onDone(ok,params)} */
    bind: function (root, opts) {
      var q = function (n) { return root.querySelector('[data-sim="' + n + '"]'); };
      var el = { status: q('status'), pct: q('pct'), bar: q('bar'), con: q('console'), start: q('start'), stop: q('stop'), reset: q('reset'), stage: q('stage'), log: q('log'), busy: q('busy') };
      var params = null;

      function setStatus(st) {
        if (!el.status) return;
        el.status.textContent = st;
        el.status.className = 'sim-st ' + Sim.statusClass(st);
      }
      function setPct(p) {
        if (el.pct) el.pct.textContent = p + '%';
        if (el.bar) { el.bar.style.width = p + '%'; if (el.bar.parentNode) el.bar.parentNode.setAttribute('aria-valuenow', String(p)); }
      }
      function buttons(running) {
        if (el.start) el.start.disabled = running;
        if (el.stop) el.stop.disabled = !running;
        if (el.reset) el.reset.disabled = running;
        root.classList.toggle('is-running', running);
      }
      function renderLog() {
        if (!el.log || !w.NGData || !opts.logType) return;
        var a = NGData.activity.all().filter(function (x) { return x.type === opts.logType; }).slice(0, 6);
        el.log.textContent = '';
        if (!a.length) { var e = d.createElement('li'); e.className = 'empty-li'; e.textContent = 'No activity yet - run your first simulation'; el.log.appendChild(e); return; }
        a.forEach(function (x) {
          var li = d.createElement('li');
          var t = d.createElement('span'); t.className = 'cy'; t.textContent = NGData.fmtTime(x.ts);
          var m = d.createElement('span'); m.textContent = x.text;
          li.appendChild(t); li.appendChild(m); el.log.appendChild(li);
        });
      }
      function sync() {
        var s = Sim.state, mine = s.owner === opts.id;
        if (el.busy) { el.busy.hidden = !(s.running && !mine); el.busy.textContent = s.running && !mine ? 'BUSY: ' + s.label + ' is running - wait or stop it first.' : ''; }
        if (mine) { setStatus(s.status); setPct(s.pct); buttons(s.running); }
        else { buttons(false); if (el.start) el.start.disabled = s.running; }
      }

      Sim.on(function (type, s, extra) {
        if (s.owner !== opts.id) { if (type === 'start' || type === 'end') sync(); return; }
        if (type === 'line') NG.Console.line(el.con, 'LOCAL', extra);
        else if (type === 'start') {
          if (el.stage) { el.stage.classList.remove('done'); el.stage.classList.add('run'); (opts.fx && params) && el.stage.setAttribute('data-fx', opts.fx(params)); }
          setStatus(s.status); setPct(0); buttons(true);
        } else if (type === 'status') setStatus(s.status);
        else if (type === 'tick') setPct(s.pct);
        else if (type === 'end') {
          if (el.stage) { el.stage.classList.remove('run'); if (extra) { el.stage.classList.add('done'); setTimeout(function () { el.stage.classList.remove('done'); }, 1800); } }
          setStatus(s.status); setPct(s.pct); buttons(false);
          renderLog();
          if (el.start) el.start.textContent = opts.restartLabel || 'RUN AGAIN';
        }
      });
      if (w.NGData) NGData.on('activity', renderLog);

      if (el.start) el.start.addEventListener('click', function () {
        if (Sim.state.running) { if (NG.UI) NG.UI.toast('Simulasi lain sedang berjalan'); return; }
        var c = opts.collect ? opts.collect() : { ok: true, params: {} };
        if (!c.ok) { if (NG.UI) NG.UI.toast(c.msg || 'Lengkapi form dulu'); if (NG.Sound) NG.Sound.play('warn'); return; }
        params = c.params;
        NG.Console.clear(el.con);
        var cfg = {
          owner: opts.id, kind: opts.kind, statKey: opts.statKey, senderStat: opts.senderStat, label: opts.label,
          duration: opts.duration ? opts.duration(params) : 5000, stages: opts.stages(params),
          act: typeof opts.act === 'function' ? opts.act(params) : opts.act, notif: typeof opts.notif === 'function' ? opts.notif(params) : opts.notif,
          doneText: typeof opts.doneText === 'function' ? opts.doneText(params) : opts.doneText,
          statKey: typeof opts.statKey === 'function' ? opts.statKey(params) : opts.statKey, label: typeof opts.label === 'function' ? opts.label(params) : opts.label,
          onDone: function (ok) { if (opts.onDone) opts.onDone(ok, params); }
        };
        if (!Sim.start(cfg) && NG.UI) NG.UI.toast('Simulasi lain sedang berjalan');
      });
      if (el.stop) el.stop.addEventListener('click', function () { Sim.stop(); });
      if (el.reset) el.reset.addEventListener('click', function () {
        if (Sim.state.running) return;
        NG.Console.clear(el.con); setStatus('READY'); setPct(0);
        if (el.start) el.start.textContent = opts.startLabel || el.start.getAttribute('data-label') || 'START';
        if (opts.onReset) opts.onReset();
      });
      if (el.start) el.start.setAttribute('data-label', el.start.textContent);
      setStatus('READY'); setPct(0); buttons(false); renderLog();
      return { sync: sync, renderLog: renderLog };
    }
  };

  /* segmented chips (mis. intensitas): <div class="seg" data-seg="lvl"><button class="chip" data-v="1">..</button></div> */
  NG.SimPanel.seg = function (root, name, def) {
    var box = root.querySelector('[data-seg="' + name + '"]'), val = def;
    if (!box) return { get: function () { return def; }, set: function () {} };
    var chips = box.querySelectorAll('.chip');
    function set(v) {
      val = v;
      Array.prototype.forEach.call(chips, function (c) { var on = c.getAttribute('data-v') === String(v); c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    }
    box.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('.chip');
      if (c && !(NG.Sim.state.running)) set(c.getAttribute('data-v'));
    });
    set(def);
    return { get: function () { return val; }, set: set };
  };
})(window, document);
