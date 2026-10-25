/* NINJA GLITCH - terminal.js : Cyber Terminal SIMULASI. Hanya perintah lokal yang sudah ditentukan (whitelist).
 * TIDAK menjalankan shell/OS command, tidak ada eval, tidak ada jaringan. Output = teks JavaScript lokal. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};

  NG.Pages.terminal = {
    init: function (sec) {
      var out = sec.querySelector('#tmOut'), inp = sec.querySelector('#tmIn'), form = sec.querySelector('#tmForm');
      var queue = [], busy = false, skip = false, timer = null, hist = [], hi = 0;

      function pump() {
        if (busy) return;
        var it = queue.shift(); if (!it) return;
        busy = true;
        var ln = d.createElement('div'); ln.className = 'tl ' + (it.cls || '') + ' typing'; out.appendChild(ln);
        while (out.childNodes.length > 260) out.removeChild(out.firstChild);
        var txt = it.text, i = 0;
        function step() {
          if (skip) { ln.textContent = txt; fin(); return; }
          i += 3; ln.textContent = txt.slice(0, i);
          out.scrollTop = out.scrollHeight;
          if (i >= txt.length) { fin(); return; }
          timer = setTimeout(step, 12);
        }
        function fin() { ln.textContent = txt; ln.classList.remove('typing'); out.scrollTop = out.scrollHeight; busy = false; if (!queue.length) skip = false; pump(); }
        step();
      }
      function print(text, cls) { String(text).split('\n').forEach(function (t) { queue.push({ text: t, cls: cls }); }); pump(); }
      function reset() { clearTimeout(timer); queue = []; busy = false; skip = false; out.textContent = ''; }
      out.addEventListener('click', function () { if (busy || queue.length) skip = true; });

      var activeT = 'target.local';
      var CMDS = {
        help: function () { return ['Available commands (local simulation only):', '  help      show this list', '  scan [t]  simulated port scan (fictional target)', '  status    system & session status', '  modules   list modules', '  network   fake LAN devices', '  osint [u] fake OSINT summary (demo username)', '  report    report simulation summary', '  bug       bug simulation summary', '  group     list fake groups', '  open <m>  open a module (e.g. open bug)', '  clear     clear screen']; },
        modules: function () { return Object.keys(NG.Nav.routes).map(function (k) { return '  [ONLINE] ' + k.padEnd(11) + NG.Nav.routes[k].title; }); },
        status: function () {
          var st = D.stats.get(), a = D.senders.active();
          return ['SYSTEM ONLINE | LOCAL SIMULATION | ENGINE READY', 'Session time : ' + Math.floor((Date.now() - D.session.startedAt()) / 60000) + ' min', 'Simulations  : ' + st.total + ' (ok ' + st.completed + ' / failed ' + st.failed + ')', 'Active sender: ' + (a ? a.name + ' ' + D.maskPhone(a.cc, a.phone) : 'NONE'), 'Groups       : ' + D.groups.count(), 'FPS          : ' + (NG.Fps && NG.Fps.value ? NG.Fps.value : '--'), 'External requests: NONE'];
        },
        network: function () { return ['DEVICE      IP               STATUS   PING'].concat(NG.NetGen.devices(6).map(function (x) { return (x.name + '   ').slice(0, 10) + '  ' + (x.ip + '            ').slice(0, 15) + '  ' + (x.status + '   ').slice(0, 7) + '  ' + (x.status === 'OFFLINE' ? '--' : x.ms + 'ms'); })).concat(['(simulated data)']); },
        group: function () { var g = D.groups.all(); return g.length ? g.map(function (x) { return '  ' + x.id + '  ' + x.name.padEnd(14) + x.members.length + ' members  ' + x.status; }) : ['NO GROUPS YET - open group to create one']; },
        bug: function () { var st = D.stats.get(); return ['Bug simulations      : ' + st.bug, 'Bug group simulations: ' + st.bugGroup, 'Ban group simulations: ' + st.banGroup, 'Use "open bug" to launch BUG LAB (visual simulation only).']; },
        report: function () { var st = D.stats.get(); return ['Report simulations: ' + st.report, 'No reports are ever sent. Use "open report".']; },
        history: function () { return hist.length ? hist.map(function (h, i) { return '  ' + (i + 1) + '  ' + h; }) : ['(empty)']; },
        about: function () { return ['NINJA GLITCH - Cyber Operations Center', 'Local simulation only. Developers: ZAKSS / DAKA / NATHAN']; }
      };
      function run(raw) {
        var line = raw.trim(); if (!line) return;
        hist.push(line); if (hist.length > 40) hist.shift(); hi = hist.length;
        print('ninja@local:~$ ' + line, 'cmd');
        var p = line.split(/\s+/), c = p[0].toLowerCase(), arg = (p[1] || '').toLowerCase();
        if (c === 'clear') { reset(); return; }
        if (c === 'scan') {
          var t = arg || activeT;
          if (!NG.Fake.validTarget(t)) { print('error: only fictional targets (*.local, 192.0.2.x ...) are allowed', 'err'); return; }
          activeT = t;
          print('Simulating scan on ' + t + ' (no packets sent)...');
          NG.HackGen.ports(t).filter(function (x) { return x.state === 'OPEN'; }).forEach(function (x) { print('  PORT ' + String(x.port).padEnd(5) + 'OPEN  ' + x.svc, 'ok'); });
          print('Scan simulation complete.', 'ok');
          D.stats.record('scan', true); D.activity.add('SCAN', 'TERMINAL SCAN SIMULATION: ' + t);
          return;
        }
        if (c === 'osint') {
          var u = (p[1] || 'demo_user').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 24) || 'demo_user';
          var g = NG.OsintGen({ user: u, domain: '', email: '', ip: '' });
          print('SIMULATED RESULT for "' + u + '" (fake data)');
          print('  platform matches : ' + g.sections[0].rows[1][1]); print('  region (fake)    : ' + g.region); print('  risk score       : ' + g.risk + '/100');
          D.stats.record('osint', true); D.activity.add('OSINT', 'TERMINAL OSINT SIMULATION: ' + u);
          return;
        }
        if (c === 'open') {
          if (NG.Nav.routes[arg]) { print('opening ' + arg + '...', 'ok'); setTimeout(function () { NG.Nav.go(arg); }, 450); } else print('usage: open <module>  (type "modules")', 'err');
          return;
        }
        if (CMDS[c]) { print(CMDS[c]().join('\n')); return; }
        print('command not found: ' + c.slice(0, 24) + '  (simulation shell - type "help")', 'err');
      }

      form.addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value; inp.value = ''; run(v); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp' && hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; }
        else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; }
      });
      sec.querySelector('#tmChips').addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-cmd]'); if (b) run(b.getAttribute('data-cmd'));
      });
      print('NINJA GLITCH TERMINAL v1.0 - local simulation shell', 'ok');
      print('No OS commands are executed. Type "help".');
    },
    show: function (sec) { /* tidak auto-fokus agar keyboard HP tidak langsung muncul */ },
    hide: function () { /* antrean ketik berhenti sendiri */ }
  };
})(window, document);
