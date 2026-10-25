/* NINJA GLITCH - ban-group.js : BAN GROUP (SIMULASI lokal. Tidak ada ban / request ke grup atau platform mana pun). */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};

  var REASONS = ['SPAM SIMULATION', 'ABUSE SIMULATION', 'FAKE ACCOUNT SIMULATION', 'RULE VIOLATION SIMULATION', 'CUSTOM REASON'];

  NG.Pages['ban-group'] = {
    init: function (sec) {
      NG.Sender.mount(sec);
      var gsel = NG.Group.mountSel(sec);
      var reason = sec.querySelector('#banReason'), custom = sec.querySelector('#banCustom'), cw = sec.querySelector('#banCustomWrap'), res = sec.querySelector('[data-sim="result"]');
      reason.innerHTML = REASONS.map(function (t) { return '<option>' + t + '</option>'; }).join('');
      reason.addEventListener('change', function () { cw.hidden = reason.value !== 'CUSTOM REASON'; });
      NG.SimPanel.bind(sec, {
        id: 'ban-group', kind: 'banGroup', statKey: 'banGroup', senderStat: 'banGroup', label: 'BAN GROUP SIMULATION', logType: 'BAN GROUP', startLabel: 'SIMULATE BAN',
        act: { type: 'BAN GROUP', start: 'BAN GROUP SIMULATION STARTED', done: 'BAN GROUP SIMULATION COMPLETE', stop: 'BAN GROUP SIMULATION STOPPED' },
        notif: { title: 'BAN SIMULATION COMPLETE', text: 'Ban group simulation selesai (lokal, tidak ada ban nyata).' },
        doneText: 'BAN GROUP SIMULATION COMPLETE',
        duration: function () { return 5200; },
        collect: function () {
          var g = D.groups.get(gsel && gsel.value);
          if (!g) return { ok: false, msg: 'Pilih / buat group dulu' };
          var c = (custom.value || '').trim();
          if (reason.value === 'CUSTOM REASON' && c.length < 2) return { ok: false, msg: 'Isi alasan custom (min 2 karakter)' };
          if (res) { res.hidden = true; res.textContent = ''; }
          return { ok: true, params: { gid: g.id, gname: g.name, members: g.members.length, reason: reason.value === 'CUSTOM REASON' ? c : reason.value } };
        },
        onDone: function (ok, p) {
          if (!p) return;
          if (res) {
            res.hidden = false;
            res.className = 'result-box ' + (ok ? 'ok' : 'bad');
            res.textContent = ok ? 'BAN GROUP SIMULATION COMPLETE - ' + p.gname + ' | reason: ' + p.reason + ' | verdict: SIMULATED ONLY (tidak ada ban nyata)' : 'SIMULATION STOPPED';
          }
          if (ok) { var g = D.groups.get(p.gid); if (g) { D.groups.update(g.id, { sims: g.sims + 1 }); D.groups.log(g.id, 'Ban simulation complete (' + p.reason + ')'); } }
        },
        stages: function (p) {
          return [
            { at: 0, status: 'CHECKING GROUP', lines: ['Checking group (local record): ' + p.gname, 'Fake members found: ' + p.members] },
            { at: 24, status: 'ANALYZING', lines: ['Analyzing reason: ' + p.reason, 'Scoring fake rule-set...'] },
            { at: 50, status: 'PROCESSING', lines: ['Processing simulated decision...', 'Queueing virtual verdict...'] },
            { at: 76, status: 'FINALIZING', lines: ['Finalizing simulated verdict...', 'Writing local log...'] }
          ];
        }
      });
    },
    show: function () { /* sinkron via event */ }
  };
})(window, document);
