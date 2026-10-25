/* NINJA GLITCH - bug-group.js : BUG GROUP (simulasi pada GROUP FIKTIF lokal). */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};

  var TYPES = ['GROUP UI SIMULATION', 'MESSAGE SIMULATION', 'MEMBER EVENT SIMULATION', 'CONNECTION SIMULATION', 'CUSTOM GROUP SIMULATION'];
  var FX = { 'GROUP UI SIMULATION': 'scan', 'MESSAGE SIMULATION': 'shift', 'MEMBER EVENT SIMULATION': 'rgb', 'CONNECTION SIMULATION': 'color', 'CUSTOM GROUP SIMULATION': 'rgb' };
  var DUR = { 1: 4500, 2: 5800, 3: 7200 }, LVL = { 1: 'LOW', 2: 'MID', 3: 'HIGH' };

  NG.Pages['bug-group'] = {
    init: function (sec) {
      NG.Sender.mount(sec);
      var gsel = NG.Group.mountSel(sec);
      var type = sec.querySelector('#bgType'), custom = sec.querySelector('#bgCustom'), cw = sec.querySelector('#bgCustomWrap');
      type.innerHTML = TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('');
      type.addEventListener('change', function () { cw.hidden = type.value !== 'CUSTOM GROUP SIMULATION'; });
      var lvl = NG.SimPanel.seg(sec, 'lvl', '2');
      NG.SimPanel.bind(sec, {
        id: 'bug-group', kind: 'bugGroup', statKey: 'bugGroup', senderStat: 'bugGroup', label: 'BUG GROUP SIMULATION', logType: 'BUG GROUP', startLabel: 'START',
        act: { type: 'BUG GROUP', start: 'BUG GROUP SIMULATION STARTED', done: 'BUG GROUP SIMULATION COMPLETE', stop: 'BUG GROUP SIMULATION STOPPED' },
        notif: { title: 'GROUP BUG COMPLETE', text: 'Bug group simulation selesai (lokal).' },
        doneText: 'BUG GROUP SIMULATION COMPLETE',
        collect: function () {
          var g = D.groups.get(gsel && gsel.value);
          if (!g) return { ok: false, msg: 'Pilih / buat group dulu' };
          var c = (custom.value || '').trim();
          if (type.value === 'CUSTOM GROUP SIMULATION' && c.length < 2) return { ok: false, msg: 'Isi nama custom (min 2 karakter)' };
          return { ok: true, params: { gid: g.id, gname: g.name, members: g.members.slice(), type: type.value, lvl: lvl.get(), custom: c } };
        },
        duration: function (p) { return DUR[p.lvl]; },
        fx: function (p) { return FX[p.type]; },
        onDone: function (ok, p) {
          if (!ok || !p) return;
          var g = D.groups.get(p.gid); if (!g) return;
          D.groups.update(g.id, { sims: g.sims + 1 });
          D.groups.log(g.id, 'Bug group simulation complete (' + p.type + ')');
        },
        stages: function (p) {
          var m = p.members, pick = function (i) { return m.length ? m[i % m.length] : 'FakeUser00'; };
          return [
            { at: 0, status: 'GROUP SELECTED', lines: ['Group selected: ' + p.gname + ' (' + m.length + ' fake members)'] },
            { at: 14, status: 'INITIALIZING', lines: ['Initializing group simulator...', 'Type: ' + (p.type === 'CUSTOM GROUP SIMULATION' ? p.custom : p.type)] },
            { at: 34, status: 'PROCESSING', lines: ['Intensity: ' + LVL[p.lvl], 'Loading virtual member list...'] },
            { at: 56, status: 'SIMULATING', lines: ['Virtual event: ' + pick(0) + ' (fake) active', 'Virtual event: ' + pick(1) + ' (fake) active', 'Rendering group effect...', 'Finalizing visual output...'] }
          ];
        }
      });
    },
    show: function () { /* sinkron via event */ }
  };
})(window, document);
