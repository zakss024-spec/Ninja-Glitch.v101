/* NINJA GLITCH - sender.js : Manage Sender + selector ACTIVE SENDER.
 * Sender = PROFIL LOKAL (localStorage). Nomor TIDAK PERNAH dikirim / dipakai untuk menghubungi apa pun. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  var CC = [['+62', 'ID +62'], ['+1', 'US/CA +1'], ['+44', 'UK +44'], ['+60', 'MY +60'], ['+65', 'SG +65'], ['+61', 'AU +61'], ['+91', 'IN +91'], ['+81', 'JP +81'], ['+82', 'KR +82'], ['+49', 'DE +49'], ['+33', 'FR +33'], ['+55', 'BR +55']];
  var revealed = {};
  function esc(s) { return NG.UI.esc(s); }

  function validate(v, ignoreId) {
    var err = {}, name = v.name.trim(), ph = v.phone.replace(/[\s\-().]/g, '');
    if (name.length < 2) err.name = 'Minimal 2 karakter.';
    if (!/^\d+$/.test(ph)) err.phone = 'Hanya angka (spasi/tanda hubung diabaikan).';
    else {
      ph = ph.replace(/^0+/, '');
      if (ph.length < 6 || ph.length > 14) err.phone = 'Panjang 6-14 digit.';
    }
    if (!err.name) {
      var dup = D.senders.all().some(function (s) { return s.id !== ignoreId && s.name.toLowerCase() === name.toLowerCase(); });
      if (dup) err.name = 'Nama sender sudah dipakai.';
    }
    return { err: err, name: name, phone: ph, profile: (v.profile || '').trim() || name, cc: v.cc };
  }

  var Sender = NG.Sender = {
    openForm: function (editId) {
      var cur = editId ? D.senders.get(editId) : null;
      NG.UI.form({
        title: cur ? 'EDIT SENDER' : 'ADD SENDER',
        submit: cur ? 'SAVE' : 'ADD SENDER',
        fields: [
          { id: 'name', label: 'SENDER NAME', value: cur ? cur.name : '', placeholder: 'Ninja Sender', maxlength: 24 },
          { id: 'cc', label: 'COUNTRY CODE', type: 'select', value: cur ? cur.cc : '+62', options: CC.map(function (c) { return { v: c[0], l: c[1] }; }) },
          { id: 'phone', label: 'PHONE NUMBER', value: cur ? cur.phone : '', placeholder: '8xxxxxxxxxx', inputmode: 'tel', maxlength: 18, hint: 'Profil lokal saja - tidak pernah dikirim ke mana pun.' },
          { id: 'profile', label: 'PROFILE NAME', value: cur ? cur.profile : '', placeholder: 'Ninja Profile', maxlength: 24 }
        ],
        onSubmit: function (v) {
          var r = validate(v, editId);
          if (Object.keys(r.err).length) return r.err;
          if (cur) {
            D.senders.update(cur.id, { name: r.name, cc: r.cc, phone: r.phone, profile: r.profile });
            D.activity.add('SENDER', 'SENDER UPDATED: ' + r.name);
            NG.UI.toast('Sender updated');
          } else {
            var s = D.senders.add({ name: r.name, cc: r.cc, phone: r.phone, profile: r.profile });
            D.activity.add('SENDER', 'SENDER CREATED: ' + r.name);
            D.notes.add('SENDER CREATED', 'Profil sender "' + r.name + '" dibuat (lokal).', 'ok');
            NG.UI.toast('Sender created');
            if (D.senders.activeId() === s.id) D.notes.add('SENDER ACTIVE', r.name + ' kini aktif.', 'info');
          }
          return true;
        }
      });
    },

    setActive: function (id, quiet) {
      var s = D.senders.get(id); if (!s) return;
      D.senders.setActive(id);
      D.activity.add('SENDER', 'SENDER ACTIVE: ' + s.name);
      if (!quiet) { D.notes.add('SENDER ACTIVE', s.name + ' dijadikan sender aktif.', 'info'); NG.UI.toast('Active sender: ' + s.name); }
    },

    remove: function (id) {
      var s = D.senders.get(id); if (!s) return;
      NG.UI.confirm({ title: 'REMOVE SENDER', text: 'Hapus profil sender "' + s.name + '"? (hanya data lokal)', ok: 'REMOVE', danger: true, onOk: function () {
        D.senders.remove(id); D.activity.add('SENDER', 'SENDER REMOVED: ' + s.name); NG.UI.toast('Sender removed');
      } });
    },

    /* selector ACTIVE SENDER di Bug / Bug Group / Ban Group / Report */
    mount: function (root) {
      var boxes = root.querySelectorAll('[data-sender-sel]');
      Array.prototype.forEach.call(boxes, function (box) {
        function draw() {
          var all = D.senders.all(), act = D.senders.active();
          if (!all.length) {
            box.innerHTML = '<div class="ssel none"><div><b>NO ACTIVE SENDER</b><small class="dim mono">Simulasi memakai identitas default.</small></div><button class="btn sm" type="button" data-new-sender>CREATE SENDER</button></div>';
            return;
          }
          var opts = all.map(function (s) { return '<option value="' + esc(s.id) + '"' + (act && act.id === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '<option value="__new">+ Custom Sender...</option>';
          box.innerHTML = '<label class="field"><span>ACTIVE SENDER</span><select class="input" data-ssel>' + opts + '</select></label>' +
            (act ? '<div class="ssel"><span class="badge-on">&#9679; ACTIVE</span><b>' + esc(act.name) + '</b><span class="mono dim">' + esc(D.maskPhone(act.cc, act.phone)) + '</span></div>' : '<div class="ssel none"><b>NO ACTIVE SENDER</b></div>');
        }
        draw();
        D.on('senders', draw);
        box.addEventListener('change', function (e) {
          var sel = e.target.closest && e.target.closest('[data-ssel]'); if (!sel) return;
          if (sel.value === '__new') { draw(); Sender.openForm(); return; }
          Sender.setActive(sel.value);
        });
        box.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-new-sender]')) Sender.openForm(); });
      });
    }
  };

  /* ---------- Halaman MANAGE SENDER ---------- */
  NG.Pages = NG.Pages || {};
  NG.Pages.sender = {
    init: function (sec) {
      var list = sec.querySelector('#sndList'), act = sec.querySelector('#sndActive');
      function draw() {
        var all = D.senders.all(), a = D.senders.active();
        act.innerHTML = a
          ? '<div class="act-sender"><div class="as-ico"><img data-asset="ninja" src="./assets/images/ninja.webp" alt="" width="44" height="44" decoding="async"></div><div class="as-main"><small class="dim mono">ACTIVE SENDER</small><b>' + esc(a.name) + '</b><span class="mono dim">' + esc(D.maskPhone(a.cc, a.phone)) + '</span></div><span class="badge-on">&#9679; ACTIVE</span></div>'
          : NG.UI.empty({ glyph: '?', title: 'NO ACTIVE SENDER', sub: 'Buat atau pilih sender untuk dipakai simulator.', action: 'new-sender', label: 'CREATE SENDER' });
        if (NG.Img) NG.Img.scan(act);
        if (!all.length) { list.innerHTML = NG.UI.empty({ glyph: '+', title: 'NO SENDERS YET', sub: 'Buat profil sender lokal pertama Anda.', action: 'new-sender', label: 'CREATE YOUR FIRST SENDER' }); return; }
        list.innerHTML = all.map(function (s) {
          var on = a && a.id === s.id, shown = revealed[s.id];
          return '<article class="card snd' + (on ? ' on' : '') + '" data-id="' + esc(s.id) + '">' +
            '<header><div><b>' + esc(s.name) + '</b><small class="dim mono">' + esc(s.profile) + (s.demo ? ' &middot; DEMO' : '') + '</small></div><span class="chip-s ' + (on ? 'ok' : 'off') + '">' + (on ? '&#9679; ACTIVE' : 'INACTIVE') + '</span></header>' +
            '<div class="snd-num mono"><span>' + esc(shown ? s.cc + ' ' + s.phone : D.maskPhone(s.cc, s.phone)) + '</span><button class="iconbtn sm" type="button" data-act="reveal" aria-label="Tampilkan/sembunyikan nomor">' + (shown ? 'HIDE' : 'SHOW') + '</button></div>' +
            '<dl class="dl4"><div><dt>LAST ACTIVE</dt><dd>' + (s.last ? esc(D.fmtDate(s.last)) : '-') + '</dd></div><div><dt>SIMULATIONS</dt><dd>' + s.sims + '</dd></div><div><dt>BUG SIM</dt><dd>' + s.bug + '</dd></div><div><dt>GROUP SIM</dt><dd>' + (s.bugGroup + s.banGroup) + '</dd></div></dl>' +
            '<footer><button class="btn sm" type="button" data-act="active"' + (on ? ' disabled' : '') + '>SET ACTIVE</button><button class="btn ghost sm" type="button" data-act="edit">EDIT</button><button class="btn danger sm" type="button" data-act="del">DELETE</button></footer></article>';
        }).join('');
      }
      sec.querySelector('#sndAdd').addEventListener('click', function () { Sender.openForm(); });
      list.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-act]'); if (!b) return;
        var id = b.closest('.snd').getAttribute('data-id'), a = b.getAttribute('data-act');
        if (a === 'active') Sender.setActive(id);
        else if (a === 'edit') Sender.openForm(id);
        else if (a === 'del') Sender.remove(id);
        else if (a === 'reveal') { revealed[id] = !revealed[id]; draw(); }
      });
      D.on('senders', draw);
      draw();
    },
    show: function () { /* data selalu sinkron via event */ }
  };
})(window, document);
