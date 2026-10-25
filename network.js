/* NINJA GLITCH - network.js : NETWORK LAB (SIMULASI). Perangkat, port, ping, dan traffic semuanya DATA FIKTIF acak.
 * Tidak ada scan jaringan nyata, tidak ada request ke perangkat mana pun. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};
  function esc(s) { return NG.UI.esc(s); }

  var VENDORS = ['NeonCorp', 'GlitchTech', 'VoidWare', 'PixelNet', 'CyberDyn'];
  var TYPES = ['Laptop', 'Phone', 'Router', 'Camera', 'TV', 'Console'];
  var SVC = [[22, 'SSH'], [53, 'DNS'], [80, 'HTTP'], [443, 'HTTPS'], [8080, 'ALT']];

  NG.NetGen = {
    devices: function (n) {
      var r = NG.Fake.rng('net-devices'), out = [];
      for (var i = 0; i < (n || 6); i++) {
        var st = i < 2 ? 'ONLINE' : (r() > .8 ? 'OFFLINE' : (r() > .75 ? 'IDLE' : 'ONLINE'));
        out.push({ name: 'DEVICE-' + ('0' + (i + 1)).slice(-2), ip: '192.168.0.' + (101 + i), status: st, ms: i === 0 ? 23 : i === 1 ? 41 : NG.Fake.int(r, 5, 120), vendor: NG.Fake.pick(r, VENDORS), type: NG.Fake.pick(r, TYPES), ports: SVC.map(function (s) { return r() > .55; }) });
      }
      return out;
    }
  };

  NG.Pages.network = {
    init: function (sec) {
      var mode = 'scan', devs = null;
      var rScan = sec.querySelector('#nwRes-scan'), rMap = sec.querySelector('#nwRes-map'), rPing = sec.querySelector('#nwRes-ping');
      var simBox = sec.querySelector('#nwSimBox'), pingBox = sec.querySelector('#nwPingBox'), pTarget = sec.querySelector('#nwPingTarget'), pCount = sec.querySelector('#nwPingCount');
      var cv = sec.querySelector('#nwCanvas'), rxEl = sec.querySelector('#nwRx'), txEl = sec.querySelector('#nwTx');
      pCount.innerHTML = [4, 8].map(function (n) { return '<option value="' + n + '">' + n + ' packets (simulated)</option>'; }).join('');

      function drawScan() {
        if (!devs) { rScan.innerHTML = NG.UI.empty({ glyph: '?', title: 'NO SCAN YET', sub: 'Tekan RUN SIMULATION untuk membuat daftar perangkat fiktif.' }); return; }
        rScan.innerHTML = '<div class="sim-tag">SIMULATED RESULT</div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>DEVICE</th><th>IP</th><th>STATUS</th><th>PING</th></tr></thead><tbody>' +
          devs.map(function (x) { return '<tr><td class="mono"><b>' + x.name + '</b><br><small class="dim">' + esc(x.vendor + ' ' + x.type) + '</small></td><td class="mono">' + x.ip + '</td><td><span class="chip-s ' + (x.status === 'ONLINE' ? 'ok' : x.status === 'IDLE' ? 'warn' : 'off') + '">' + x.status + '</span></td><td class="mono">' + (x.status === 'OFFLINE' ? '--' : x.ms + 'ms') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      function drawMap() {
        if (!devs) { rMap.innerHTML = NG.UI.empty({ glyph: '?', title: 'NO PORT MAP YET', sub: 'Jalankan DEVICE SCANNER dulu.', action: null }); return; }
        rMap.innerHTML = '<div class="tbl-wrap"><table class="tbl pmap"><thead><tr><th>DEVICE</th>' + SVC.map(function (s) { return '<th>' + s[0] + '</th>'; }).join('') + '</tr></thead><tbody>' +
          devs.map(function (x) { return '<tr><td class="mono">' + x.name + '</td>' + x.ports.map(function (o) { return '<td><i class="dot-p ' + (o && x.status !== 'OFFLINE' ? 'on' : '') + '" aria-label="' + (o ? 'open' : 'closed') + '"></i></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><p class="dim mono small">&#9679; open (fake) &nbsp; &#9675; closed</p>';
      }
      function fillTargets() {
        var o = (devs || []).filter(function (x) { return x.status !== 'OFFLINE'; }).map(function (x) { return x.ip; }).concat(['demo.local', 'target.local']);
        pTarget.innerHTML = o.map(function (t) { return '<option>' + t + '</option>'; }).join('');
      }

      /* ---- traffic monitor (ringan, 1 detik, berhenti saat tidak terlihat) ---- */
      var rx = [], tx = [], tmr = null, ctx = null;
      for (var i = 0; i < 40; i++) { rx.push(30 + Math.random() * 20); tx.push(15 + Math.random() * 15); }
      function walk(a, lo, hi) { var v = a[a.length - 1] + (Math.random() - .5) * 18; a.push(Math.max(lo, Math.min(hi, v))); if (a.length > 40) a.shift(); }
      function paint() {
        if (!cv) return;
        ctx = ctx || cv.getContext('2d'); if (!ctx) return;
        var W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(168,85,247,.18)'; ctx.lineWidth = 1;
        for (var g = 1; g < 4; g++) { ctx.beginPath(); ctx.moveTo(0, H * g / 4); ctx.lineTo(W, H * g / 4); ctx.stroke(); }
        [[rx, '#22d3ee'], [tx, '#4ade80']].forEach(function (s) {
          ctx.beginPath(); ctx.strokeStyle = s[1]; ctx.lineWidth = 2;
          s[0].forEach(function (v, k) { var x = k / 39 * W, y = H - v / 100 * H; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
          ctx.stroke();
        });
        rxEl.textContent = Math.round(rx[rx.length - 1] * 12) + ' KB/s'; txEl.textContent = Math.round(tx[tx.length - 1] * 12) + ' KB/s';
      }
      function tick() { walk(rx, 5, 98); walk(tx, 3, 70); paint(); }
      function startTraffic() { if (tmr || d.hidden) return; paint(); tmr = setInterval(tick, 1000); }
      function stopTraffic() { if (tmr) { clearInterval(tmr); tmr = null; } }
      NG.Pages.network._start = startTraffic; NG.Pages.network._stop = stopTraffic;
      d.addEventListener('visibilitychange', function () { if (d.hidden) stopTraffic(); else if (mode === 'traffic' && NG.Nav.current === 'network') startTraffic(); });

      NG.UI.tabs(sec, function (n) {
        mode = n;
        simBox.hidden = !(n === 'scan' || n === 'ping'); pingBox.hidden = n !== 'ping';
        if (n === 'map') drawMap();
        if (n === 'ping') fillTargets();
        if (n === 'traffic') startTraffic(); else stopTraffic();
      });

      NG.SimPanel.bind(sec, {
        id: 'network', kind: 'scan', statKey: 'scan', sender: false, label: function () { return mode === 'ping' ? 'PING SIMULATION' : 'DEVICE SCAN SIMULATION'; }, logType: 'SCAN', startLabel: 'RUN SIMULATION',
        act: function (p) { var n = p.mode === 'ping' ? 'PING' : 'DEVICE SCAN'; return { type: 'SCAN', start: n + ' SIMULATION STARTED', done: n + ' SIMULATION COMPLETE', stop: n + ' SIMULATION STOPPED' }; },
        notif: function (p) { return { title: 'SCAN COMPLETE', text: (p.mode === 'ping' ? 'Ping' : 'Device scan') + ' simulation selesai (data fiktif).' }; },
        doneText: function (p) { return (p.mode === 'ping' ? 'PING' : 'DEVICE SCAN') + ' SIMULATION COMPLETE'; },
        collect: function () {
          if (mode === 'ping') { var t = pTarget.value; if (!t) return { ok: false, msg: 'Pilih target fiktif' }; return { ok: true, params: { mode: 'ping', t: t, n: parseInt(pCount.value, 10) || 4 } }; }
          return { ok: true, params: { mode: 'scan' } };
        },
        duration: function (p) { return p.mode === 'ping' ? 3500 + p.n * 250 : 5000; },
        onDone: function (ok, p) {
          if (!ok || !p) return;
          if (p.mode === 'scan') { devs = NG.NetGen.devices(6); drawScan(); drawMap(); fillTargets(); }
          else {
            var r = NG.Fake.rng('ping:' + p.t + ':' + Date.now()), ms = [], lost = 0;
            for (var i = 0; i < p.n; i++) { if (r() < .06) lost++; else ms.push(NG.Fake.int(r, 12, 90)); }
            var avg = ms.length ? Math.round(ms.reduce(function (a, b) { return a + b; }, 0) / ms.length) : 0;
            rPing.innerHTML = '<div class="sim-tag">SIMULATED RESULT</div><ul class="kv"><li><span>Target (fictional)</span><b>' + esc(p.t) + '</b></li><li><span>Sent / lost</span><b>' + p.n + ' / ' + lost + '</b></li><li><span>Min / avg / max</span><b>' + (ms.length ? Math.min.apply(null, ms) + ' / ' + avg + ' / ' + Math.max.apply(null, ms) + ' ms' : '--') + '</b></li></ul>';
          }
        },
        stages: function (p) {
          if (p.mode === 'ping') {
            var L = []; for (var i = 1; i <= p.n; i++) L.push('Reply from ' + p.t + ': seq=' + i + ' time=' + (12 + (i * 17) % 60) + 'ms (simulated)');
            return [{ at: 0, status: 'INITIALIZING', lines: ['Preparing virtual ping to ' + p.t + ' (no packets sent)'] }, { at: 20, status: 'PROCESSING', lines: L }, { at: 90, status: 'FINALIZING', lines: ['Computing statistics...'] }];
          }
          return [{ at: 0, status: 'INITIALIZING', lines: ['Loading fake LAN 192.168.0.0/24 (virtual)'] }, { at: 25, status: 'PROCESSING', lines: ['DEVICE-01 192.168.0.101 ONLINE 23ms [fake]', 'DEVICE-02 192.168.0.102 ONLINE 41ms [fake]', 'Generating more virtual devices...'] }, { at: 70, status: 'FINALIZING', lines: ['Compiling local device table...'] }];
        }
      });
      drawScan(); drawMap();
    },
    show: function (sec) { if (sec.querySelector('.tabs .active') && sec.querySelector('.tabs .active').getAttribute('data-tab') === 'traffic' && NG.Pages.network._start) NG.Pages.network._start(); },
    hide: function () { if (NG.Pages.network._stop) NG.Pages.network._stop(); }
  };
})(window, document);
