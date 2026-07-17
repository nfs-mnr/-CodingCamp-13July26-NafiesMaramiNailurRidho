# Dokumen Desain: Dashboard Enhancements

## Ikhtisar

Dokumen ini mendeskripsikan desain teknis untuk tiga peningkatan pada aplikasi **To-Do Life Dashboard**:

1. **Light/Dark Mode** — modul `Theme_Manager` baru dengan toggle tema yang persisten.
2. **Ubah Durasi Pomodoro Timer** — ekstensi modul `FocusTimer` yang sudah ada dengan kontrol durasi kustom.
3. **Pencegahan Tugas Duplikat** — ekstensi modul `TodoList` yang sudah ada dengan validasi duplikat case-insensitive.

Seluruh implementasi mengikuti arsitektur yang sudah ada: satu file `index.html`, satu `css/style.css`, satu `js/app.js` (pola IIFE `'use strict'`), tanpa framework dan tanpa bundler, dengan persistensi via Browser localStorage API.

---

## Arsitektur

### Gambaran Umum

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│                                                         │
│  <head>                                                 │
│    <script> ← inline anti-FOUC (baca tdld_theme)       │
│    <link> css/style.css                                 │
│  </head>                                                │
│  <body [class="dark"?]>                                 │
│    #storage-error-banner                                │
│    <header>                                             │
│      #theme-toggle (button)                             │
│    </header>                                            │
│    #dashboard-grid                                      │
│      .widget → FocusTimer                              │
│        #timer-duration-row                              │
│      .widget → TodoList                                 │
│      .widget → QuickLinks                              │
│      .widget → Greeting                                 │
│  </body>                                                │
└─────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│                      js/app.js (IIFE)                   │
│                                                         │
│  Storage          ← localStorage helpers                │
│  Theme_Manager    ← BARU: toggle tema, anti-FOUC        │
│  Greeting         ← tidak berubah                       │
│  FocusTimer       ← MODIFIKASI: customDuration          │
│  TodoList         ← MODIFIKASI: isDuplicate()           │
│  QuickLinks       ← tidak berubah                       │
│                                                         │
│  Bootstrap → DOMContentLoaded                           │
└─────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│                    localStorage                         │
│                                                         │
│  tdld_tasks           → JSON array of Task              │
│  tdld_links           → JSON array of Link              │
│  tdld_theme           → "light" | "dark"                │
│  tdld_timer_duration  → integer 1–180                   │
└─────────────────────────────────────────────────────────┘
```

### Alur Inisialisasi

```
Browser parse <head>
  └─> inline <script> baca tdld_theme dari localStorage
        ├─ "dark"  → tambah class "dark" ke <body>
        └─ lainnya → tidak ada perubahan (Light_Mode default)

DOMContentLoaded
  └─> Theme_Manager.init()   → pasang event listener #theme-toggle, sinkronisasi label
  └─> Greeting.init()
  └─> FocusTimer.init()      → baca tdld_timer_duration, set customDuration, render
  └─> TodoList.init()        → baca tdld_tasks, render
  └─> QuickLinks.init()      → baca tdld_links, render
```

---

## Komponen dan Antarmuka

### 1. Theme_Manager (Modul Baru)

**Tanggung jawab:** Mengelola preferensi tema (light/dark), menerapkan class CSS ke `<body>`, dan menyimpan ke localStorage.

**State internal:**
```
Theme_Manager.currentTheme  → "light" | "dark"
```

**API publik:**

| Method | Deskripsi |
|--------|-----------|
| `init()` | Sinkronisasi label tombol dengan tema saat ini; pasang listener pada `#theme-toggle` |
| `toggle()` | Beralih antara light dan dark; simpan ke `tdld_theme`; perbarui label tombol |
| `applyTheme(theme)` | Terapkan class `dark` ke `<body>` jika `theme === "dark"`, hapus jika tidak; perbarui `currentTheme` |
| `getTheme()` | Kembalikan nilai `currentTheme` |

**Catatan penting:** Pembacaan awal dari localStorage dan penerapan class ke `<body>` dilakukan oleh inline `<script>` di `<head>` (bukan oleh `Theme_Manager.init()`), sehingga mencegah FOUC (Flash of Unstyled Content). `Theme_Manager.init()` hanya mengurus UI interaktif (label, event listener).

**Integrasi dengan Storage:**
```javascript
Theme_Manager.toggle = function () {
  const next = document.body.classList.contains('dark') ? 'light' : 'dark';
  Storage.set('tdld_theme', next);  // bisa throw → ditangani oleh Storage
  Theme_Manager.applyTheme(next);
  Theme_Manager._updateLabel();
};
```

---

### 2. FocusTimer (Modifikasi Modul yang Sudah Ada)

**Perubahan pada state:**

| State | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `customDuration` | integer | `25` | Durasi dalam menit, dibaca dari `tdld_timer_duration` saat `init()` |
| `remainingSeconds` | integer | `customDuration * 60` | Diinisialisasi dari `customDuration`, bukan hardcoded 1500 |
| `running` | boolean | `false` | Tidak berubah |

**Method baru / yang dimodifikasi:**

| Method | Perubahan |
|--------|-----------|
| `init()` | Baca `tdld_timer_duration` dari localStorage; set `customDuration`; `remainingSeconds = customDuration * 60`; render; pasang listener pada `#timer-duration-set` |
| `setDuration(val)` | Method baru: validasi, set `customDuration`, simpan ke localStorage, reset display |
| `reset()` | Gunakan `customDuration * 60` bukan `1500` |
| `_onDurationSet()` | Handler untuk klik tombol `#timer-duration-set`; baca `#timer-duration-input`, panggil `setDuration()` |
| `_updateDurationControls()` | Nonaktifkan `#timer-duration-input` dan `#timer-duration-set` saat `running === true` |
| `_renderDurationDisplay()` | Perbarui teks `#timer-duration-display` |

**Logika validasi `setDuration(val)`:**
```
val_int = parseInt(val, 10)
JIKA Number.isInteger(val_int) && val_int >= 1 && val_int <= 180:
    customDuration = val_int
    Storage.set('tdld_timer_duration', val_int)
    remainingSeconds = val_int * 60
    sembunyikan pesan error
    render display
LAINNYA:
    tampilkan pesan error inline "Durasi harus berupa bilangan bulat antara 1 dan 180 menit."
    JANGAN ubah customDuration
```

**Logika fallback saat `init()`:**
```
raw = Storage.get('tdld_timer_duration')
val = parseInt(raw, 10)
IF Number.isInteger(val) && val >= 1 && val <= 180:
    customDuration = val
ELSE:
    customDuration = 25   ← default
```

---

### 3. TodoList (Modifikasi Modul yang Sudah Ada)

**Method baru / yang dimodifikasi:**

| Method | Perubahan |
|--------|-----------|
| `isDuplicate(description, excludeId)` | Method baru: kembalikan `true` jika ada task lain dengan `desc.toLowerCase().trim()` yang sama |
| `add()` | Panggil `isDuplicate()` sebelum validasi lain; tampilkan error jika duplikat; jangan hapus input |
| `saveEdit()` | Panggil `isDuplicate(newDesc, task.id)` sebelum menyimpan; tampilkan error jika duplikat |

**Logika `isDuplicate(description, excludeId)`:**
```javascript
isDuplicate(description, excludeId = null) {
  const normalized = description.toLowerCase().trim();
  return this.tasks.some(task =>
    task.id !== excludeId &&
    task.description.toLowerCase().trim() === normalized
  );
}
```

**Pesan error:** `"Tugas '${description.trim()}' sudah ada dalam daftar."`

**Perbedaan perilaku antara `add()` dan `saveEdit()`:**

| Skenario | `excludeId` |
|----------|-------------|
| `add()` | `null` — bandingkan dengan semua task |
| `saveEdit()` | `task.id` — kecualikan task yang sedang diedit |

---

## Perubahan Struktur HTML

### Penambahan Inline Script Anti-FOUC di `<head>`

```html
<head>
  <!-- ... meta, title, link CSS ... -->
  <script>
    (function() {
      try {
        if (localStorage.getItem('tdld_theme') === 'dark') {
          document.body.classList.add('dark');
        }
      } catch(e) { /* localStorage tidak tersedia — abaikan */ }
    })();
  </script>
</head>
```

Inline script ini harus ditempatkan **setelah** `<link rel="stylesheet">` agar CSS sudah diparse, tetapi **sebelum** `</head>` dan sebelum `<body>` dirender. Ini memastikan class `dark` sudah ada sebelum browser melukis halaman.

### Penambahan `<header>` dengan Theme_Toggle

```html
<body>
  <div id="storage-error-banner" hidden>...</div>

  <header id="app-header">
    <h1>To-Do Life Dashboard</h1>
    <button id="theme-toggle" aria-label="Aktifkan mode gelap">🌙 Mode Gelap</button>
  </header>

  <main id="dashboard-grid">
    <!-- widget-widget yang sudah ada -->
  </main>
</body>
```

### Penambahan `#timer-duration-row` di dalam Widget FocusTimer

```html
<div class="widget" id="widget-timer">
  <h2>Focus Timer</h2>
  <div id="timer-display">25:00</div>

  <div id="timer-controls">
    <button id="timer-start">Mulai</button>
    <button id="timer-stop">Berhenti</button>
    <button id="timer-reset">Reset</button>
  </div>

  <div id="timer-duration-row">
    <label for="timer-duration-input">Durasi:</label>
    <input
      id="timer-duration-input"
      type="number"
      min="1"
      max="180"
      value="25"
      aria-label="Durasi timer dalam menit"
    >
    <button id="timer-duration-set">Set</button>
    <span id="timer-duration-display">Durasi aktif: 25 menit</span>
    <span id="timer-duration-error" class="field-error" hidden></span>
  </div>
</div>
```

### Penambahan Error Container di TodoList

```html
<div class="widget" id="widget-todo">
  <h2>Daftar Tugas</h2>
  <div id="todo-add-row">
    <input id="todo-input" type="text" placeholder="Tambah tugas baru...">
    <button id="todo-add">Tambah</button>
  </div>
  <span id="todo-add-error" class="field-error" hidden></span>
  <ul id="todo-list"></ul>
</div>
```

---

## Perubahan CSS

### Variabel CSS untuk Theming

```css
/* ============================================================
   Tema: Variabel CSS
   ============================================================ */
:root {
  --bg:           #f0f2f5;
  --surface:      #ffffff;
  --text-primary: #2d3748;
  --text-muted:   #718096;
  --border:       #e2e8f0;
  --accent:       #4299e1;
  --accent-hover: #3182ce;
  --shadow:       rgba(0, 0, 0, 0.1);
  --error-bg:     #e53e3e;
}

body.dark {
  --bg:           #1a202c;
  --surface:      #2d3748;
  --text-primary: #f7fafc;
  --text-muted:   #a0aec0;
  --border:       #4a5568;
  --accent:       #63b3ed;
  --accent-hover: #90cdf4;
  --shadow:       rgba(0, 0, 0, 0.4);
  --error-bg:     #fc8181;
}
```

### Perubahan Selector yang Menggunakan Variabel

```css
body {
  background: var(--bg);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

.widget {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px var(--shadow);
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

.widget h2 {
  color: var(--text-primary);
}
```

### Style Header dan Theme Toggle

```css
#app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  transition: background-color 0.3s, border-color 0.3s;
}

#theme-toggle {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

#theme-toggle:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
```

### Style Timer Duration Row dan Error

```css
#timer-duration-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

#timer-duration-input {
  width: 64px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  color: var(--text-primary);
}

#timer-duration-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

#timer-duration-display {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.field-error {
  font-size: 0.8125rem;
  color: var(--error-bg);
  width: 100%;
}
```

---

## Model Data

### Skema localStorage Lengkap

| Key | Tipe | Nilai Valid | Default |
|-----|------|-------------|---------|
| `tdld_tasks` | JSON string (array) | Array dari objek `Task` | `"[]"` |
| `tdld_links` | JSON string (array) | Array dari objek `Link` | `"[]"` |
| `tdld_theme` | string | `"light"` atau `"dark"` | `"light"` |
| `tdld_timer_duration` | string (angka) | Integer 1–180 | `"25"` |

### Objek Task (tidak berubah)

```json
{
  "id": "string — ID unik (misalnya Date.now().toString())",
  "description": "string — teks tugas",
  "completed": "boolean"
}
```

### Objek Link (tidak berubah)

```json
{
  "id": "string — ID unik",
  "label": "string — nama tautan",
  "url": "string — URL lengkap"
}
```

### Aturan Validasi localStorage

**`tdld_theme`:**
- Nilai valid: tepat `"light"` atau `"dark"` (string)
- Nilai tidak valid: diabaikan, fallback ke `"light"`

**`tdld_timer_duration`:**
- Nilai valid: string yang saat di-`parseInt` menghasilkan integer dalam `[1, 180]`
- Nilai tidak valid: diabaikan, fallback ke `25`

---

## Correctness Properties

*Sebuah properti adalah karakteristik atau perilaku yang harus selalu benar di seluruh eksekusi sistem yang valid — pada dasarnya, pernyataan formal tentang apa yang harus dilakukan sistem. Properti berfungsi sebagai jembatan antara spesifikasi yang dapat dibaca manusia dan jaminan kebenaran yang dapat diverifikasi mesin.*

### Property 1: Toggle Tema adalah Involution (Round-Trip)

*Untuk sembarang* keadaan tema awal (light atau dark), menjalankan `Theme_Manager.toggle()` dua kali berturut-turut harus menghasilkan keadaan tema yang identik dengan keadaan semula.

**Validates: Requirements 1.2, 1.3**

---

### Property 2: Persistensi Tema ke localStorage

*Untuk sembarang* tema `t` ∈ `{"light", "dark"}`, setelah `Theme_Manager.applyTheme(t)` dipanggil dan localStorage ditulis, membaca kembali nilai `tdld_theme` dari localStorage harus mengembalikan `t`.

**Validates: Requirements 1.4, 4.1, 4.3**

---

### Property 3: Label Toggle Mencerminkan Tema Aktif

*Untuk sembarang* nilai tema aktif, teks atau `aria-label` pada elemen `#theme-toggle` harus mengandung informasi yang secara eksplisit menunjukkan tema yang sedang aktif (bukan tema sebaliknya).

**Validates: Requirements 1.7**

---

### Property 4: Validasi Rentang Durasi Timer

*Untuk sembarang* nilai integer `d`, `FocusTimer.setDuration(d)` harus:
- Berhasil (menerima, mengubah `customDuration`, dan menyimpan ke localStorage) jika dan hanya jika `d` adalah integer dan `1 ≤ d ≤ 180`.
- Menolak (tidak mengubah `customDuration`, menampilkan pesan error) untuk semua nilai di luar rentang tersebut atau yang bukan integer positif.

**Validates: Requirements 2.2, 2.3**

---

### Property 5: Round-Trip Persistensi Durasi Timer

*Untuk sembarang* durasi valid `d` ∈ `[1, 180]`, setelah `FocusTimer.setDuration(d)` berhasil disimpan ke localStorage, mensimulasikan inisialisasi ulang (membaca `tdld_timer_duration` lalu meng-assign ke `customDuration`) harus menghasilkan `customDuration === d`.

**Validates: Requirements 2.5, 2.6, 4.2, 4.4**

---

### Property 6: Reset Menggunakan `customDuration`

*Untuk sembarang* nilai `customDuration` yang valid `d` ∈ `[1, 180]`, setelah `FocusTimer.reset()` dipanggil, nilai `remainingSeconds` harus sama dengan `d * 60`.

**Validates: Requirements 2.9**

---

### Property 7: Input Durasi Dinonaktifkan saat Timer Berjalan

*Untuk sembarang* keadaan timer di mana `running === true`, elemen `#timer-duration-input` dan `#timer-duration-set` harus memiliki atribut `disabled` bernilai truthy.

**Validates: Requirements 2.8**

---

### Property 8: Deteksi Duplikat Bersifat Case-Insensitive dan Trim-Aware

*Untuk sembarang* deskripsi tugas `s` yang sudah ada dalam koleksi `TodoList`, `TodoList.isDuplicate(variant)` harus mengembalikan `true` untuk semua `variant` yang merupakan variasi dari `s` dalam hal:
- Kapitalisasi huruf (misalnya `"belajar"` vs `"BELAJAR"` vs `"Belajar"`), dan/atau
- Spasi di awal atau akhir string (misalnya `"  belajar  "` vs `"belajar"`).

**Validates: Requirements 3.1, 3.2, 3.5**

---

### Property 9: Edit Tugas Tidak Menganggap Dirinya Sendiri sebagai Duplikat

*Untuk sembarang* tugas yang ada dalam koleksi dengan `id` tertentu dan `description` tertentu, memanggil `TodoList.isDuplicate(task.description, task.id)` harus selalu mengembalikan `false` (tidak menganggap task sebagai duplikat dari dirinya sendiri).

**Validates: Requirements 3.6**

---

### Property 10: Penambahan Tugas Unik Selalu Berhasil

*Untuk sembarang* koleksi tugas dan deskripsi `s` yang (setelah `toLowerCase().trim()`) tidak cocok dengan tugas mana pun yang ada, memanggil `TodoList.add(s)` harus berhasil dan panjang koleksi harus bertambah tepat satu.

**Validates: Requirements 3.4**

---

## Penanganan Error

### Kegagalan localStorage

Semua operasi baca/tulis localStorage dibungkus dalam `try/catch`. Jika operasi **tulis** gagal (misalnya storage penuh atau diblokir), sistem harus:
1. Tetap menerapkan perubahan UI (tema atau durasi tetap berlaku di sesi ini).
2. Menampilkan `#storage-error-banner` yang sudah ada dengan pesan yang relevan.
3. TIDAK membatalkan atau mengembalikan perubahan UI.

Jika operasi **baca** gagal saat inisialisasi, sistem menggunakan nilai default (light mode, 25 menit).

**Contoh implementasi di `Storage`:**
```javascript
const Storage = {
  get(key, fallback = null) {
    try { return localStorage.getItem(key); }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, String(value)); return true; }
    catch (e) {
      // tampilkan error banner
      const banner = document.getElementById('storage-error-banner');
      if (banner) banner.hidden = false;
      return false;
    }
  }
};
```

### Validasi Input yang Gagal

- **Timer duration invalid:** Tampilkan teks error di `#timer-duration-error` (elemen `<span>` dengan class `.field-error`). Hapus error saat input berikutnya valid.
- **Duplikat task:** Tampilkan teks error di `#todo-add-error`. Hapus error saat task unik berhasil ditambahkan. Input TIDAK dikosongkan.

---

## Strategi Pengujian

### Pendekatan Dual Testing

Fitur ini menggunakan dua pendekatan pengujian yang saling melengkapi:

1. **Unit test berbasis contoh** — untuk perilaku spesifik, edge case, dan kondisi error.
2. **Property-based test** — untuk properti universal yang harus berlaku di seluruh rentang input.

Library property-based testing yang digunakan: **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript/Node.js).

### Konfigurasi Property Test

- Setiap property test dijalankan minimum **100 iterasi** (fast-check default: 100).
- Setiap test diberi komentar dengan tag referensi:
  ```javascript
  // Feature: dashboard-enhancements, Property 1: Toggle Tema adalah Involution
  ```

### Matriks Pengujian

| Property | Tipe Test | Generator Input | Kondisi yang Diverifikasi |
|----------|-----------|-----------------|---------------------------|
| P1 Toggle Involution | Property | `fc.constantFrom('light', 'dark')` | `toggle(); toggle();` → state awal |
| P2 Persistensi Tema | Property | `fc.constantFrom('light', 'dark')` | `localStorage['tdld_theme'] === tema` |
| P3 Label Toggle | Property | `fc.constantFrom('light', 'dark')` | Label mengandung info tema aktif |
| P4 Validasi Durasi | Property | `fc.integer(-100, 300)` + `fc.string()` | Accept jika [1,180], reject jika tidak |
| P5 Round-Trip Durasi | Property | `fc.integer(1, 180)` | `setDuration(d)` → `init()` → `customDuration === d` |
| P6 Reset Durasi | Property | `fc.integer(1, 180)` | `reset()` → `remainingSeconds === d * 60` |
| P7 Disabled saat Running | Property | `fc.integer(1, 180)` + running=true | Input disabled |
| P8 Duplikat Case-Insensitive | Property | `fc.string()` + variasi case/trim | `isDuplicate` return true untuk semua variasi |
| P9 Edit Tidak Duplikat Sendiri | Property | `fc.string()` + `fc.string()` (sebagai id) | `isDuplicate(desc, id)` → false untuk task sendiri |
| P10 Add Unik Berhasil | Property | `fc.array(fc.string())` + `fc.string()` unik | Panjang koleksi bertambah 1 |

### Unit Test Berbasis Contoh (Tambahan)

- Light mode aktif saat localStorage kosong (edge case 1.6).
- Default durasi 25 menit saat localStorage kosong (edge case 2.7).
- Tampilan `#timer-duration-display` menunjukkan durasi aktif yang benar (2.10).
- Pesan error duplikat menyebutkan deskripsi tugas (3.2).
- Input tidak dikosongkan setelah penolakan duplikat (3.3).
- Setelah menghapus tugas, deskripsi yang sama dapat ditambahkan kembali (3.7).
- Nilai `tdld_theme` tidak valid di localStorage → fallback Light_Mode (4.5).
- Nilai `tdld_timer_duration` tidak valid di localStorage → fallback 25 menit (4.6).
- Kegagalan localStorage write → error banner muncul, UI tetap berubah (4.7).
