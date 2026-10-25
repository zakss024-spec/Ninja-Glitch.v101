NINJA GLITCH - FINAL (v2.0.0)
=============================
Situs statis (HTML/CSS/JS murni, tanpa backend). Semua fitur adalah SIMULASI LOKAL
dengan data fiktif/acak. Tidak ada request ke target, tidak ada shell OS, tidak ada
aksi terhadap akun/perangkat/jaringan/grup/nomor/platform nyata.

ALUR
  index.html (intro) -> login.html (login -> fingerprint -> ninja loading) -> dashboard.html
  Login: Ninja67 / Glitch76 (case-sensitive). 5x gagal = kunci 30 detik. Password tidak disimpan.
  Intro, fingerprint, dan ninja loading punya tombol SKIP + timer fallback.

DEPLOY (GitHub -> Vercel)
  1. Upload isi folder ini ke repo GitHub (root repo = folder ini).
  2. Vercel: Import repo, Framework Preset = "Other", tanpa build command, output = root.
  CATATAN: dashboard memuat pages/*.html lewat fetch(), jadi WAJIB dibuka lewat server
  (Vercel / `python3 -m http.server`). Dibuka langsung via file:// akan menampilkan kartu penjelasan.

STRUKTUR
  index.html login.html dashboard.html style.css responsive.css
  app.js animation.js fingerprint.js navigation.js storage.js image-loader.js simulator.js
  home.js bug.js bug-group.js ban-group.js report.js hack.js osint.js network.js terminal.js
  sender.js group.js security.js activity.js statistics.js notifications.js tools.js settings.js
  pages/*.html (17 modul)   assets/images/*.webp   assets/icons   assets/effects

GAMBAR
  Penyebab gambar rusak sebelumnya: hanya ada satu SVG, tanpa aset WebP dan tanpa fallback.
  Sekarang: ./assets/images/{blackhole,ninja,background,fallback}.webp (path relatif, huruf kecil).
  image-loader.js: preload, deteksi gagal, log path yang gagal, fallback fallback.webp -> placeholder CSS.
  TOOLS > IMAGE TEST menampilkan LOADED/FAILED + PATH, dan tombol RELOAD ASSETS.

PENYIMPANAN
  localStorage (fallback memori). Data rusak dipulihkan otomatis + notifikasi. Password tidak pernah disimpan.

SENDER
  Hanya profil lokal. Nomor tidak pernah dipakai untuk mengirim apa pun.
