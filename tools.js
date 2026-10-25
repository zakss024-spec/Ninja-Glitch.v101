/* NINJA GLITCH - tools.js : TOOLS (semua berjalan lokal di browser).
 * JSON Viewer, Text Encoder/Decoder, Hash Demo, Color Test, Image Test, Local Storage Viewer, Animation Test. */
(function (w, d) {
  'use strict';
  var NG = w.NG = w.NG || {};
  var D = w.NGData, S = w.NGStorage;
  NG.Pages = NG.Pages || {};
  function esc(s) { return NG.UI.esc(s); }

  /* ---------- SHA-256 murni JS (tetap jalan di http / file) ---------- */
  function sha256(str) {
    var enc = new TextEncoder().encode(str), K = [], H = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];
    for (var i = 0, c = 2; i < 64; c++) { var pr = true; for (var j = 2; j * j <= c; j++) if (c % j === 0) { pr = false; break; } if (pr) { K[i++] = (Math.cbrt(c) % 1) * 4294967296 | 0; } }
    var l = enc.length, nl = ((l + 9 + 63) >> 6) << 6, b = new Uint8Array(nl); b.set(enc); b[l] = 128;
    var dv = new DataView(b.buffer); dv.setUint32(nl - 4, l * 8 >>> 0); dv.setUint32(nl - 8, Math.floor(l * 8 / 4294967296));
    function rr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var o = 0; o < nl; o += 64) {
      var W = new Array(64), a = H.slice();
      for (var t = 0; t < 64; t++) {
        if (t < 16) W[t] = dv.getUint32(o + t * 4);
        else { var s0 = rr(W[t - 15], 7) ^ rr(W[t - 15], 18) ^ (W[t - 15] >>> 3), s1 = rr(W[t - 2], 17) ^ rr(W[t - 2], 19) ^ (W[t - 2] >>> 10); W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0; }
        var S1 = rr(a[4], 6) ^ rr(a[4], 11) ^ rr(a[4], 25), ch = (a[4] & a[5]) ^ (~a[4] & a[6]), t1 = (a[7] + S1 + ch + K[t] + W[t]) | 0;
        var S0 = rr(a[0], 2) ^ rr(a[0], 13) ^ rr(a[0], 22), mj = (a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]), t2 = (S0 + mj) | 0;
        a = [(t1 + t2) | 0, a[0], a[1], a[2], (a[3] + t1) | 0, a[4], a[5], a[6]];
      }
      for (var k = 0; k < 8; k++) H[k] = (H[k] + a[k]) | 0;
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }
  function fnv(str) { var h = 0x811c9dc5; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ('00000000' + (h >>> 0).toString(16)).slice(-8); }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }

  /* ---------- Encoder / decoder ---------- */
  var CODECS = {
    'Base64': { e: function (s) { var b = new TextEncoder().encode(s), r = ''; b.forEach(function (x) { r += String.fromCharCode(x); }); return btoa(r); }, d: function (s) { var r = atob(s.replace(/\s/g, '')), a = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return new TextDecoder('utf-8', { fatal: true }).decode(a); } },
    'URL': { e: encodeURIComponent, d: decodeURIComponent },
    'HEX': { e: function (s) { return hex(new TextEncoder().encode(s)); }, d: function (s) { s = s.replace(/\s/g, ''); if (!/^([0-9a-f]{2})+$/i.test(s)) throw new Error('hex tidak valid'); var a = new Uint8Array(s.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(s.substr(i * 2, 2), 16); return new TextDecoder('utf-8', { fatal: true }).decode(a); } },
    'ROT13': { e: function (s) { return s.replace(/[a-z]/gi, function (c) { var b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); }); }, d: null },
    'BINARY': { e: function (s) { var r = []; new TextEncoder().encode(s).forEach(function (x) { r.push(('00000000' + x.toString(2)).slice(-8)); }); return r.join(' '); }, d: function (s) { var p = s.trim().split(/\s+/); if (!p.every(function (x) { return /^[01]{8}$/.test(x); })) throw new Error('biner 8-bit tidak valid'); return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(p.map(function (x) { return parseInt(x, 2); }))); } }
  };
  CODECS.ROT13.d = CODECS.ROT13.e;

  function jsonHtml(v, ind) {
    var s = JSON.stringify(v, null, 2);
    return esc(s).replace(/(&quot;(?:\\.|[^&])*?&quot;)(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, function (m, str, colon, kw) {
      if (str) return '<span class="' + (colon ? 'jk' : 'js') + '">' + str + '</span>' + (colon || '');
      if (kw) return '<span class="jb">' + m + '</span>';
      return '<span class="jn">' + m + '</span>';
    });
  }

  NG.Pages.tools = {
    _anim: false,
    init: function (sec) {
      var $ = function (s) { return sec.querySelector(s); };
      var showTab = NG.UI.tabs(sec, function (n) { if (n === 'img') runImg(); if (n === 'ls') drawLS(); if (n !== 'anim') stopAnim(); });

      /* JSON */
      var jin = $('#tlJsonIn'), jout = $('#tlJsonOut'), jmeta = $('#tlJsonMeta');
      function jparse() { try { var v = JSON.parse(jin.value); return { v: v }; } catch (e) { return { err: e.message }; } }
      $('#tlJsonFmt').addEventListener('click', function () { if (!jin.value.trim()) { jmeta.textContent = 'Input kosong'; jmeta.className = 'warn'; return; } var r = jparse(); if (r.err) { jout.textContent = ''; jmeta.textContent = 'INVALID: ' + r.err; jmeta.className = 'bad'; return; } jout.innerHTML = jsonHtml(r.v); jmeta.textContent = 'VALID JSON - ' + (Array.isArray(r.v) ? 'array(' + r.v.length + ')' : typeof r.v) + ' - ' + jin.value.length + ' chars'; jmeta.className = 'ok'; });
      $('#tlJsonMin').addEventListener('click', function () { var r = jparse(); if (r.err) { jmeta.textContent = 'INVALID: ' + r.err; jmeta.className = 'bad'; return; } jin.value = JSON.stringify(r.v); jout.textContent = jin.value; jmeta.textContent = 'MINIFIED'; jmeta.className = 'ok'; });
      $('#tlJsonSample').addEventListener('click', function () { jin.value = '{"app":"NINJA GLITCH","mode":"local-simulation","modules":["bug","group","sender"],"stats":{"total":3,"ok":true}}'; $('#tlJsonFmt').click(); });
      $('#tlJsonClear').addEventListener('click', function () { jin.value = ''; jout.textContent = ''; jmeta.textContent = ''; });

      /* Encoder / Decoder */
      var names = Object.keys(CODECS);
      ['Enc', 'Dec'].forEach(function (k) {
        var sel = $('#tl' + k + 'Mode'); sel.innerHTML = names.map(function (n) { return '<option>' + n + '</option>'; }).join('');
        var inp = $('#tl' + k + 'In'), out = $('#tl' + k + 'Out'), msg = $('#tl' + k + 'Msg');
        function run() {
          try { out.value = CODECS[sel.value][k === 'Enc' ? 'e' : 'd'](inp.value); msg.textContent = out.value ? 'OK' : ''; msg.className = 'ok'; }
          catch (e) { out.value = ''; msg.textContent = 'Error: ' + (e.message || 'input tidak valid'); msg.className = 'bad'; }
        }
        $('#tl' + k + 'Run').addEventListener('click', run); inp.addEventListener('input', run); sel.addEventListener('change', run);
        $('#tl' + k + 'Copy').addEventListener('click', function () { copy(out.value); });
      });
      function copy(t) {
        if (!t) { NG.UI.toast('Tidak ada yang disalin'); return; }
        try { if (navigator.clipboard && w.isSecureContext) { navigator.clipboard.writeText(t).then(function () { NG.UI.toast('Copied'); }, function () { NG.UI.toast('Gagal menyalin'); }); return; } } catch (e) { /* lanjut */ }
        try { var ta = d.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; d.body.appendChild(ta); ta.select(); d.execCommand('copy'); d.body.removeChild(ta); NG.UI.toast('Copied'); } catch (e2) { NG.UI.toast('Gagal menyalin'); }
      }
      NG.copy = copy;

      /* Hash */
      var hin = $('#tlHashIn'), hout = $('#tlHashOut');
      function hashRun() {
        var t = hin.value, rows = [['SHA-256', sha256(t)], ['FNV-1a 32', fnv(t)]];
        hout.innerHTML = rows.map(function (r) { return '<li><span>' + r[0] + '</span><code>' + r[1] + '</code></li>'; }).join('');
        if (w.crypto && crypto.subtle && w.isSecureContext) {
          ['SHA-1', 'SHA-512'].forEach(function (a) { crypto.subtle.digest(a, new TextEncoder().encode(t)).then(function (b) { var li = d.createElement('li'); li.innerHTML = '<span>' + a + '</span><code>' + hex(b) + '</code>'; hout.appendChild(li); }, function () { /* abaikan */ }); });
        }
      }
      hin.addEventListener('input', hashRun); hashRun();

      /* Color test */
      var PAL = [['PURPLE', '#a855f7'], ['PURPLE DEEP', '#7c3aed'], ['CYAN', '#22d3ee'], ['GREEN', '#4ade80'], ['PINK', '#ff4d8d'], ['BLACK', '#05030c'], ['PANEL', '#0b0618'], ['TEXT', '#ece9ff']];
      $('#tlPal').innerHTML = PAL.map(function (p) { return '<button type="button" class="sw" data-hex="' + p[1] + '" style="--c:' + p[1] + '"><i></i><b>' + p[0] + '</b><small>' + p[1] + '</small></button>'; }).join('');
      $('#tlPal').addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-hex]'); if (b) copy(b.getAttribute('data-hex')); });
      var fg = $('#tlFg'), bg = $('#tlBg');
      function lum(h) { var c = [1, 3, 5].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
      function contrast() { var a = lum(fg.value), b = lum(bg.value), r = (Math.max(a, b) + .05) / (Math.min(a, b) + .05); $('#tlCon').style.color = fg.value; $('#tlCon').style.background = bg.value; $('#tlConV').textContent = r.toFixed(2) + ':1 - ' + (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA LARGE' : 'FAIL'); }
      fg.addEventListener('input', contrast); bg.addEventListener('input', contrast); contrast();

      /* Image test */
      var imgOut = $('#tlImgOut'), imgSum = $('#tlImgSum');
      function drawImg(res) {
        var ok = res.filter(function (r) { return r.ok; }).length;
        imgSum.textContent = ok + '/' + res.length + ' LOADED'; imgSum.className = 'badge ' + (ok === res.length ? '' : 'p');
        var groups = {}; res.forEach(function (r) { (groups[r.group] = groups[r.group] || []).push(r); });
        imgOut.innerHTML = Object.keys(groups).map(function (g) {
          var all = groups[g].every(function (r) { return r.ok; });
          return '<section class="im-grp"><h4><span>' + g + '</span><b class="' + (all ? 'ok' : 'bad') + '">' + (all ? '&#10003; LOADED' : '&#10005; FAILED') + '</b></h4>' + groups[g].map(function (r) {
            return '<div class="im-row ' + (r.ok ? 'ok' : 'bad') + '"><div class="im-th">' + (r.ok ? '<img src="' + r.path + '?t=' + r.ms + '" alt="" loading="eager">' : '<span class="img-ph ph-generic"></span>') + '</div><div class="im-info"><b>' + esc(r.label) + '</b>' + (r.ok ? '<small class="dim mono">' + r.w + 'x' + r.h + ' &middot; ' + r.ms + 'ms</small>' : '<small class="bad mono">PATH: ' + esc(r.path) + '</small>') + '</div><span class="chip-s ' + (r.ok ? 'ok' : 'bad') + '">' + (r.ok ? '&#10003; LOADED' : '&#10005; FAILED') + '</span></div>';
          }).join('') + '</section>';
        }).join('');
      }
      function runImg() { imgSum.textContent = 'TESTING...'; NG.Img.testAll(drawImg); }
      $('#tlImgReload').addEventListener('click', function () { imgSum.textContent = 'RELOADING...'; NG.Img.reload(function (res) { drawImg(res); NG.UI.toast('Assets reloaded'); D.activity.add('SYSTEM', 'ASSETS RELOADED'); }); });

      /* Local storage viewer */
      var lsOut = $('#tlLsOut');
      function drawLS() {
        var keys = S.keys(), total = 0;
        lsOut.innerHTML = keys.length ? keys.map(function (k) { var v = String(S.get(k, '')); total += v.length + k.length; return '<li><button type="button" data-k="' + esc(k) + '"><b>ng_' + esc(k) + '</b><small class="dim mono">' + v.length + ' B</small></button></li>'; }).join('') : '<li class="empty-li">Storage kosong</li>';
        $('#tlLsTotal').textContent = keys.length + ' keys - ' + (total / 1024).toFixed(1) + ' KB' + (S.available ? '' : ' (fallback memory)');
      }
      lsOut.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-k]'); if (!b) return;
        var k = b.getAttribute('data-k'), raw = String(S.get(k, '')), pretty = raw;
        try { pretty = JSON.stringify(JSON.parse(raw), null, 2); } catch (x) { /* bukan JSON */ }
        NG.UI.modal('ng_' + k, '<pre class="pre">' + esc(pretty.slice(0, 6000)) + (pretty.length > 6000 ? '\n... (dipotong)' : '') + '</pre><div class="m-actions"><button class="btn ghost sm" type="button" data-copy>COPY</button><button class="btn danger sm" type="button" data-del>DELETE KEY</button></div>', function (body) {
          body.querySelector('[data-copy]').addEventListener('click', function () { copy(raw); });
          body.querySelector('[data-del]').addEventListener('click', function () { if (k === 'session') { NG.UI.toast('Gunakan Logout untuk menghapus session'); return; } S.remove(k); NG.UI.closeModal(); drawLS(); D.emit('settings'); NG.UI.toast('Key deleted'); });
        });
      });
      $('#tlLsExport').addEventListener('click', function () { var o = {}; S.keys().forEach(function (k) { if (k !== 'session') { try { o[k] = JSON.parse(S.get(k, '')); } catch (e) { o[k] = S.get(k, ''); } } }); copy(JSON.stringify(o, null, 2)); });
      $('#tlLsRefresh').addEventListener('click', drawLS);

      /* Animation test */
      var fpsEl = $('#tlFps'), box = $('#tlAnim');
      function stopAnim() { if (!box) return; box.classList.remove('run'); NG.Pages.tools._anim = false; $('#tlAnimBtn').textContent = 'START ANIMATION TEST'; }
      $('#tlAnimBtn').addEventListener('click', function () { var on = !box.classList.contains('run'); box.classList.toggle('run', on); NG.Pages.tools._anim = on; this.textContent = on ? 'STOP ANIMATION TEST' : 'START ANIMATION TEST'; });
      NG.Fps.on(function (f) { if (fpsEl) { fpsEl.textContent = f + ' FPS'; fpsEl.className = f >= 50 ? 'ok' : f >= 30 ? 'warn' : 'bad'; } });
      NG.Pages.tools._stop = stopAnim; NG.Pages.tools._ls = drawLS;
    },
    show: function () { if (NG.Pages.tools._ls) NG.Pages.tools._ls(); },
    hide: function () { if (NG.Pages.tools._stop) NG.Pages.tools._stop(); }
  };
})(window, document);
