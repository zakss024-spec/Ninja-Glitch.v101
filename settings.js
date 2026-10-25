/* NINJA GLITCH - settings.js : SETTINGS (semua toggle benar-benar mengubah tampilan/perilaku) */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData;
  NG.Pages = NG.Pages || {};

  NG.Pages.settings = {
    init: function (sec) {
      function sync() {
        var s = D.settings.get();
        Array.prototype.forEach.call(sec.querySelectorAll('.switch[data-setting]'), function (sw) { sw.setAttribute('aria-checked', s[sw.getAttribute('data-setting')] ? 'true' : 'false'); });
        Array.prototype.forEach.call(sec.querySelectorAll('[data-speed]'), function (c) { var on = c.getAttribute('data-speed') === s.speed; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      }
      sec.addEventListener('click', function (e) {
        var sw = e.target.closest && e.target.closest('.switch[data-setting]');
        if (sw) {
          var k = sw.getAttribute('data-setting'), v = !D.settings.get()[k];
          D.settings.set(k, v); D.activity.add('SETTINGS', 'SETTING ' + k.toUpperCase() + ': ' + (v ? 'ON' : 'OFF'));
          if (k === 'sound' && v) { NG.Sound.play('done'); }
          NG.UI.toast(k.toUpperCase() + ': ' + (v ? 'ON' : 'OFF')); return;
        }
        var sp = e.target.closest && e.target.closest('[data-speed]');
        if (sp) { D.settings.set('speed', sp.getAttribute('data-speed')); D.activity.add('SETTINGS', 'ANIMATION SPEED: ' + sp.getAttribute('data-speed').toUpperCase()); NG.UI.toast('Speed: ' + sp.getAttribute('data-speed').toUpperCase()); }
      });
      sec.querySelector('#stReplayIntro').addEventListener('click', function () { NG.go('index.html?replay=1'); });
      sec.querySelector('#stReplayLoad').addEventListener('click', function () { NG.go('login.html?stage=loading'); });
      sec.querySelector('#stResetData').addEventListener('click', function () {
        NG.UI.confirm({ title: 'RESET LOCAL DATA', text: 'Hapus semua data lokal (sender, group, log, notifikasi, statistik, pengaturan) dan kembalikan data demo awal? Sesi login tetap aktif.', ok: 'RESET', danger: true, onOk: function () {
          D.resetAll(true); D.seed(); D.activity.add('SETTINGS', 'LOCAL DATA RESET'); D.notes.add('LOCAL DATA RESET', 'Data lokal dikembalikan ke kondisi awal.', 'warn'); sync(); NG.UI.toast('Local data reset');
        } });
      });
      sec.querySelector('#stLogout').addEventListener('click', function () { NG.logout(); });
      D.on('settings', sync);
      sync();
    },
    show: function () { /* sinkron via event */ }
  };
})(window, document);
