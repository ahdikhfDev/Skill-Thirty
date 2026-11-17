# Cara Kerja Clone Website dari Satu URL

Dokumen ini menjelaskan alur kerja yang saya pakai ketika diminta
"clone website ini" dari sebuah URL — seperti kasus `openbot.run` →
**ThirtyCLI** di repo ini. Tujuannya bukan menyalin backend, tapi
menghasilkan **clone statis HTML/CSS/JS** yang secara visual dan
interaktif terasa hampir identik, lalu siap di-rebrand.

---

## 0. Dulu, definisikan "hampir sempurna"

"Clone sempurna" yang realistis untuk situs statis berarti:

| Aspek | Target |
|---|---|
| Layout | Posisi, grid, jarak, dan breakpoint sama (toleransi ±1–2px) |
| Tipografi | Font, ukuran, tracking, line-height sama |
| Warna | Nilai hex/rgba sama (atau palet pengganti yang konsisten) |
| Aset | Logo, ikon, ilustrasi, dan tekstur ikut |
| Animasi | Entrance, hover, scroll reveal, marquee, parallax ikut |
| Interaksi | Dropdown, mega menu, accordion, tab, menu mobile berfungsi |
| Performa | Tanpa error console, tanpa overflow horizontal, tidak janky |

Yang **tidak** ikut: backend, database, auth, analytics, A/B testing,
SEO dinamis, dan konten yang di-fetch dari API saat runtime.

---

## 1. Fase 0 — Batas & legal

Sebelum mulai:

- Clone untuk belajar/referensi desain → aman.
- Clone untuk dipublikasikan → ganti brand, copy, dan aset milik pihak
  ketiga. Jangan pakai nama, logo, atau teks pemilik aslinya.
- Jangan bawa script tracking, iklan, chat widget, atau kredensial.
- Catat di README bahwa ini rebrand fiktif / bukan afiliasi.

Di repo ini aturannya ditulis eksplisit di `README.md`.

---

## 2. Fase 1 — Recon

Tujuan: paham struktur sebelum menulis satu baris kode.

1. **Buka URL dan petakan section.** Dari atas ke bawah: nav, hero,
   social proof, fitur, pricing, tim, FAQ, perbandingan, download, CTA,
   footer. Beri nama tiap section.
2. **Tebak tech stack.** Lihat markup: class acak (Tailwind), `__next`
   (Next.js), `data-reactroot` (React), atau HTML polos. Ini menentukan
   cara mengambil CSS.
3. **Inventaris aset.** Cari di HTML: `<img>`, `<svg>`, `<video>`,
   `background-image`, `@font-face`, `<canvas>`, file `.json`.
4. **Catat interaksi yang terlihat.** Dropdown, hover, sticky, scroll
   reveal, marquee, kursor kustom.
5. **Ukur halaman.** Tinggi total, lebar container, gutter, lebar
   breakpoint.

Output fase ini: **peta section** + **daftar aset** + **daftar interaksi**.

> Tips: kalau pakai tool `fetch` yang mengubah halaman jadi markdown,
> itu bagus untuk **teks dan urutan section**, tapi **tidak** untuk CSS.
> Untuk styling, ambil HTML mentah dan file CSS-nya secara terpisah
> (lihat Fase 2).

---

## 3. Fase 2 — Ambil aset mentah

Ambil apa adanya dulu, rapikan belakangan:

```bash
# HTML mentah
curl -sL https://target.com/ -o _raw/page.html

# Temukan stylesheet & script
grep -oE 'href="[^"]+\.css' _raw/page.html
grep -oE 'src="[^"]+\.js'   _raw/page.html

# Unduh ke folder sementara
mkdir -p _raw/assets
curl -sL https://target.com/assets/app.css -o _raw/assets/app.css
```

Yang paling sering jadi masalah:

- **CSS ter-minify / satu bundle besar.** Jangan diparse manual; extract
  nilai yang dipakai lewat *computed styles* di browser (Fase 3).
- **Font eksternal.** Unduh `.woff2`, lalu embed base64 kalau ingin
  halaman tetap jalan via `file://`:

  ```bash
  base64 -w0 font.woff2 > font.b64
  ```

  ```css
  @font-face {
    font-family: "Inter";
    src: url("data:font/woff2;base64,....") format("woff2");
  }
  ```

- **SVG sprite inline.** Situs sering menaruh semua ikon di satu `<svg>`
  tersembunyi berisi `<symbol id="...">`. Ambil utuh, simpan sebagai
  sprite di awal `<body>`, lalu pakai `<use href="#id">`. Ini bikin
  clone ringan dan tajam di semua resolusi.
- **Gambar.** Simpan ukuran aslinya, jangan upscale tangkapan layar.

---

## 4. Fase 3 — Bedah desain jadi design token

Jangan menebak warna dan ukuran dari screenshot. Baca nilai aslinya.

```js
// Jalankan di Playwright
const tokens = await page.evaluate(() => {
  const cs = (sel, prop) => getComputedStyle(document.querySelector(sel))[prop];
  return {
    bg: cs("body", "backgroundColor"),
    text: cs("h1", "color"),
    font: cs("h1", "fontFamily"),
    size: cs("h1", "fontSize"),
    weight: cs("h1", "fontWeight"),
    tracking: cs("h1", "letterSpacing"),
    radius: cs(".card", "borderRadius"),
    shadow: cs(".card", "boxShadow"),
    ease: cs(".card", "transitionTimingFunction"),
  };
});
```

Lalu tuangkan ke `css/base.css`:

```css
:root {
  --bg: #1a1a1a;
  --surface: #212121;
  --text: #fff;
  --accent: #ffd166;
  --radius-lg: 24px;
  --container: 1200px;
  --gutter: clamp(20px, 4vw, 40px);
  --ease-soft: cubic-bezier(.22, 1, .36, 1);
  --font: "Inter", system-ui, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

Kenapa token dulu? Karena saat rebrand, cukup ganti beberapa nilai di
satu tempat — bukan berburu ratusan hex di seluruh file.

---

## 5. Fase 4 — Rebuild bertahap

Urutan yang paling aman:

1. **Shell**: reset, token, tipografi, container, header, footer.
2. **Satu section per langkah**: hero → fitur → pricing → tim → FAQ →
   compare → download → CTA → footer.
3. **Layout dulu, detail kemudian.** Pastikan grid dan jarak benar
   sebelum animasi.
4. **Cek tiap section di browser** sebelum lanjut. Lebih murah
   memperbaiki satu section daripada seluruh halaman.

Pola yang sering muncul dan cara menanganinya:

| Pola | Pendekatan |
|---|---|
| Bento grid | `grid-template-columns` + `grid-area` per kartu |
| Sticky card stack | `position: sticky` + CSS var `--covered` dari scroll |
| Marquee | duplikat track 2× + `translateX(-50%)` + animation |
| Scroll reveal | `IntersectionObserver` + class, `opacity/transform` |
| Canvas partikel | satu `<canvas>` + `requestAnimationFrame`, hormati reduced motion |
| Honeycomb | generate hexagon via JS/clip-path, simpan palet di array |
| Mega menu | satu panel absolute, buka/tutup via `hidden` + `aria-expanded` |

---

## 6. Fase 5 — Port interaksi & animasi

Buat daftar interaksi, lalu kerjakan satu per satu:

- Dropdown bahasa & menu download
- Mega menu "Plugins"
- Menu mobile
- Accordion FAQ (`aria-expanded`, tinggi animasi)
- Tabs / toggle pricing (kalau ada)
- Hover state kartu, tombol, link
- Scroll reveal, sticky progress
- Reduced motion

Aturan penting:

```css
@media (prefers-reduced-motion: reduce) {
  .anything-with-animation { animation: none !important; }
}
```

Dan pastikan elemen yang **hanya muncul lewat animasi** punya state
default yang tetap terlihat (jangan `opacity: 0` tanpa fallback), supaya
halaman tetap masuk akal tanpa JS atau tanpa motion.

Animasi CSS vs JS:

- **CSS keyframes** untuk loop sederhana (float, sway, blink, marquee,
  rotate). Murah dan jalan di compositor.
- **JS / `requestAnimationFrame`** untuk yang butuh hitungan
  (partikel, posisi pulse di sepanjang garis, parallax pointer).
- **Hindari** animasi properti layout (`left`, `width`, `margin`) di
  loop panjang; pakai `transform`, `translate`, `scale`, `rotate`.

---

## 7. Fase 6 — Rebrand

Clone dulu, baru rebrand. Urutannya:

1. **Ganti identitas**: nama, logo (SVG symbol + favicon), judul, meta.
2. **Ganti copy**: sesuaikan istilah dengan produk baru.
3. **Ganti palet**: ubah token, bukan semua hex satu-satu.
4. **Ganti aset pihak ketiga** yang tidak relevan.
5. **Verifikasi visual**: scan sisa warna lama.

Scan warna dingin (contoh: memastikan tidak ada biru/ungu tersisa):

```js
const cold = await page.evaluate(() => {
  const parse = (s) => {
    const m = s && s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? [ +m[1], +m[2], +m[3] ] : null;
  };
  // ... hitung hue, filter 195–295°, saturasi > 30%
});
```

> **Peringatan:** jangan find/replace massal dengan regex pada HTML.
> Saya pernah merusak markup karena pola `<div` saling tumpang tindih.
> Setelah transformasi regex apa pun, **selalu** validasi struktur
> (parser HTML / brace count / buka di browser).

---

## 8. Fase 7 — QA loop

Ini bagian yang membuat hasilnya "hampir sempurna". Loop-nya:
**screenshot → bandingkan → perbaiki → ulangi.**

### 8.1 Server lokal

`file://` bisa berbeda dari `http://` (font, module, fetch). Pakai
server kecil:

```js
const server = http.createServer((req, res) => { /* baca file */ });
await new Promise((r) => server.listen(4199, r));
```

### 8.2 Screenshot yang benar

```js
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

// full page — matikan animasi supaya tidak blur / tidak stabil
await page.screenshot({ path: "full.png", fullPage: true, animations: "disabled" });
```

Tiga jebakan yang sering bikin screenshot palsu:

1. **Scroll reveal** → section bawah tampak kosong. Scroll dulu:
   ```js
   const h = await page.evaluate(() => document.body.scrollHeight);
   for (let y = 0; y < h; y += 600) {
     await page.evaluate((v) => window.scrollTo(0, v), y);
     await page.waitForTimeout(100);
   }
   await page.evaluate(() => window.scrollTo(0, 0));
   ```
2. **Animasi infinite** → `locator.screenshot()` bisa timeout
   ("element is not stable"). Pakai `page.screenshot({ clip })` atau
   `animations: "disabled"`.
3. **Tulis file** — di Windows, headless Chrome kadang tidak boleh
   menulis di folder project. Tulis ke temp lalu salin.

### 8.3 Pemeriksaan otomatis

```js
const info = await page.evaluate(() => ({
  overflowX: document.documentElement.scrollWidth > window.innerWidth,
  height: document.body.scrollHeight,
  font: getComputedStyle(document.body).fontFamily,
}));
```

Checklist QA:

- [ ] Tidak ada error console / `pageerror`
- [ ] Tidak ada overflow horizontal di 1440, 1280, 1024, 390
- [ ] Screenshot desktop & mobile sesuai referensi
- [ ] Semua section muncul setelah scroll
- [ ] Dropdown, menu, accordion berfungsi
- [ ] `prefers-reduced-motion` tidak menyembunyikan konten
- [ ] Warna/aset lama tidak tersisa
- [ ] Halaman tetap wajar tanpa JS (konten inti terlihat)
- [ ] Tidak ada file sampah (`_ref`, script bantu, screenshot)

### 8.4 Cek performa kasar

```js
const fps = await page.evaluate(() => new Promise((res) => {
  let n = 0; const t0 = performance.now();
  const tick = () => { n++; performance.now() - t0 < 1500
    ? requestAnimationFrame(tick)
    : res(Math.round(n / ((performance.now() - t0) / 1000))); };
  requestAnimationFrame(tick);
}));
```

Kalau turun drastis, curigai: blur/filter besar yang beranimasi,
`background-position` di banyak elemen, atau canvas full-screen dengan
ratusan partikel.

---

## 9. Fase 8 — Rapikan & dokumentasikan

- Hapus folder kerja: `_ref/`, script `*.py` sementara, screenshot uji.
- Perbarui `README.md`: cara jalan, struktur file, catatan rebrand.
- Jalankan validasi terakhir:
  ```bash
  node --check js/main.js
  ```
- Cek struktur HTML dan brace CSS seimbang.
- Simpan hasil akhir dalam keadaan bisa dibuka tanpa build step.

---

## 10. Jebakan yang sudah terbukti

| Jebakan | Akibat | Solusi |
|---|---|---|
| `fetch` mengubah halaman jadi markdown | CSS hilang | ambil HTML/CSS mentah terpisah |
| Regex global di HTML | markup rusak, tag hilang | validasi dengan parser setelah transformasi |
| Screenshot tanpa scroll | section reveal kosong | scroll penuh dulu |
| Screenshot elemen beranimasi | timeout "not stable" | `clip` + `animations: "disabled"` |
| Font tidak di-embed | teks fallback saat `file://` | base64 `@font-face` |
| Animasi infinite di semua elemen | boros GPU, janky | batasi, pakai transform, hormati reduced motion |
| `opacity: 0` untuk reveal | konten hilang tanpa JS | state default terlihat, animasi hanya memperhalus |
| Menyalin script analytics | error / bocor data | jangan diambil |
| Copywriting & logo asli | masalah legal | rebrand penuh |

---

## 11. Template prompt yang bisa dipakai

```text
Clone https://contoh.com menjadi HTML/CSS/JS statis di folder ini.

- Pertahankan layout, tipografi, warna, dan animasi sedekat mungkin.
- Semua aset (logo, ikon, font) jadi file lokal / SVG inline.
- Tanpa build step; harus jalan via file:// dan http://.
- Interaksi wajib: dropdown, mega menu, accordion, menu mobile,
  scroll reveal.
- Hormati prefers-reduced-motion.
- Verifikasi dengan screenshot 1440px dan 390px, tanpa error console,
  tanpa overflow horizontal.
- Setelah selesai, rapikan file sementara dan perbarui README.
```

Kalau ingin sekalian rebrand:

```text
Setelah clone jadi, rebrand menjadi "NamaBaru":
- ganti nama, logo, dan copy
- palet baru: <warna>
- pertahankan struktur dan animasi
- pastikan tidak ada aset/warna brand lama yang tersisa
```

---

## 12. Batasan yang perlu jujur disampaikan

- Konten yang dimuat dinamis (API, CMS, personalisasi) hanya bisa
  di-hardcode sebagai contoh.
- Checkout, login, pencarian, dan form tidak berfungsi tanpa backend.
- Animasi berbasis library (GSAP, Lottie, WebGL) bisa didekati ulang
  dengan CSS/JS, tapi tidak selalu identik.
- Hasil terbaik didapat dengan iterasi visual, bukan sekali jadi:
  clone → screenshot → bandingkan → perbaiki.

---

## 13. Dua target output: static vs React + Vite

Clone bisa dihasilkan dalam dua bentuk. Pilih di awal, sisanya sama saja.

| Target | Kapan dipakai | Struktur | Build |
|---|---|---|---|
| **static** | halaman drop-in, tanpa toolchain, buka dari `file://`, handoff cepat | `index.html` + `css/` + `js/` + `assets/` | tidak ada |
| **react-vite** | halaman akan tumbuh (routing, app logic, i18n, design system) atau user minta React | `src/components/` per section, `src/styles/`, `public/` | Vite |

Aturan yang membedakan:

- **Static**: font di-embed base64, sprite `<symbol>` tetap di HTML, satu file JS, tanpa dependency.
- **React**: token pindah apa adanya ke `src/styles/tokens.css`, satu komponen per section dengan class name yang sama, sprite dirender sekali sebagai `Sprite.jsx`, gambar/font di `public/`, dan setiap effect wajib cleanup (`cancelAnimationFrame`, `removeEventListener`, `disconnect`).
- **Verifikasi**: static pakai `--root`, React pakai dev server (`--url http://127.0.0.1:5173/`) lalu ulangi di hasil `npm run build` + `npm run preview`.
- Jangan mencampur: jangan menambahkan React/Tailwind ke clone statis, dan jangan mengirim bundle JS sebagai "clone statis".

Panduan lengkap struktur folder dan mapping section → komponen ada di skill
`references/targets.md`.

## 14. Pakai skill ini di agent lain

Skill globalnya ada di:

```
~/.agents/skills/clone-website/
├── SKILL.md
├── scripts/verify.mjs
└── references/
    ├── targets.md
    ├── qa-checklist.md
    └── other-agents.md
```

Cara memasang di agent lain (detail di `references/other-agents.md`):

| Agent | Lokasi |
|---|---|
| Zed | sudah otomatis di `~/.agents/skills/` |
| Claude Code | `~/.claude/skills/clone-website/` atau `.claude/skills/` |
| Cursor | `.cursor/rules/clone-website.mdc` (frontmatter + isi SKILL) |
| Codex CLI / OpenCode | append ke `AGENTS.md` |
| Gemini CLI | append ke `GEMINI.md` |
| Windsurf | `.windsurf/rules/clone-website.md` |
| Cline | `.clinerules/clone-website.md` |
| Copilot | `.github/copilot-instructions.md` |
| Chat-only agent | tempel versi ringkas dari `references/other-agents.md` |

Untuk agent yang tidak mendukung folder skill, ambil isi `SKILL.md` tanpa
frontmatter:

```bash
node -e "const fs=require('fs');const t=fs.readFileSync(process.argv[1],'utf8');process.stdout.write(t.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,''))" ~/.agents/skills/clone-website/SKILL.md >> AGENTS.md
```

## Studi kasus singkat: repo ini

- Sumber: satu URL landing page.
- Hasil: `index.html` + `css/base.css` + `css/landing.css` +
  `css/preview.css` + `js/main.js`, tanpa dependency runtime.
- 54+ SVG symbol inline untuk ikon, provider, logo, wajah, dan bentuk.
- Font Inter di-embed base64 supaya tetap jalan via `file://`.
- Rebrand total ke ThirtyCLI, tema emas/amber, beam + galaksi canvas,
  terminal preview animasi, dan konstelasi agen.
- Verifikasi: Playwright (Chrome), screenshot desktop/mobile, scan warna,
  cek overflow, cek console, uji `prefers-reduced-motion`.
