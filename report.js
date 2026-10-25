/* NINJA GLITCH - report.js : REPORT LAB (SIMULASI lokal. Tidak ada report yang dikirim ke platform mana pun). */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};

  var TYPES = ['SPAM', 'FAKE ACCOUNT', 'ABUSE', 'SCAM', 'OTHER'];
  var REASONS = ['Suspicious pattern (simulated)', 'Repeated content (simulated)', 'Policy test case (simulated)', 'Training scenario (simulated)'];

  NG.Pages.report = {
    init: function (sec) {
      NG.Sender.mount(sec);
      var target = sec.querySelector('#rpTarget'), type = sec.querySelector('#rpType'), reason = sec.querySelector('#rpReason'), count = sec.querySelector('#rpCount'), res = sec.querySelector('[data-sim="result"]');
      type.innerHTML = TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('');
      reason.innerHTML = REASONS.map(function (t) { return '<option>' + t + '</option>'; }).join('');
      count.innerHTML = [1, 3, 5, 10, 20].map(function (n) { return '<option value="' + n + '">' + n + '</option>'; }).join('');
      NG.SimPanel.bind(sec, {
        id: 'report', kind: 'report', statKey: 'report', senderStat: 'report', label: 'REPORT SIMULATION', logType: 'REPORT', startLabel: 'START REPORT SIM',
        act: { type: 'REPORT', start: 'REPORT SIMULATION STARTED', done: 'REPORT SIMULATION COMPLETE', stop: 'REPORT SIMULATION STOPPED' },
        notif: { title: 'REPORT SIMULATION COMPLETE', text: 'Report simulation selesai (lokal, tidak ada report terkirim).' },
        doneText: 'REPORT SIMULATION COMPLETE',
        collect: function () {
          var t = (target.value || '').trim();
          if (t.length < 2) return { ok: false, msg: 'Isi label target fiktif (min 2 karakter)' };
          if (res) { res.hidden = true; res.textContent = ''; }
          return { ok: true, params: { target: t, type: type.value, reason: reason.value, n: parseInt(count.value, 10) || 1 } };
        },
        duration: function (p) { return 4200 + p.n * 260; },
        onDone: function (ok, p) {
          if (!res || !p) return;
          res.hidden = false; res.className = 'result-box ' + (ok ? 'ok' : 'bad');
          res.textContent = ok ? 'REPORT SIMULATION COMPLETE - label: ' + p.target + ' | ' + p.type + ' x' + p.n + ' | tidak ada report yang dikirim' : 'SIMULATION STOPPED';
        },
        stages: function (p) {
          var proc = [];
          for (var i = 1; i <= Math.min(p.n, 8); i++) proc.push('Simulated report ' + i + '/' + p.n + ' (' + p.type + ') - local only');
          return [
            { at: 0, status: 'PREPARING', lines: ['Preparing report draft for fake label: ' + p.target] },
            { at: 14, status: 'VALIDATING', lines: ['Validating fields...', 'Reason: ' + p.reason] },
            { at: 30, status: 'QUEUED', lines: ['Queued locally (no network queue)'] },
            { at: 42, status: 'PROCESSING', lines: proc },
            { at: 86, status: 'FINALIZING', lines: ['Finalizing simulated result...'] }
          ];
        }
      });
    },
    show: function () { /* sinkron via event */ }
  };
})(window, document);
