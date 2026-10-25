/* NINJA GLITCH - osint.js : OSINT LAB (SIMULASI). Hasil 100% FIKTIF & acak-deterministik dari teks yang diketik.
 * Tidak ada pencarian nyata, tidak ada request jaringan, tidak ada data tentang orang nyata. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};
  function esc(s) { return NG.UI.esc(s); }

  var PLATFORMS = ['NeonGram', 'GlitchBook', 'CyberTube', 'NinjaForum', 'VoidChat', 'PixelHub', 'ShadowBoard'];
  var REGIONS = ['NEON-REGION-1', 'CYBER-GRID-7', 'VOID-ZONE-3', 'SHADOW-SECTOR-9', 'PIXEL-BAY-2'];
  var EVENTS = ['Profile created (fake)', 'Password rotated (fake)', 'New device seen (fake)', 'Bio updated (fake)', 'Login from {r} (fake)', 'Session expired (fake)'];

  function gen(v) {
    var r = NG.Fake.rng('osint:' + [v.user, v.domain, v.email, v.ip].join('|'));
    var out = { risk: NG.Fake.int(r, 5, 92), region: NG.Fake.pick(r, REGIONS), sections: [] };
    if (v.user) {
      var hits = PLATFORMS.map(function (p) { return { p: p, f: r() > .42, h: '@' + v.user.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 14) + (r() > .6 ? NG.Fake.int(r, 1, 99) : '') }; });
      out.sections.push({ t: 'USERNAME', rows: [['Query', v.user], ['Platform matches', hits.filter(function (x) { return x.f; }).length + '/' + PLATFORMS.length]], list: hits });
    }
    if (v.domain) out.sections.push({ t: 'DOMAIN INFO', rows: [['Domain', v.domain], ['Registrar', 'Demo Registrar (fake)'], ['Created', String(NG.Fake.int(r, 2008, 2024))], ['Nameservers', 'ns1.demo.local, ns2.demo.local'], ['Status', 'clientTransferProhibited (fake)']] });
    if (v.email) out.sections.push({ t: 'DEMO EMAIL', rows: [['Address', v.email], ['Format', 'VALID'], ['MX', 'mx.demo.local (fake)'], ['Simulated exposure count', String(NG.Fake.int(r, 0, 3))]] });
    if (v.ip) out.sections.push({ t: 'DEMO IP', rows: [['Address', v.ip], ['Region (fake)', out.region], ['ASN (fake)', 'AS-FAKE' + NG.Fake.int(r, 100, 999)], ['Type (fake)', NG.Fake.pick(r, ['Datacenter', 'Residential', 'Mobile'])]] });
    out.activity = [0, 1, 2, 3].map(function (i) { return { d: NG.Fake.int(r, 1, 28) + ' days ago', e: NG.Fake.pick(r, EVENTS).replace('{r}', out.region) }; });
    return out;
  }

  NG.OsintGen = gen;

  NG.Pages.osint = {
    init: function (sec) {
      var el = { u: sec.querySelector('#osUser'), d: sec.querySelector('#osDomain'), e: sec.querySelector('#osEmail'), i: sec.querySelector('#osIp') }, res = sec.querySelector('#osRes');
      function vals() { return { user: el.u.value.trim(), domain: el.d.value.trim().toLowerCase(), email: el.e.value.trim().toLowerCase(), ip: el.i.value.trim() }; }
      NG.SimPanel.bind(sec, {
        id: 'osint', kind: 'osint', statKey: 'osint', label: 'OSINT SIMULATION', logType: 'OSINT', startLabel: 'RUN OSINT SIMULATION', sender: false,
        act: { type: 'OSINT', start: 'OSINT SIMULATION STARTED', done: 'OSINT SIMULATION COMPLETE', stop: 'OSINT SIMULATION STOPPED' },
        notif: { title: 'OSINT SIMULATION COMPLETE', text: 'OSINT simulation selesai (hasil fiktif).' },
        doneText: 'OSINT SIMULATION COMPLETE',
        collect: function () {
          var v = vals(), err = '';
          if (!v.user && !v.domain && !v.email && !v.ip) return { ok: false, msg: 'Isi minimal satu field demo' };
          if (v.user && !/^[A-Za-z0-9_.-]{2,24}$/.test(v.user)) err = 'Username: 2-24 karakter (huruf/angka/_ . -)';
          else if (v.domain && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)+$/.test(v.domain)) err = 'Format domain tidak valid';
          else if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) err = 'Format email tidak valid';
          else if (v.ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(v.ip)) err = 'Format IPv4 tidak valid';
          else if (v.ip && v.ip.split('.').some(function (n) { return +n > 255; })) err = 'Oktet IP maks 255';
          if (err) return { ok: false, msg: err };
          res.innerHTML = '';
          return { ok: true, params: v };
        },
        duration: function () { return 5000; },
        onDone: function (ok, v) {
          if (!ok || !v) return;
          var g = gen(v), h = '<div class="sim-tag">SIMULATED RESULT</div><p class="dim mono small">Data fiktif acak - bukan hasil pencarian nyata.</p>';
          h += '<div class="os-top"><div><small class="dim mono">REGION</small><b>' + esc(g.region) + '</b></div><div><small class="dim mono">RISK SCORE</small><b class="' + (g.risk > 65 ? 'bad' : g.risk > 35 ? 'warn' : 'ok') + '">' + g.risk + '/100</b></div></div>';
          g.sections.forEach(function (s) {
            h += '<section class="os-sec"><h4>' + s.t + '</h4><ul class="kv">' + s.rows.map(function (r) { return '<li><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></li>'; }).join('') + '</ul>';
            if (s.list) h += '<div class="plat">' + s.list.map(function (x) { return '<span class="chip-s ' + (x.f ? 'ok' : 'off') + '">' + esc(x.p) + (x.f ? ' ' + esc(x.h) : '') + '</span>'; }).join('') + '</div>';
            h += '</section>';
          });
          h += '<section class="os-sec"><h4>ACTIVITY (FAKE)</h4><ul class="feed">' + g.activity.map(function (a) { return '<li><span class="cy mono">' + esc(a.d) + '</span><span>' + esc(a.e) + '</span></li>'; }).join('') + '</ul></section>';
          res.innerHTML = h;
        },
        stages: function (v) {
          return [
            { at: 0, status: 'INITIALIZING', lines: ['Loading fake data engine...', 'Inputs received (kept local, never sent)'] },
            { at: 28, status: 'PROCESSING', lines: [v.user ? 'Matching fake platforms for username...' : 'Skipping username', v.domain ? 'Generating fake WHOIS-like record...' : 'Skipping domain'] },
            { at: 56, status: 'SIMULATING', lines: [v.email ? 'Building fake email profile...' : 'Skipping email', v.ip ? 'Assigning fake region to IP...' : 'Skipping IP', 'Computing simulated risk score...'] }
          ];
        }
      });
    },
    show: function () { /* sinkron */ }
  };
})(window, document);
