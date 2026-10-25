/* NINJA GLITCH - bug.js : BUG LAB (simulasi VISUAL lokal; tidak ada payload, tidak ada pengiriman apa pun). */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};

  var TYPES = {
    'MESSAGE BUG':    { fx: 'shift', lines: ['Rendering fake chat bubble (visual only)', 'Applying text-glitch layer to preview', 'Simulating bubble overflow animation'] },
    'UI BUG':         { fx: 'rgb',   lines: ['Splitting RGB channels on preview', 'Offsetting layout grid (virtual)', 'Simulating UI jitter frames'] },
    'GROUP BUG':      { fx: 'scan',  lines: ['Creating virtual group canvas', 'Sweeping scanline distortion', 'Simulating member list flicker'] },
    'CONNECTION BUG': { fx: 'color', lines: ['Generating fake latency curve', 'Simulating packet-loss visual (no packets)', 'Drifting colour channels'] },
    'LOADING BUG':    { fx: 'blink', lines: ['Freezing virtual progress bar', 'Looping spinner frames', 'Simulating stuck-loader visual'] },
    'CUSTOM BUG':     { fx: 'rgb',   lines: ['Applying custom visual profile', 'Mixing glitch layers', 'Rendering custom effect'] }
  };
  var TARGETS = ['VIRTUAL DEVICE A', 'VIRTUAL CHAT PREVIEW', 'LOCAL SANDBOX', 'TEST CANVAS'];
  var DUR = { 1: 4200, 2: 5400, 3: 6800 }, LVL = { 1: 'LOW', 2: 'MID', 3: 'HIGH' };

  NG.Pages.bug = {
    init: function (sec) {
      NG.Sender.mount(sec);
      var type = sec.querySelector('#bugType'), target = sec.querySelector('#bugTarget'), custom = sec.querySelector('#bugCustom'), customWrap = sec.querySelector('#bugCustomWrap');
      type.innerHTML = Object.keys(TYPES).map(function (t) { return '<option>' + t + '</option>'; }).join('');
      target.innerHTML = TARGETS.map(function (t) { return '<option>' + t + '</option>'; }).join('');
      var lvl = NG.SimPanel.seg(sec, 'lvl', '2');
      type.addEventListener('change', function () { customWrap.hidden = type.value !== 'CUSTOM BUG'; });
      NG.SimPanel.bind(sec, {
        id: 'bug', kind: 'bug', statKey: 'bug', senderStat: 'bug', label: 'BUG SIMULATION', logType: 'BUG', startLabel: 'START BUG',
        act: { type: 'BUG', start: 'BUG SIMULATION STARTED', done: 'BUG SIMULATION COMPLETE', stop: 'BUG SIMULATION STOPPED' },
        notif: { title: 'BUG COMPLETE', text: 'Bug simulation selesai (lokal).' },
        doneText: 'BUG SIMULATION COMPLETE',
        collect: function () {
          var t = type.value, c = (custom.value || '').trim();
          if (t === 'CUSTOM BUG' && c.length < 2) return { ok: false, msg: 'Isi nama custom bug (min 2 karakter)' };
          return { ok: true, params: { type: t, target: target.value, lvl: lvl.get(), custom: c } };
        },
        duration: function (p) { return DUR[p.lvl]; },
        fx: function (p) { return TYPES[p.type].fx; },
        stages: function (p) {
          var T = TYPES[p.type];
          return [
            { at: 0, status: 'INITIALIZING', lines: ['Initializing simulator core...', 'Virtual target: ' + p.target] },
            { at: 24, status: 'PROCESSING', lines: ['Loading profile: ' + (p.type === 'CUSTOM BUG' ? p.custom : p.type), 'Intensity: ' + LVL[p.lvl]] },
            { at: 48, status: 'SIMULATING', lines: T.lines.concat(['Finalizing visual output...']) }
          ];
        }
      });
    },
    show: function () { /* sinkron via event */ }
  };
})(window, document);
