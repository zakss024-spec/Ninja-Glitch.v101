/* NINJA GLITCH - activity.js : ACTIVITY CENTER (log lokal + SEARCH + FILTER + CLEAR LOGS) */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};
  var TYPES = ['ALL', 'LOGIN', 'FINGERPRINT', 'SCAN', 'OSINT', 'REPORT', 'BUG', 'BUG GROUP', 'BAN GROUP', 'EXPLOIT', 'SENDER', 'GROUP', 'SETTINGS', 'SYSTEM'];

  NG.Pages.activity = {
    init: function (sec) {
      var list = sec.querySelector('#acList'), q = sec.querySelector('#acSearch'), chips = sec.querySelector('#acChips'), cnt = sec.querySelector('#acCount'), more = sec.querySelector('#acMore');
      var type = 'ALL', limit = 60, visible = false, t = null;
      chips.innerHTML = TYPES.map(function (x) { return '<button type="button" class="chip' + (x === 'ALL' ? ' on' : '') + '" data-t="' + x + '" aria-pressed="' + (x === 'ALL') + '">' + x + '</button>'; }).join('');

      function draw() {
        var all = D.activity.all(), term = (q.value || '').trim().toLowerCase();
        var f = all.filter(function (a) { return (type === 'ALL' || a.type === type) && (!term || a.text.toLowerCase().indexOf(term) > -1 || a.type.toLowerCase().indexOf(term) > -1); });
        cnt.textContent = f.length + ' / ' + all.length + ' ENTRIES';
        if (!all.length) { list.innerHTML = NG.UI.empty({ glyph: '~', title: 'NO ACTIVITY', sub: 'RUN YOUR FIRST SIMULATION', action: 'bug', label: 'OPEN BUG LAB' }); more.hidden = true; return; }
        if (!f.length) { list.innerHTML = '<p class="empty-li">Tidak ada hasil untuk filter ini.</p>'; more.hidden = true; return; }
        list.innerHTML = f.slice(0, limit).map(function (a) {
          return '<li><div class="lt mono">[' + D.fmtTime(a.ts) + ']</div><div><b>' + NG.UI.esc(a.text) + '</b><small class="dim mono">' + NG.UI.esc(a.type) + ' &middot; ' + NG.UI.esc(D.fmtDate(a.ts)) + '</small></div></li>';
        }).join('');
        more.hidden = f.length <= limit;
      }
      chips.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-t]'); if (!b) return;
        type = b.getAttribute('data-t'); limit = 60;
        Array.prototype.forEach.call(chips.children, function (c) { var on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
        draw();
      });
      q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { limit = 60; draw(); }, 150); });
      more.addEventListener('click', function () { limit += 60; draw(); });
      sec.querySelector('#acClear').addEventListener('click', function () {
        NG.UI.confirm({ title: 'CLEAR LOGS', text: 'Hapus semua log aktivitas lokal?', ok: 'CLEAR LOGS', danger: true, onOk: function () { D.activity.clear(); NG.UI.toast('Logs cleared'); } });
      });
      D.on('activity', function () { if (visible) draw(); });
      NG.Pages.activity._set = function (v) { visible = v; if (v) draw(); };
      draw();
    },
    show: function () { NG.Pages.activity._set && NG.Pages.activity._set(true); },
    hide: function () { NG.Pages.activity._set && NG.Pages.activity._set(false); }
  };
})(window, document);
