/* NINJA GLITCH - home.js : DASHBOARD (Cyber Operations Center). Semua angka berasal dari data lokal / simulasi. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};
  function esc(s) { return NG.UI.esc(s); }

  NG.Pages.home = {
    _t: null, _sec: null, _vis: false,
    init: function (sec) {
      NG.Pages.home._sec = sec;
      var $ = function (s) { return sec.querySelector(s); };
      var m = { cpu: 34, mem: 52, net: 28 };

      function tiles() {
        var st = D.stats.get();
        var T = [['SIMULATIONS', st.total, 'p'], ['ACTIVE SENDERS', D.senders.count(), 'c'], ['GROUPS', D.groups.count(), 'g'], ['BUGS', st.bug + st.bugGroup, 'p'], ['REPORTS', st.report, 'c'], ['SCANS', st.scan, 'g']];
        $('#hmTiles').innerHTML = T.map(function (t) { return '<div class="stat ' + t[2] + '"><b>' + t[1] + '</b><small>' + t[0] + '</small></div>'; }).join('');
      }
      function sender() {
        var a = D.senders.active();
        $('#hmSender').innerHTML = a
          ? '<div class="act-sender"><div class="as-ico"><img data-asset="ninja" src="./assets/images/ninja.webp" alt="" width="44" height="44" decoding="async"></div><div class="as-main"><b>' + esc(a.name) + '</b><span class="mono dim">' + esc(D.maskPhone(a.cc, a.phone)) + '</span><small class="dim mono">' + a.sims + ' simulations</small></div><span class="badge-on">&#9679; ACTIVE</span></div>'
          : NG.UI.empty({ glyph: '?', title: 'NO ACTIVE SENDER', sub: 'Buat sender lokal untuk identitas simulasi.', action: 'new-sender', label: 'CREATE SENDER' });
        NG.Img.scan($('#hmSender'));
      }
      function recent() {
        var a = D.activity.all().slice(0, 6);
        $('#hmRecent').innerHTML = a.length ? a.map(function (x) { return '<li><span class="cy mono">[' + D.fmtTime(x.ts) + ']</span><span>' + esc(x.text) + '</span></li>'; }).join('') : '<li class="empty-li">NO ACTIVITY - run your first simulation</li>';
      }
      function notes() {
        var n = D.notes.all().slice(0, 3), u = D.notes.unread();
        $('#hmNoteBadge').textContent = u; $('#hmNoteBadge').hidden = !u;
        $('#hmNotes').innerHTML = n.length ? n.map(function (x) { return '<li class="' + x.lvl + '"><span class="nd"></span><div><b>' + esc(x.title) + '</b><small class="dim mono">' + esc(D.fmtTime(x.ts)) + '</small></div></li>'; }).join('') : '<li class="empty-li">No notifications</li>';
      }
      function simStatus() {
        var s = NG.Sim.state, box = $('#hmSim');
        $('#hmSimTitle').textContent = s.running ? s.label : (s.pct === 100 && s.label ? s.label : 'IDLE');
        var st = $('#hmSimSt'); st.textContent = s.running || s.label ? s.status : 'READY'; st.className = 'sim-st ' + NG.Sim.statusClass(st.textContent);
        $('#hmSimPct').textContent = (s.running || s.label ? s.pct : 0) + '%';
        $('#hmSimBar').style.width = (s.running || s.label ? s.pct : 0) + '%';
        $('#hmSimStop').hidden = !s.running;
        box.classList.toggle('is-running', s.running);
      }
      function sys() {
        function mv(v, lo, hi) { v += (Math.random() - .5) * 14; return Math.max(lo, Math.min(hi, v)); }
        m.cpu = mv(m.cpu, 10, 88); m.mem = mv(m.mem, 35, 80); m.net = mv(m.net, 5, 95);
        [['Cpu', m.cpu], ['Mem', m.mem], ['Net', m.net]].forEach(function (x) { var v = Math.round(x[1]); $('#hm' + x[0]).style.width = v + '%'; $('#hm' + x[0] + 'V').textContent = v + '%'; });
        $('#hmUp').textContent = NG.fmtDur(Date.now() - D.session.startedAt());
        var f = NG.Fps.value; $('#hmFps').textContent = f ? f + ' FPS' : '-- FPS';
      }
      function engine() {
        var s = D.settings.get(), imgs = NG.Img.status, ok = Object.keys(imgs).filter(function (k) { return imgs[k].ok; }).length, tot = NG.Img.assets.length;
        $('#hmEngine').innerHTML = '<li><span>Visual engine</span><b class="ok">ONLINE</b></li><li><span>Particles</span><b class="' + (s.particles && !s.reduce ? 'ok' : 'dim') + '">' + (s.particles && !s.reduce ? 'ON' : 'OFF') + '</b></li><li><span>Image loader</span><b class="' + (ok === tot ? 'ok' : Object.keys(imgs).length ? 'warn' : 'dim') + '">' + (Object.keys(imgs).length ? ok + '/' + tot + ' LOADED' : 'CHECKING') + '</b></li><li><span>Storage</span><b class="' + (NGStorage.available ? 'ok' : 'warn') + '">' + (NGStorage.available ? 'localStorage' : 'FALLBACK') + '</b></li>';
      }
      function modules() {
        var names = ['Bug Lab', 'Bug Group', 'Ban Group', 'Hack Lab', 'OSINT', 'Report', 'Network', 'Terminal', 'Sender', 'Group Lab'];
        $('#hmMods').innerHTML = names.map(function (n) { return '<span class="chip-s ok">&#9679; ' + n + '</span>'; }).join('');
      }
      function netinfo() {
        $('#hmSess').textContent = '1'; $('#hmLogins').textContent = D.session.logins();
        var o = w.navigator.onLine !== false; $('#hmOnline').textContent = o ? 'ONLINE (IDLE)' : 'OFFLINE'; $('#hmOnline').className = o ? 'ok' : 'warn';
      }
      NG.Pages.home._meters = sys;
      NG.Pages.home._all = function () { tiles(); sender(); recent(); notes(); simStatus(); engine(); netinfo(); sys(); };

      sec.querySelector('#hmSimStop').addEventListener('click', function () { NG.Sim.stop(); });
      sec.querySelector('#hmNewSender').addEventListener('click', function () { NG.Sender.openForm(); });
      sec.querySelector('#hmNewGroup').addEventListener('click', function () { NG.Group.openForm(); });
      ['stats', 'senders', 'groups'].forEach(function (e) { D.on(e, function () { if (NG.Pages.home._vis) { tiles(); sender(); } }); });
      D.on('activity', function () { if (NG.Pages.home._vis) recent(); });
      D.on('notes', function () { if (NG.Pages.home._vis) notes(); });
      D.on('settings', function () { if (NG.Pages.home._vis) engine(); });
      NG.Sim.on(function () { if (NG.Pages.home._vis) simStatus(); });
      modules();
      NG.Pages.home._all();
    },
    show: function () {
      var H = NG.Pages.home; H._vis = true;
      if (H._all) H._all();
      clearInterval(H._t);
      H._t = setInterval(function () { if (!d.hidden && H._meters) H._meters(); }, 2000);
    },
    hide: function () { var H = NG.Pages.home; H._vis = false; clearInterval(H._t); H._t = null; }
  };
  w.addEventListener('pagehide', function () { clearInterval(NG.Pages.home._t); });
})(window, document);
