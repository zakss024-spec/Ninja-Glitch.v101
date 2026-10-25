/* NINJA GLITCH - notifications.js : Notification Center (badge + panel). Data lokal (NGData.notes). */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData, inited = false, panelOpen = false;

  function esc(s) { return NG.UI.esc(s); }
  function badge() {
    var n = D.notes.unread(), b = d.getElementById('bellBadge'), bt = d.getElementById('bellBtn');
    if (b) { b.textContent = n > 99 ? '99+' : String(n); b.hidden = n === 0; }
    if (bt) bt.setAttribute('aria-label', 'Notifikasi (' + n + ' belum dibaca)');
    var dr = d.getElementById('drawerNotifBadge'); if (dr) { dr.textContent = String(n); dr.hidden = n === 0; }
  }
  function listHtml() {
    var a = D.notes.all();
    if (!a.length) return NG.UI.empty({ glyph: '!', title: 'NO NOTIFICATIONS', sub: 'Jalankan simulasi untuk menerima notifikasi.', action: 'bug', label: 'OPEN BUG LAB' });
    return '<ul class="nlist">' + a.map(function (n) {
      return '<li class="' + (n.read ? '' : 'unread ') + n.lvl + '"><span class="nd" aria-hidden="true"></span><div><b>' + esc(n.title) + '</b><p>' + esc(n.text) + '</p><small class="dim mono">' + esc(D.fmtDate(n.ts)) + '</small></div></li>';
    }).join('') + '</ul>';
  }
  function render() {
    var box = d.getElementById('nbox'); if (!box) { panelOpen = false; return; }
    box.innerHTML = listHtml();
  }

  NG.Notif = {
    badge: badge,
    open: function () {
      panelOpen = true;
      NG.UI.modal('NOTIFICATIONS', '<div id="nbox" class="nbox"></div><div class="m-actions"><button class="btn ghost sm" type="button" data-nread>MARK ALL READ</button><button class="btn ghost sm" type="button" data-nclear>CLEAR</button></div>', function (body) {
        render();
        body.querySelector('[data-nread]').addEventListener('click', function () { D.notes.markAllRead(); });
        body.querySelector('[data-nclear]').addEventListener('click', function () { D.notes.clear(); NG.UI.toast('Notifications cleared'); });
      });
    },
    init: function () {
      if (inited) return; inited = true;
      badge();
      D.on('notes', function () { badge(); if (panelOpen) render(); });
      var bell = d.getElementById('bellBtn');
      if (bell) bell.addEventListener('click', NG.Notif.open);
      d.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('[data-action="notifs"]');
        if (t) { if (NG.Nav) NG.Nav.drawer(false); NG.Notif.open(); }
      });
    }
  };
})(window, document);
