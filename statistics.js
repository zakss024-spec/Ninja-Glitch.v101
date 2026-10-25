/* NINJA GLITCH - statistics.js : STATISTICS (kartu + mini chart HTML/CSS/JS, tanpa library). Semua dari data lokal. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};
  function esc(s) { return NG.UI.esc(s); }
  function z(n) { return (n < 10 ? '0' : '') + n; }
  function dur(ms) { var s = Math.floor(ms / 1000); return z(Math.floor(s / 3600)) + ':' + z(Math.floor(s % 3600 / 60)) + ':' + z(s % 60); }
  NG.fmtDur = dur;

  var KINDS = [['bug', 'BUG', 'cy'], ['bugGroup', 'BUG GROUP', 'p'], ['banGroup', 'BAN GROUP', 'g'], ['report', 'REPORT', 'cy'], ['scan', 'SCAN', 'p'], ['osint', 'OSINT', 'g'], ['exploit', 'EXPLOIT', 'cy']];

  function render(sec) {
    var st = D.stats.get();
    var tiles = [
      ['TOTAL SIMULATIONS', st.total, 'big'], ['BUG SIMULATIONS', st.bug], ['BUG GROUP SIMULATIONS', st.bugGroup], ['BAN GROUP SIMULATIONS', st.banGroup],
      ['REPORT SIMULATIONS', st.report], ['SCANS', st.scan], ['ACTIVE SENDERS', D.senders.count()], ['GROUPS', D.groups.count()]
    ];
    sec.querySelector('#stGrid').innerHTML = tiles.map(function (t, i) { return '<div class="tile t' + (i % 4) + (t[2] ? ' wide' : '') + '"><small>' + t[0] + '</small><b>' + t[1] + '</b></div>'; }).join('') +
      '<div class="tile t1 wide"><small>SESSION TIME</small><b id="stSession">' + dur(Date.now() - D.session.startedAt()) + '</b></div>';

    // 7 hari
    var days = [], now = new Date(); now.setHours(0, 0, 0, 0);
    for (var i = 6; i >= 0; i--) { var t0 = now.getTime() - i * 86400000; days.push({ t0: t0, n: 0, l: z(new Date(t0).getDate()) + '/' + z(new Date(t0).getMonth() + 1) }); }
    st.runs.forEach(function (r) { days.forEach(function (dd) { if (r.ts >= dd.t0 && r.ts < dd.t0 + 86400000) dd.n++; }); });
    var mx = Math.max(1, Math.max.apply(null, days.map(function (x) { return x.n; })));
    sec.querySelector('#stWeek').innerHTML = days.map(function (dd) { return '<div class="bc"><span>' + dd.n + '</span><i style="height:' + Math.max(4, Math.round(dd.n / mx * 100)) + '%"></i><small>' + dd.l + '</small></div>'; }).join('');

    // donut
    var rate = st.total ? Math.round(st.completed / st.total * 100) : 0;
    var dn = sec.querySelector('#stDonut');
    dn.style.setProperty('--r', rate + '%'); dn.style.setProperty('--has', st.total ? '1' : '0');
    dn.querySelector('b').textContent = st.total ? rate + '%' : '--';
    sec.querySelector('#stDonutLegend').innerHTML = '<span><i class="lg g"></i>COMPLETED ' + st.completed + '</span><span><i class="lg r"></i>FAILED/STOPPED ' + st.failed + '</span>';

    // per kind
    var mk = Math.max(1, Math.max.apply(null, KINDS.map(function (k) { return st[k[0]]; })));
    sec.querySelector('#stKinds').innerHTML = KINDS.map(function (k) { return '<div class="hb"><span>' + k[1] + '</span><div><i class="' + k[2] + '" style="width:' + Math.round(st[k[0]] / mk * 100) + '%"></i></div><b>' + st[k[0]] + '</b></div>'; }).join('');

    // timeline
    var last = st.runs.slice(-28);
    sec.querySelector('#stDots').innerHTML = last.length ? last.map(function (r) { return '<i class="' + (r.ok ? 'ok' : 'bad') + '" title="' + esc(r.kind) + '"></i>'; }).join('') : '<p class="dim mono">Belum ada simulasi - RUN YOUR FIRST SIMULATION.</p>';
  }

  NG.Pages.statistics = {
    _t: null,
    init: function (sec) {
      sec.querySelector('#stReset').addEventListener('click', function () {
        NG.UI.confirm({ title: 'RESET STATISTICS', text: 'Reset semua statistik simulasi lokal?', ok: 'RESET', danger: true, onOk: function () { D.stats.reset(); D.activity.add('SETTINGS', 'STATISTICS RESET'); NG.UI.toast('Statistics reset'); } });
      });
      ['stats', 'senders', 'groups'].forEach(function (e) { D.on(e, function () { if (NG.Nav.current === 'statistics') render(sec); }); });
      render(sec);
    },
    show: function (sec) {
      render(sec);
      clearInterval(NG.Pages.statistics._t);
      NG.Pages.statistics._t = setInterval(function () { var e = d.getElementById('stSession'); if (e && !d.hidden) e.textContent = dur(Date.now() - D.session.startedAt()); }, 1000);
    },
    hide: function () { clearInterval(NG.Pages.statistics._t); NG.Pages.statistics._t = null; }
  };
  w.addEventListener('pagehide', function () { clearInterval(NG.Pages.statistics._t); });
})(window, document);
