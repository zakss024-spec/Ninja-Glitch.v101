/* NINJA GLITCH - hack.js : HACK LAB + EXPLOIT LAB.
 * 100% SIMULASI LOKAL. Hanya target FIKTIF (*.local / *.test / 192.0.2.x ...). Tidak ada request jaringan ke target.
 * Hasil dibangkitkan acak-deterministik di browser. Tidak ada exploit nyata. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData, S = w.NGStorage;
  NG.Pages = NG.Pages || {};
  function esc(s) { return NG.UI.esc(s); }

  var PORTS = [[21, 'FTP'], [22, 'SSH'], [25, 'SMTP'], [53, 'DNS'], [80, 'HTTP'], [110, 'POP3'], [143, 'IMAP'], [443, 'HTTPS'], [445, 'SMB'], [3306, 'MYSQL'], [3389, 'RDP'], [8080, 'HTTP-ALT']];
  var VULNS = [['Outdated service banner (simulated)', 'LOW'], ['Weak TLS configuration (simulated)', 'MEDIUM'], ['Directory listing enabled (simulated)', 'MEDIUM'], ['Default credential page (simulated)', 'HIGH'], ['Missing security headers (simulated)', 'LOW'], ['Verbose error messages (simulated)', 'LOW'], ['Open admin panel (simulated)', 'HIGH'], ['Unrestricted file upload form (simulated)', 'HIGH'], ['Session cookie without flags (simulated)', 'MEDIUM']];
  var OS = ['NinjaOS 7.2 (fake)', 'GlitchLinux 5.1 (fake)', 'VoidBSD 3.4 (fake)', 'NeonServer 2.0 (fake)'];
  var COMMON = ['password', '123456', '12345678', 'qwerty', 'admin', 'letmein', 'welcome', 'iloveyou', 'abc123', 'password1', 'glitch76', 'ninja67', 'ninja123'];

  /* ---------- generator hasil ---------- */
  NG.HackGen = {
    ports: function (t) {
      var r = NG.Fake.rng('ports:' + t);
      return PORTS.map(function (p) {
        var v = r(), st = (p[0] === 22 || p[0] === 80 || p[0] === 443) ? 'OPEN' : (v < .26 ? 'OPEN' : v < .46 ? 'FILTERED' : 'CLOSED');
        return { port: p[0], svc: p[1], state: st };
      });
    },
    vulns: function (t) {
      var r = NG.Fake.rng('vuln:' + t), n = NG.Fake.int(r, 3, 5), pool = VULNS.slice(), out = [];
      for (var i = 0; i < n && pool.length; i++) { var k = Math.floor(r() * pool.length), v = pool.splice(k, 1)[0]; out.push({ id: 'SIM-' + (2600 + NG.Fake.int(r, 1, 399)), name: v[0], sev: v[1] }); }
      return out;
    },
    profile: function (t) {
      var r = NG.Fake.rng('prof:' + t), open = NG.HackGen.ports(t).filter(function (p) { return p.state === 'OPEN'; }).length;
      return { host: t, os: NG.Fake.pick(r, OS), uptime: NG.Fake.int(r, 2, 400) + ' days', open: open, latency: NG.Fake.int(r, 8, 80) + 'ms', risk: NG.Fake.int(r, 12, 78), mac: [1, 2, 3].map(function () { return ('0' + NG.Fake.int(r, 0, 255).toString(16)).slice(-2).toUpperCase(); }).join(':') + ':XX:XX:XX' };
    },
    audit: function (pw) {
      var len = pw.length, pool = 0;
      if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/\d/.test(pw)) pool += 10; if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
      var bits = len && pool ? Math.round(len * Math.log(pool) / Math.LN2) : 0;
      var common = COMMON.indexOf(pw.toLowerCase()) > -1, rep = /(.)\1{2,}/.test(pw) || /(012|123|234|345|456|567|678|789|abc|qwe)/i.test(pw);
      var score = Math.max(0, Math.min(100, Math.round(bits * 1.1) - (common ? 60 : 0) - (rep ? 12 : 0)));
      var secs = Math.pow(2, Math.max(0, bits - 1)) / 1e10, t;
      if (common) t = 'instan (ada di daftar umum)'; else if (secs < 1) t = '< 1 detik'; else if (secs < 3600) t = Math.round(secs / 60 + 1) + ' menit'; else if (secs < 86400 * 365) t = Math.round(secs / 3600) + ' jam'; else if (secs < 86400 * 365 * 1000) t = Math.round(secs / 86400 / 365) + ' tahun'; else t = '> 1000 tahun';
      var tips = [];
      if (len < 12) tips.push('Gunakan minimal 12 karakter.'); if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw)) tips.push('Campur huruf besar & kecil.'); if (!/\d/.test(pw)) tips.push('Tambahkan angka.'); if (!/[^A-Za-z0-9]/.test(pw)) tips.push('Tambahkan simbol.'); if (common) tips.push('Hindari password umum.'); if (rep) tips.push('Hindari pola berulang/berurutan.');
      return { len: len, bits: bits, score: score, label: score < 25 ? 'VERY WEAK' : score < 45 ? 'WEAK' : score < 65 ? 'FAIR' : score < 85 ? 'GOOD' : 'STRONG', time: t, tips: tips };
    }
  };

  var sevCls = { LOW: 'ok', MEDIUM: 'warn', HIGH: 'bad', INFO: 'cy' };

  /* ======================= HACK LAB ======================= */
  NG.Pages.hack = {
    init: function (sec) {
      var mode = 'target', tgt = sec.querySelector('#hkTarget'), pass = sec.querySelector('#hkPass');
      var dl = sec.querySelector('#hkList'); dl.innerHTML = ['target.local', 'demo.local', '192.0.2.10', 'training.local'].map(function (t) { return '<option value="' + t + '">'; }).join('');
      var res = { target: sec.querySelector('#hkRes-target'), ports: sec.querySelector('#hkRes-ports'), vuln: sec.querySelector('#hkRes-vuln'), pass: sec.querySelector('#hkRes-pass') };
      NG.UI.tabs(sec, function (n) { mode = n; sec.querySelector('#hkTargetBox').hidden = (n === 'pass'); });
      sec.addEventListener('click', function (e) { var c = e.target.closest && e.target.closest('[data-preset]'); if (c) tgt.value = c.getAttribute('data-preset'); });

      var NAMES = { target: 'TARGET PROFILE', ports: 'PORT SCAN', vuln: 'VULNERABILITY SCAN', pass: 'PASSWORD AUDIT' };
      NG.SimPanel.bind(sec, {
        id: 'hack', kind: 'scan', statKey: 'scan', label: function () { return NAMES[mode] + ' SIMULATION'; }, logType: 'SCAN', startLabel: 'RUN SIMULATION',
        act: function (p) { return { type: 'SCAN', start: p.name + ' SIMULATION STARTED', done: p.name + ' SIMULATION COMPLETE', stop: p.name + ' SIMULATION STOPPED' }; },
        notif: function (p) { return { title: 'SCAN COMPLETE', text: p.name + ' selesai (data fiktif lokal).' }; },
        doneText: function (p) { return p.name + ' SIMULATION COMPLETE'; },
        sender: false,
        collect: function () {
          var t = (tgt.value || '').trim().toLowerCase(), pw = pass.value;
          if (mode === 'pass') { if (!pw) return { ok: false, msg: 'Isi demo password (tidak disimpan / dikirim)' }; return { ok: true, params: { mode: mode, name: NAMES[mode], len: pw.length, pw: pw } }; }
          if (!NG.Fake.validTarget(t)) return { ok: false, msg: 'Hanya target fiktif: *.local, *.test, 192.0.2.x, 198.51.100.x, 203.0.113.x, 192.168.x.x' };
          return { ok: true, params: { mode: mode, name: NAMES[mode], t: t } };
        },
        duration: function (p) { return p.mode === 'ports' ? 5200 : 4400; },
        onDone: function (ok, p) {
          if (!p) return;
          var pw = p.pw;
          if (p.mode === 'pass') { pass.value = ''; p.pw = ''; }     // jangan menyimpan password
          if (!ok) return;
          var box = res[p.mode], h = '<div class="sim-tag">SIMULATED RESULT</div>';
          if (p.mode === 'target') {
            var f = NG.HackGen.profile(p.t);
            h += '<ul class="kv"><li><span>Host</span><b>' + esc(f.host) + '</b></li><li><span>OS (fake)</span><b>' + esc(f.os) + '</b></li><li><span>Uptime</span><b>' + esc(f.uptime) + '</b></li><li><span>Open ports</span><b>' + f.open + '</b></li><li><span>Latency</span><b>' + esc(f.latency) + '</b></li><li><span>Risk score</span><b class="' + (f.risk > 60 ? 'bad' : f.risk > 35 ? 'warn' : 'ok') + '">' + f.risk + '/100</b></li></ul>';
          } else if (p.mode === 'ports') {
            h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>PORT</th><th>STATE</th><th>SERVICE</th></tr></thead><tbody>' + NG.HackGen.ports(p.t).map(function (x) { return '<tr><td class="mono">' + x.port + '</td><td><span class="chip-s ' + (x.state === 'OPEN' ? 'ok' : x.state === 'FILTERED' ? 'warn' : 'off') + '">' + x.state + '</span></td><td class="mono">' + x.svc + '</td></tr>'; }).join('') + '</tbody></table></div>';
          } else if (p.mode === 'vuln') {
            h += '<ul class="finds">' + NG.HackGen.vulns(p.t).map(function (v) { return '<li><span class="chip-s ' + sevCls[v.sev] + '">' + v.sev + '</span><div><b>' + esc(v.name) + '</b><small class="dim mono">' + v.id + ' &middot; ' + esc(p.t) + '</small></div></li>'; }).join('') + '</ul>';
          } else {
            var a = NG.HackGen.audit(pw);
            h += '<div class="gauge-row"><div class="gauge" style="--v:' + a.score + '"><b>' + a.score + '</b></div><div><b class="' + (a.score < 45 ? 'bad' : a.score < 65 ? 'warn' : 'ok') + '">' + a.label + '</b><p class="dim mono">' + a.len + ' char &middot; ~' + a.bits + ' bit &middot; est. crack: ' + esc(a.time) + ' (simulated)</p></div></div>' + (a.tips.length ? '<ul class="tips">' + a.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '<p class="ok mono">No weaknesses found.</p>');
          }
          box.innerHTML = h;
        },
        stages: function (p) {
          var T = p.t || 'demo-password';
          var m = {
            target: [['INITIALIZING', ['Resolving fictional target ' + T + ' (no DNS query)...', 'Opening virtual session...']], ['PROCESSING', ['Collecting fake banner data...', 'Estimating virtual latency...']], ['SIMULATING', ['Building profile card...', 'Computing local risk score...']]],
            ports: [['INITIALIZING', ['Target (fictional): ' + T, 'Loading port list (' + PORTS.length + ' ports)...']], ['PROCESSING', ['Simulating SYN sweep (no packets sent)...']], ['SIMULATING', ['PORT 22 -> OPEN (SSH) [fake]', 'PORT 80 -> OPEN (HTTP) [fake]', 'PORT 443 -> OPEN (HTTPS) [fake]', 'Compiling local table...']]],
            vuln: [['INITIALIZING', ['Loading fake signature set...', 'Target (fictional): ' + T]], ['PROCESSING', ['Matching fake signatures (local)...']], ['SIMULATING', ['Scoring simulated findings...', 'Building report card...']]],
            pass: [['INITIALIZING', ['Evaluating demo password (masked, local only)...', 'Length: ' + p.len]], ['PROCESSING', ['Checking character classes...', 'Comparing with common-list (local)...']], ['SIMULATING', ['Estimating entropy...', 'Estimating simulated crack time...']]]
          }[p.mode];
          return [{ at: 0, status: m[0][0], lines: m[0][1] }, { at: 28, status: m[1][0], lines: m[1][1] }, { at: 56, status: m[2][0], lines: m[2][1] }];
        }
      });
    },
    show: function () { /* sinkron */ }
  };

  /* ======================= EXPLOIT LAB ======================= */
  var CH = [
    { id: '001', target: 'training.local', vuln: 'Fake Authentication Bypass', diff: 'EASY', pts: 100 },
    { id: '002', target: 'lab.local', vuln: 'Fake Input Validation Flaw', diff: 'MEDIUM', pts: 200 },
    { id: '003', target: 'sandbox.local', vuln: 'Fake Session Token Weakness', diff: 'HARD', pts: 300 }
  ];
  NG.Pages.exploit = {
    init: function (sec) {
      var list = sec.querySelector('#exList'), score = sec.querySelector('#exScore'), sel = null;
      function done() { var a = S.getJSON('exploitDone', [], Array.isArray); return a; }
      function draw() {
        var dn = done(), pts = 0;
        CH.forEach(function (c) { if (dn.indexOf(c.id) > -1) pts += c.pts; });
        score.textContent = pts + ' PTS - ' + dn.length + '/' + CH.length + ' CLEARED';
        list.innerHTML = CH.map(function (c) {
          var ok = dn.indexOf(c.id) > -1;
          return '<article class="card chal' + (sel === c.id ? ' sel' : '') + '"><header><div><small class="dim mono">CHALLENGE #' + c.id + '</small><b>' + esc(c.vuln) + '</b></div><span class="chip-s ' + (c.diff === 'EASY' ? 'ok' : c.diff === 'MEDIUM' ? 'warn' : 'bad') + '">' + c.diff + '</span></header>' +
            '<div class="grp-meta mono"><span>TARGET <b>' + esc(c.target) + '</b></span><span><b>' + c.pts + '</b> PTS</span></div><footer><button class="btn sm" type="button" data-ch="' + c.id + '">' + (ok ? 'REPLAY' : 'START CHALLENGE') + '</button>' + (ok ? '<span class="chip-s ok">&#10003; CLEARED</span>' : '') + '</footer></article>';
        }).join('');
      }
      var startBtn = sec.querySelector('[data-sim="start"]');
      list.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-ch]'); if (!b) return;
        if (NG.Sim.state.running) { NG.UI.toast('Simulasi lain sedang berjalan'); return; }
        sel = b.getAttribute('data-ch'); draw(); startBtn.click();
      });
      NG.SimPanel.bind(sec, {
        id: 'exploit', kind: 'exploit', statKey: 'exploit', label: 'EXPLOIT LAB CHALLENGE', logType: 'EXPLOIT', startLabel: 'START CHALLENGE', sender: false,
        act: function (p) { return { type: 'EXPLOIT', start: 'CHALLENGE #' + p.c.id + ' STARTED (SIM)', done: 'CHALLENGE #' + p.c.id + ' COMPLETE (SIM)', stop: 'CHALLENGE #' + p.c.id + ' STOPPED' }; },
        notif: function (p) { return { title: 'CHALLENGE COMPLETE', text: 'Challenge #' + p.c.id + ' selesai (sandbox fiktif).' }; },
        doneText: function (p) { return 'CHALLENGE #' + p.c.id + ' COMPLETE'; },
        collect: function () {
          var c = CH.filter(function (x) { return x.id === sel; })[0];
          if (!c) return { ok: false, msg: 'Pilih challenge dulu' };
          return { ok: true, params: { c: c } };
        },
        duration: function (p) { return { EASY: 5000, MEDIUM: 6200, HARD: 7400 }[p.c.diff]; },
        onDone: function (ok, p) {
          if (ok && p) { var dn = done(); if (dn.indexOf(p.c.id) < 0) { dn.push(p.c.id); S.setJSON('exploitDone', dn); } }
          draw();
        },
        stages: function (p) {
          var c = p.c;
          return [
            { at: 0, status: 'LOADING SANDBOX', lines: ['Booting sandbox VM (virtual)...', 'Target: ' + c.target + ' (fictional training host)'] },
            { at: 24, status: 'ANALYZING', lines: ['Mapping fake login flow...', 'Flagged scenario: ' + c.vuln] },
            { at: 50, status: 'SIMULATING', lines: ['Replaying scripted scenario - NOT a real exploit', 'Scenario step 1/3 ok (simulated)', 'Scenario step 2/3 ok (simulated)', 'Scenario step 3/3 ok (simulated)'] },
            { at: 82, status: 'REPORTING', lines: ['Flag captured: FLAG{NINJA_SIM_' + c.id + '}', 'Challenge score: +' + c.pts] }
          ];
        }
      });
      draw();
    },
    show: function () { /* sinkron */ }
  };
})(window, document);
