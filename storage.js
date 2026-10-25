/* NINJA GLITCH - storage.js
 * 1) NGStorage : localStorage aman (tidak pernah melempar error; fallback memori + window.name)
 * 2) NGData    : lapisan data konsisten (senders, groups, activity, notifications, stats, settings, session)
 * Semua data HANYA lokal. Password TIDAK PERNAH disimpan. Data rusak dipulihkan otomatis (tidak crash). */
(function (w) {
  'use strict';

  var PREFIX = 'ng_';
  var WN_TAG = 'NGSTORE:';
  var mem = {};
  var lsOK = false;

  try {
    var probe = '__ng_probe__';
    w.localStorage.setItem(probe, '1');
    w.localStorage.removeItem(probe);
    lsOK = true;
  } catch (e) { lsOK = false; }

  if (!lsOK) {
    try {
      if (typeof w.name === 'string' && w.name.indexOf(WN_TAG) === 0) mem = JSON.parse(w.name.slice(WN_TAG.length)) || {};
    } catch (e2) { mem = {}; }
  }
  function persistFallback() {
    if (lsOK) return;
    try { w.name = WN_TAG + JSON.stringify(mem); } catch (e) { /* abaikan */ }
  }

  var Storage = {
    available: lsOK,
    corrupt: [],

    get: function (key, def) {
      var v = null;
      try {
        v = lsOK ? w.localStorage.getItem(PREFIX + key) : (Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null);
      } catch (e) { v = Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null; }
      return (v === null || v === undefined) ? def : v;
    },
    set: function (key, val) {
      var s = String(val);
      mem[key] = s;
      if (lsOK) { try { w.localStorage.setItem(PREFIX + key, s); } catch (e) { /* kuota/diblokir */ } } else persistFallback();
    },
    remove: function (key) {
      delete mem[key];
      if (lsOK) { try { w.localStorage.removeItem(PREFIX + key); } catch (e) { /* abaikan */ } } else persistFallback();
    },
    /* getJSON(key, def, check): bila JSON rusak / tipe salah -> reset ke def + catat korupsi */
    getJSON: function (key, def, check) {
      var raw = Storage.get(key, null);
      if (raw === null) return def;
      var v, bad = false;
      try { v = JSON.parse(raw); } catch (e) { bad = true; }
      if (!bad && check && !check(v)) bad = true;
      if (bad) {
        Storage.corrupt.push(key);
        Storage.set(key, JSON.stringify(def));
        return def;
      }
      return v;
    },
    setJSON: function (key, obj) { try { Storage.set(key, JSON.stringify(obj)); } catch (e) { /* abaikan */ } },
    keys: function () {
      var out = [];
      try {
        if (lsOK) { for (var i = 0; i < w.localStorage.length; i++) { var k = w.localStorage.key(i); if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length)); } }
        else out = Object.keys(mem);
      } catch (e) { out = Object.keys(mem); }
      return out.sort();
    }
  };
  w.NGStorage = Storage;

  /* =====================================================
   * NGData
   * ===================================================== */
  var S = Storage;
  var listeners = {};
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt) {
    var a = (listeners[evt] || []).slice();
    for (var i = 0; i < a.length; i++) { try { a[i](); } catch (e) { if (w.console) console.warn('[NG] listener', evt, e); } }
  }
  function str(v, max) { return (typeof v === 'string' ? v : (v === null || v === undefined ? '' : String(v))).replace(/[\u0000-\u001f]/g, ' ').slice(0, max || 60); }
  function num(v) { v = Number(v); return isFinite(v) && v >= 0 ? v : 0; }
  function uid(p) { return p + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  function coll(key, evt, norm, max) {
    return {
      exists: function () { return S.get(key, null) !== null; },
      all: function () {
        var a = S.getJSON(key, [], Array.isArray), out = [], bad = false;
        for (var i = 0; i < a.length; i++) { var n = norm(a[i]); if (n) out.push(n); else bad = true; }
        if (bad) { S.corrupt.push(key); S.setJSON(key, out); }
        return out;
      },
      save: function (arr) {
        if (max && arr.length > max) arr = arr.slice(0, max);
        S.setJSON(key, arr); emit(evt);
      }
    };
  }

  /* ---------- Normalizer ---------- */
  function nSender(o) {
    if (!isObj(o) || !o.id) return null;
    return { id: str(o.id, 20), name: str(o.name, 24) || 'SENDER', cc: str(o.cc, 5) || '+62', phone: str(o.phone, 16), profile: str(o.profile, 24),
      created: num(o.created), last: num(o.last), sims: num(o.sims), bug: num(o.bug), bugGroup: num(o.bugGroup), banGroup: num(o.banGroup), report: num(o.report), demo: !!o.demo };
  }
  function nGroup(o) {
    if (!isObj(o) || !o.id) return null;
    var members = Array.isArray(o.members) ? o.members.map(function (m) { return str(m, 24); }).filter(Boolean).slice(0, 60) : [];
    var log = Array.isArray(o.log) ? o.log.filter(isObj).map(function (l) { return { ts: num(l.ts), text: str(l.text, 90) }; }).slice(0, 40) : [];
    var st = ['ACTIVE', 'IDLE', 'ARCHIVED'].indexOf(o.status) > -1 ? o.status : 'ACTIVE';
    return { id: str(o.id, 20), name: str(o.name, 24) || 'GROUP', status: st, members: members, log: log, created: num(o.created), sims: num(o.sims) };
  }
  function nAct(o) { return isObj(o) ? { ts: num(o.ts), type: str(o.type, 14) || 'SYSTEM', text: str(o.text, 120) } : null; }
  function nNote(o) { return isObj(o) && o.id ? { id: str(o.id, 20), ts: num(o.ts), title: str(o.title, 40), text: str(o.text, 120), read: !!o.read, lvl: ['info', 'ok', 'warn'].indexOf(o.lvl) > -1 ? o.lvl : 'info' } : null; }

  var senders = coll('senders', 'senders', nSender, 40);
  var groups = coll('groups', 'groups', nGroup, 40);
  var activity = coll('activity', 'activity', nAct, 300);
  var notes = coll('notes', 'notes', nNote, 60);

  var NGData = {
    on: on, emit: emit, str: str, uid: uid,

    fmtTime: function (ts) {
      var d = new Date(ts || Date.now()), z = function (n) { return (n < 10 ? '0' : '') + n; };
      return z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds());
    },
    fmtDate: function (ts) {
      var d = new Date(ts || Date.now()), z = function (n) { return (n < 10 ? '0' : '') + n; };
      return z(d.getDate()) + '/' + z(d.getMonth() + 1) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
    },
    maskPhone: function (cc, phone) {
      var p = String(phone || '').replace(/\D/g, '');
      if (p.length <= 5) return (cc || '') + ' ' + p;
      return (cc || '') + ' ' + p.slice(0, 2) + '••••' + p.slice(-3);
    },

    /* ---------- Senders (profil lokal; nomor TIDAK PERNAH dikirim ke mana pun) ---------- */
    senders: {
      all: senders.all,
      get: function (id) { var a = senders.all(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; },
      activeId: function () { return S.get('activeSender', ''); },
      active: function () { var id = S.get('activeSender', ''); return id ? NGData.senders.get(id) : null; },
      setActive: function (id) { if (id && !NGData.senders.get(id)) id = ''; S.set('activeSender', id || ''); emit('senders'); },
      add: function (o) {
        var s = nSender({ id: uid('SND'), name: o.name, cc: o.cc, phone: o.phone, profile: o.profile, created: Date.now(), last: 0, demo: !!o.demo });
        var a = senders.all(); a.push(s); senders.save(a);
        if (!NGData.senders.active()) NGData.senders.setActive(s.id);
        return s;
      },
      update: function (id, patch) {
        var a = senders.all();
        for (var i = 0; i < a.length; i++) if (a[i].id === id) { for (var k in patch) a[i][k] = patch[k]; a[i] = nSender(a[i]); }
        senders.save(a);
      },
      remove: function (id) {
        senders.save(senders.all().filter(function (s) { return s.id !== id; }));
        if (S.get('activeSender', '') === id) { var rest = senders.all(); S.set('activeSender', rest.length ? rest[0].id : ''); emit('senders'); }
      },
      /* catat pemakaian simulasi oleh sender aktif */
      touch: function (statKey) {
        var s = NGData.senders.active(); if (!s) return;
        var p = { last: Date.now(), sims: s.sims + 1 };
        if (statKey && typeof s[statKey] === 'number') p[statKey] = s[statKey] + 1;
        NGData.senders.update(s.id, p);
      },
      count: function () { return senders.all().length; }
    },

    /* ---------- Groups (fiktif) ---------- */
    fake: {
      pool: ['NinjaUser', 'ShadowUser', 'CyberUser', 'GhostUser', 'NeonUser', 'VoidUser', 'PixelUser', 'GlitchUser'],
      member: function (taken) {
        for (var t = 0; t < 40; t++) {
          var n = NGData.fake.pool[Math.floor(Math.random() * NGData.fake.pool.length)] + ('0' + (1 + Math.floor(Math.random() * 98))).slice(-2);
          if (!taken || taken.indexOf(n) < 0) return n;
        }
        return 'FakeUser' + Date.now() % 1000;
      }
    },
    groups: {
      all: groups.all,
      get: function (id) { var a = groups.all(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; },
      add: function (o) {
        var g = nGroup({ id: uid('GRP'), name: o.name, status: o.status || 'ACTIVE', members: o.members || [], log: [{ ts: Date.now(), text: 'Group created (local)' }], created: Date.now() });
        var a = groups.all(); a.push(g); groups.save(a); return g;
      },
      update: function (id, patch) {
        var a = groups.all();
        for (var i = 0; i < a.length; i++) if (a[i].id === id) { for (var k in patch) a[i][k] = patch[k]; a[i] = nGroup(a[i]); }
        groups.save(a);
      },
      remove: function (id) { groups.save(groups.all().filter(function (g) { return g.id !== id; })); },
      log: function (id, text) {
        var g = NGData.groups.get(id); if (!g) return;
        g.log.unshift({ ts: Date.now(), text: str(text, 90) });
        NGData.groups.update(id, { log: g.log.slice(0, 40) });
      },
      count: function () { return groups.all().length; }
    },

    /* ---------- Activity ---------- */
    activity: {
      all: activity.all,
      add: function (type, text) {
        var a = activity.all(); a.unshift({ ts: Date.now(), type: type, text: text }); activity.save(a);
      },
      clear: function () { activity.save([]); }
    },

    /* ---------- Notifications ---------- */
    notes: {
      all: notes.all,
      add: function (title, text, lvl) {
        var a = notes.all(); a.unshift({ id: uid('NT'), ts: Date.now(), title: title, text: text || '', read: false, lvl: lvl || 'info' }); notes.save(a);
      },
      unread: function () { return notes.all().filter(function (n) { return !n.read; }).length; },
      markAllRead: function () { notes.save(notes.all().map(function (n) { n.read = true; return n; })); },
      clear: function () { notes.save([]); }
    },

    /* ---------- Statistics ---------- */
    stats: {
      KEYS: ['total', 'completed', 'failed', 'bug', 'bugGroup', 'banGroup', 'report', 'scan', 'osint', 'exploit'],
      get: function () {
        var o = S.getJSON('stats', null, isObj) || {};
        var out = { runs: [] };
        NGData.stats.KEYS.forEach(function (k) { out[k] = num(o[k]); });
        if (Array.isArray(o.runs)) out.runs = o.runs.filter(isObj).map(function (r) { return { ts: num(r.ts), kind: str(r.kind, 12), ok: !!r.ok }; }).slice(-120);
        return out;
      },
      /* kind: bug|bugGroup|banGroup|report|scan|osint|exploit */
      record: function (kind, ok) {
        var st = NGData.stats.get();
        st.total++; if (ok) st.completed++; else st.failed++;
        if (typeof st[kind] === 'number') st[kind]++;
        st.runs.push({ ts: Date.now(), kind: kind, ok: !!ok });
        st.runs = st.runs.slice(-120);
        S.setJSON('stats', st); emit('stats');
      },
      reset: function () { S.remove('stats'); emit('stats'); }
    },

    /* ---------- Settings ---------- */
    settings: {
      DEF: { particles: true, scanlines: true, glitch: true, sound: false, compact: false, reduce: false, speed: 'normal' },
      get: function () {
        var o = S.getJSON('settings', {}, isObj), d = NGData.settings.DEF, out = {};
        for (var k in d) out[k] = (typeof o[k] === typeof d[k]) ? o[k] : d[k];
        if (['slow', 'normal', 'fast'].indexOf(out.speed) < 0) out.speed = 'normal';
        if (typeof o.reduce !== 'boolean' && w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) out.reduce = true;
        return out;
      },
      set: function (k, v) { var s = NGData.settings.get(); s[k] = v; S.setJSON('settings', s); emit('settings'); },
      reset: function () { S.remove('settings'); emit('settings'); }
    },

    /* ---------- Session (hanya penanda lokal) ---------- */
    session: {
      active: function () { return S.get('session', '') === '1'; },
      start: function () {
        S.set('session', '1'); S.set('sessionStart', String(Date.now()));
        S.set('logins', String((parseInt(S.get('logins', '0'), 10) || 0) + 1));
      },
      end: function () { S.remove('session'); S.remove('authed'); S.remove('fails'); S.remove('lockUntil'); },
      startedAt: function () { var t = parseInt(S.get('sessionStart', '0'), 10); return t > 0 ? t : Date.now(); },
      logins: function () { return parseInt(S.get('logins', '0'), 10) || 0; }
    },

    seed: function () {
      if (!groups.exists()) {
        var seeds = [['NINJA SQUAD', ['NinjaUser01', 'ShadowUser02', 'CyberUser03', 'GhostUser04']], ['SHADOW TEAM', ['ShadowUser02', 'GhostUser04', 'VoidUser07']], ['CYBER LAB', ['CyberUser03', 'PixelUser05', 'NeonUser06', 'GlitchUser08', 'NinjaUser01']]];
        var arr = seeds.map(function (s) { return nGroup({ id: uid('GRP'), name: s[0], status: 'ACTIVE', members: s[1], log: [{ ts: Date.now(), text: 'Group created (local)' }], created: Date.now() }); });
        groups.save(arr);
      }
      if (!senders.exists()) {
        /* sender demo: nomor SENGAJA tidak valid (diawali 0 setelah kode negara) */
        NGData.senders.add({ name: 'Ninja Sender', cc: '+62', phone: '000000000001', profile: 'Ninja Profile', demo: true });
      }
    },

    /* tampilkan notifikasi untuk data yang dipulihkan otomatis */
    flushCorrupt: function () {
      var c = S.corrupt.splice(0, S.corrupt.length);
      if (!c.length) return;
      var seen = {};
      c.forEach(function (k) { if (seen[k]) return; seen[k] = 1; NGData.notes.add('DATA RECOVERED', 'Data "' + k + '" rusak dan direset otomatis.', 'warn'); });
      NGData.activity.add('SYSTEM', 'Corrupt local data recovered: ' + Object.keys(seen).join(', '));
    },

    resetAll: function (keepSession) {
      var keep = keepSession ? { s: S.get('session', null), t: S.get('sessionStart', null), l: S.get('logins', null) } : null;
      S.keys().forEach(function (k) { S.remove(k); });
      if (keep && keep.s) { S.set('session', keep.s); if (keep.t) S.set('sessionStart', keep.t); if (keep.l) S.set('logins', keep.l); }
      ['senders', 'groups', 'activity', 'notes', 'stats', 'settings'].forEach(emit);
    }
  };
  w.NGData = NGData;
})(window);
