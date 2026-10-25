/* NINJA GLITCH - group.js : GROUP LAB (grup & member FIKTIF, data lokal) + selector grup untuk simulator lain. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  var selId = '';
  function esc(s) { return NG.UI.esc(s); }

  var Group = NG.Group = {
    openForm: function (editId) {
      var cur = editId ? D.groups.get(editId) : null;
      var fields = [{ id: 'name', label: 'GROUP NAME', value: cur ? cur.name : '', placeholder: 'NINJA SQUAD', maxlength: 24 }];
      if (cur) fields.push({ id: 'status', label: 'STATUS', type: 'select', value: cur.status, options: ['ACTIVE', 'IDLE', 'ARCHIVED'].map(function (s) { return { v: s, l: s }; }) });
      else fields.push({ id: 'count', label: 'FAKE MEMBERS (AUTO)', type: 'select', value: '4', options: [0, 2, 4, 6, 8].map(function (n) { return { v: String(n), l: n + ' members' }; }), hint: 'Member dibuat acak & fiktif (NinjaUser01, dst).' });
      NG.UI.form({
        title: cur ? 'EDIT GROUP' : 'CREATE GROUP', submit: cur ? 'SAVE' : 'CREATE GROUP', fields: fields,
        onSubmit: function (v) {
          var name = v.name.trim().toUpperCase();
          if (name.length < 2) return { name: 'Minimal 2 karakter.' };
          if (D.groups.all().some(function (g) { return g.id !== editId && g.name === name; })) return { name: 'Nama group sudah ada.' };
          if (cur) {
            D.groups.update(cur.id, { name: name, status: v.status });
            D.groups.log(cur.id, 'Group edited');
            D.activity.add('GROUP', 'GROUP EDITED: ' + name);
            NG.UI.toast('Group updated');
          } else {
            var mem = [], n = parseInt(v.count, 10) || 0;
            for (var i = 0; i < n; i++) mem.push(D.fake.member(mem));
            var g = D.groups.add({ name: name, members: mem });
            selId = g.id;
            D.activity.add('GROUP', 'GROUP CREATED: ' + name);
            D.notes.add('GROUP CREATED', 'Group simulasi "' + name + '" dibuat.', 'ok');
            NG.UI.toast('Group created');
          }
          return true;
        }
      });
    },
    remove: function (id) {
      var g = D.groups.get(id); if (!g) return;
      NG.UI.confirm({ title: 'DELETE GROUP', text: 'Hapus group "' + g.name + '"? (hanya data lokal)', ok: 'DELETE', danger: true, onOk: function () {
        D.groups.remove(id); if (selId === id) selId = ''; D.activity.add('GROUP', 'GROUP DELETED: ' + g.name); NG.UI.toast('Group deleted');
      } });
    },

    /* <select data-group-sel> untuk Bug Group / Ban Group / Report */
    mountSel: function (root) {
      var sel = root.querySelector('[data-group-sel]'); if (!sel) return;
      var empty = root.querySelector('[data-group-empty]'), mc = root.querySelectorAll('[data-member-count]');
      function draw() {
        var all = D.groups.all(), keep = sel.value;
        sel.innerHTML = all.length ? all.map(function (g) { return '<option value="' + esc(g.id) + '">' + esc(g.name) + '</option>'; }).join('') : '<option value="">NO GROUPS YET</option>';
        if (keep && all.some(function (g) { return g.id === keep; })) sel.value = keep;
        sel.disabled = !all.length;
        if (empty) { empty.hidden = !!all.length; if (!all.length) empty.innerHTML = NG.UI.empty({ glyph: '+', title: 'NO GROUPS YET', sub: 'Buat group simulasi dulu.', action: 'new-group', label: 'CREATE GROUP' }); }
        count();
      }
      function count() {
        var g = D.groups.get(sel.value);
        Array.prototype.forEach.call(mc, function (e) { e.textContent = g ? String(g.members.length) : '0'; });
      }
      sel.addEventListener('change', count);
      D.on('groups', draw);
      draw();
      return sel;
    }
  };

  /* ---------- Halaman GROUP LAB ---------- */
  NG.Pages = NG.Pages || {};
  NG.Pages.group = {
    init: function (sec) {
      var list = sec.querySelector('#grpList'), det = sec.querySelector('#grpDetail'), tabShow = null;
      function draw() {
        var all = D.groups.all();
        if (!all.length) { list.innerHTML = NG.UI.empty({ glyph: '+', title: 'NO GROUPS YET', sub: 'Buat group simulasi pertama Anda.', action: 'new-group', label: 'CREATE GROUP' }); det.hidden = true; return; }
        if (!selId || !all.some(function (g) { return g.id === selId; })) selId = all[0].id;
        list.innerHTML = all.map(function (g) {
          return '<article class="card grp' + (g.id === selId ? ' sel' : '') + '" data-id="' + esc(g.id) + '"><header><div><b>' + esc(g.name) + '</b><small class="dim mono">' + esc(g.id) + '</small></div><span class="chip-s ' + (g.status === 'ACTIVE' ? 'ok' : g.status === 'IDLE' ? 'warn' : 'off') + '">' + esc(g.status) + '</span></header>' +
            '<div class="grp-meta mono"><span><b>' + g.members.length + '</b> MEMBERS</span><span><b>' + g.sims + '</b> SIMS</span></div>' +
            '<footer><button class="btn sm" type="button" data-act="open">OPEN</button><button class="btn ghost sm" type="button" data-act="edit">EDIT</button><button class="btn danger sm" type="button" data-act="del">DELETE</button></footer></article>';
        }).join('');
        drawDetail();
      }
      function drawDetail() {
        var g = D.groups.get(selId); if (!g) { det.hidden = true; return; }
        det.hidden = false;
        sec.querySelector('#gdName').textContent = g.name;
        sec.querySelector('#gdMembers').innerHTML = g.members.length
          ? g.members.map(function (m) { return '<span class="mem"><i aria-hidden="true"></i>' + esc(m) + '<button type="button" data-rm="' + esc(m) + '" aria-label="Remove ' + esc(m) + '">&times;</button></span>'; }).join('')
          : '<p class="dim mono">Belum ada member. Tekan + ADD MEMBER.</p>';
        sec.querySelector('#gdStatus').innerHTML = '<ul class="kv"><li><span>Status</span><b>' + esc(g.status) + '</b></li><li><span>Members</span><b>' + g.members.length + '</b></li><li><span>Simulations</span><b>' + g.sims + '</b></li><li><span>Created</span><b>' + esc(D.fmtDate(g.created)) + '</b></li></ul>' +
          '<div class="seg" role="group" aria-label="Set status">' + ['ACTIVE', 'IDLE', 'ARCHIVED'].map(function (s) { return '<button type="button" class="chip' + (g.status === s ? ' on' : '') + '" data-st="' + s + '" aria-pressed="' + (g.status === s) + '">' + s + '</button>'; }).join('') + '</div>';
        sec.querySelector('#gdLog').innerHTML = g.log.length ? g.log.map(function (l) { return '<li><span class="cy">' + esc(D.fmtTime(l.ts)) + '</span><span>' + esc(l.text) + '</span></li>'; }).join('') : '<li class="empty-li">No activity</li>';
      }
      NG.UI.tabs(sec);
      sec.querySelector('#grpAdd').addEventListener('click', function () { Group.openForm(); });
      list.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-act]'); if (!b) return;
        var id = b.closest('.grp').getAttribute('data-id'), a = b.getAttribute('data-act');
        if (a === 'open') { selId = id; draw(); var dd = sec.querySelector('#grpDetail'); if (dd && dd.scrollIntoView) dd.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        else if (a === 'edit') Group.openForm(id);
        else if (a === 'del') Group.remove(id);
      });
      det.addEventListener('click', function (e) {
        var g = D.groups.get(selId); if (!g) return;
        var t = e.target.closest && e.target.closest('button'); if (!t) return;
        if (t.hasAttribute('data-rm')) {
          var m = t.getAttribute('data-rm');
          D.groups.update(g.id, { members: g.members.filter(function (x) { return x !== m; }) }); D.groups.log(g.id, m + ' removed (simulated)');
        } else if (t.hasAttribute('data-st')) {
          D.groups.update(g.id, { status: t.getAttribute('data-st') }); D.groups.log(g.id, 'Status -> ' + t.getAttribute('data-st'));
          D.activity.add('GROUP', 'GROUP STATUS: ' + g.name + ' -> ' + t.getAttribute('data-st'));
        } else if (t.id === 'gdAdd') {
          if (g.members.length >= 60) { NG.UI.toast('Maksimum 60 member'); return; }
          var n = D.fake.member(g.members); D.groups.update(g.id, { members: g.members.concat(n) }); D.groups.log(g.id, n + ' joined (simulated)');
        } else if (t.id === 'gdEvent') {
          var join = g.members.length < 2 || Math.random() < .55, nm;
          if (join) { nm = D.fake.member(g.members); D.groups.update(g.id, { members: g.members.concat(nm) }); D.groups.log(g.id, nm + ' joined (simulated event)'); }
          else { nm = g.members[Math.floor(Math.random() * g.members.length)]; D.groups.update(g.id, { members: g.members.filter(function (x) { return x !== nm; }) }); D.groups.log(g.id, nm + ' left (simulated event)'); }
          D.activity.add('GROUP', 'MEMBER EVENT SIM: ' + g.name);
          NG.UI.toast(nm + (join ? ' joined' : ' left'));
        }
      });
      D.on('groups', draw);
      draw();
    },
    show: function () { /* sinkron lewat event */ }
  };
})(window, document);
