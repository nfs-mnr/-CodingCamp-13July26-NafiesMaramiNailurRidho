## Rencana Implementasi: Dashboard Enhancements

## Ikhtisar

Implementasi tiga peningkatan pada To-Do Life Dashboard menggunakan JavaScript vanilla dalam satu file `js/app.js` (pola IIFE), satu `css/style.css`, dan satu `index.html`. Tidak ada bundler maupun framework eksternal. Urutan pengerjaan dimulai dari infrastruktur CSS, perubahan HTML, modul baru/modifikasi di `app.js`, hingga pengujian.

---

## Tasks

- [ ] 1. Infrastruktur CSS — variabel tema dan style baru
  - [ ] 1.1 Tambahkan variabel CSS light/dark dan perbarui selector yang ada di `css/style.css`
    - Tambahkan blok `:root { --bg, --surface, --text-primary, --text-muted, --border, --accent, --accent-hover, --shadow, --error-bg }` sesuai desain
    - Tambahkan blok `body.dark { ... }` yang menimpa semua variabel untuk tema gelap
    - Ganti nilai hardcoded pada `body`, `.widget`, `.widget h2` dengan `var(--bg)`, `var(--surface)`, `var(--text-primary)`
    - Tambahkan `transition: background-color 0.3s, color 0.3s` pada `body` dan komponen yang terpengaruh (≤ 300ms sesuai requirement 1.8)
    - Tambahkan style untuk `#app-header`, `#theme-toggle`, `#theme-toggle:hover`
    - Tambahkan style untuk `#timer-duration-row`, `#timer-duration-input`, `#timer-duration-input:disabled`, `#timer-duration-display`, `.field-error`
    - _Requirements: 1.2, 1.3, 1.8, 2.3, 2.10_

- [ ] 2. Perubahan HTML — struktur baru di `index.html`
  - [ ] 2.1 Tambahkan `<header id="app-header">` dengan tombol `#theme-toggle` di `index.html`
    - Tambahkan `<header id="app-header">` berisi `<h1>` judul dan `<button id="theme-toggle" aria-label="Aktifkan mode gelap">🌙 Mode Gelap</button>`
    - Pastikan header berada sebelum `#dashboard-grid` dan setelah `#storage-error-banner`
    - _Requirements: 1.1, 1.7_
  - [ ] 2.2 Tambahkan `#timer-duration-row` di dalam widget FocusTimer di `index.html`
    - Tambahkan `<div id="timer-duration-row">` berisi `<label>`, `<input id="timer-duration-input" type="number" min="1" max="180" value="25">`, `<button id="timer-duration-set">Set</button>`, `<span id="timer-duration-display">`, dan `<span id="timer-duration-error" class="field-error" hidden>`
    - _Requirements: 2.1, 2.3, 2.10_
  - [ ] 2.3 Tambahkan `#todo-add-error` di dalam widget TodoList di `index.html`
    - Tambahkan `<span id="todo-add-error" class="field-error" hidden></span>` setelah baris `#todo-add-row`
    - _Requirements: 3.2, 3.3_
  - [ ] 2.4 Tambahkan inline script anti-FOUC di `<head>` pada `index.html`
    - Tambahkan `<script>` inline di dalam `<head>`, setelah `<link rel="stylesheet">`, yang membaca `localStorage.getItem('tdld_theme')` dan menambahkan class `dark` ke `document.body` jika nilainya `"dark"`
    - Bungkus dalam `try/catch` agar aman jika localStorage tidak tersedia
    - _Requirements: 1.5_

- [ ] 3. Modul `Storage` — perkuat dengan error handling
  - [ ] 3.1 Implementasi `Storage.get(key, fallback)` dan `Storage.set(key, value)` di `js/app.js`
    - Implementasi `get(key, fallback = null)`: bungkus `localStorage.getItem(key)` dalam `try/catch`, kembalikan `fallback` jika terjadi exception
    - Implementasi `set(key, value)`: bungkus `localStorage.setItem(key, String(value))` dalam `try/catch`, jika gagal tampilkan `#storage-error-banner` (set `hidden = false`) dan kembalikan `false`, jika berhasil kembalikan `true`
    - _Requirements: 4.7_

- [ ] 4. Modul `Theme_Manager` — modul baru di `js/app.js`
  - [ ] 4.1 Implementasi `Theme_Manager` dengan state, `init()`, `toggle()`, `applyTheme()`, `getTheme()`, dan `_updateLabel()`
    - Tambahkan objek `Theme_Manager` di dalam IIFE sebelum `FocusTimer`
    - `init()`: baca status class `dark` dari `document.body` untuk sinkronisasi `currentTheme`; pasang event listener pada `#theme-toggle`; panggil `_updateLabel()`
    - `applyTheme(theme)`: tambah/hapus class `dark` pada `document.body`; set `currentTheme`
    - `toggle()`: tentukan tema berikutnya berdasarkan class `dark` yang ada; panggil `Storage.set('tdld_theme', next)`; panggil `applyTheme(next)`; panggil `_updateLabel()`
    - `_updateLabel()`: perbarui `aria-label` dan teks tombol `#theme-toggle` sesuai tema aktif (label menampilkan aksi yang tersedia, bukan tema saat ini — misalnya jika dark aktif, label "Aktifkan mode terang")
    - `getTheme()`: kembalikan `currentTheme`
    - Tambahkan `Theme_Manager.init()` di blok Bootstrap (`DOMContentLoaded`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_
  - [ ]* 4.2 Tulis property test untuk Property 1: Toggle Tema adalah Involution
    - **Property 1: Toggle Tema adalah Involution (Round-Trip)**
    - **Validates: Requirements 1.2, 1.3**
    - Gunakan `fc.constantFrom('light', 'dark')` sebagai generator; panggil `toggle()` dua kali; verifikasi tema akhir sama dengan tema awal
  - [ ]* 4.3 Tulis property test untuk Property 2: Persistensi Tema ke localStorage
    - **Property 2: Persistensi Tema ke localStorage**
    - **Validates: Requirements 1.4, 4.1, 4.3**
    - Gunakan `fc.constantFrom('light', 'dark')`; setelah `applyTheme(t)` dan `Storage.set`, baca `localStorage.getItem('tdld_theme')`; verifikasi nilainya sama dengan `t`
  - [ ]* 4.4 Tulis property test untuk Property 3: Label Toggle Mencerminkan Tema Aktif
    - **Property 3: Label Toggle Mencerminkan Tema Aktif**
    - **Validates: Requirements 1.7**
    - Gunakan `fc.constantFrom('light', 'dark')`; setelah `applyTheme(t)` dan `_updateLabel()`; verifikasi `aria-label` atau teks `#theme-toggle` mengandung informasi tema yang aktif

- [ ] 5. Modul `FocusTimer` — modifikasi dengan `customDuration` dan `setDuration()`
  - [ ] 5.1 Perluas state `FocusTimer` dan implementasi `init()` yang membaca `tdld_timer_duration` dari localStorage
    - Tambahkan state `customDuration` (default `25`) dan inisialisasi `remainingSeconds = customDuration * 60`
    - Pada `init()`: baca `Storage.get('tdld_timer_duration')`; parse dengan `parseInt`; validasi rentang `[1, 180]`; set `customDuration` jika valid, gunakan `25` sebagai fallback jika tidak valid
    - Pasang event listener pada `#timer-duration-set` yang memanggil `_onDurationSet()`
    - Panggil `_renderDurationDisplay()` pada akhir `init()`
    - _Requirements: 2.6, 2.7, 4.4, 4.6_
  - [ ] 5.2 Implementasi `setDuration(val)` dengan validasi dan `_onDurationSet()` sebagai handler-nya
    - `setDuration(val)`: parse `parseInt(val, 10)`; jika valid `[1, 180]`, set `customDuration`, panggil `Storage.set('tdld_timer_duration', val_int)`, set `remainingSeconds = val_int * 60`, sembunyikan `#timer-duration-error`, panggil `_renderDurationDisplay()` dan render timer display
    - Jika tidak valid: tampilkan pesan `"Durasi harus berupa bilangan bulat antara 1 dan 180 menit."` di `#timer-duration-error`; JANGAN ubah `customDuration`
    - `_onDurationSet()`: baca nilai `#timer-duration-input`, panggil `setDuration()`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 4.2_
  - [ ] 5.3 Modifikasi `reset()` dan `_updateDurationControls()` serta `_renderDurationDisplay()`
    - Ubah `reset()`: gunakan `customDuration * 60` bukan `1500` (hardcoded)
    - Implementasi `_updateDurationControls()`: nonaktifkan `#timer-duration-input` dan `#timer-duration-set` saat `running === true`, aktifkan kembali saat `running === false`
    - Implementasi `_renderDurationDisplay()`: perbarui teks `#timer-duration-display` menjadi `"Durasi aktif: ${customDuration} menit"`
    - Pastikan `_updateDurationControls()` dipanggil setiap kali `running` berubah
    - _Requirements: 2.8, 2.9, 2.10_
  - [ ]* 5.4 Tulis property test untuk Property 4: Validasi Rentang Durasi Timer
    - **Property 4: Validasi Rentang Durasi Timer**
    - **Validates: Requirements 2.2, 2.3**
    - Gunakan `fc.integer(-100, 300)` dan `fc.string()`; verifikasi `setDuration(d)` berhasil jika dan hanya jika `d` adalah integer dan `1 ≤ d ≤ 180`
  - [ ]* 5.5 Tulis property test untuk Property 5: Round-Trip Persistensi Durasi Timer
    - **Property 5: Round-Trip Persistensi Durasi Timer**
    - **Validates: Requirements 2.5, 2.6, 4.2, 4.4**
    - Gunakan `fc.integer(1, 180)`; setelah `setDuration(d)` berhasil, simulasikan inisialisasi ulang dengan membaca `tdld_timer_duration` dan memvalidasi; verifikasi `customDuration === d`
  - [ ]* 5.6 Tulis property test untuk Property 6: Reset Menggunakan `customDuration`
    - **Property 6: Reset Menggunakan `customDuration`**
    - **Validates: Requirements 2.9**
    - Gunakan `fc.integer(1, 180)`; setelah set `customDuration = d`, panggil `reset()`; verifikasi `remainingSeconds === d * 60`
  - [ ]* 5.7 Tulis property test untuk Property 7: Input Durasi Dinonaktifkan saat Timer Berjalan
    - **Property 7: Input Durasi Dinonaktifkan saat Timer Berjalan**
    - **Validates: Requirements 2.8**
    - Gunakan `fc.integer(1, 180)` dengan `running = true`; setelah `_updateDurationControls()` dipanggil; verifikasi `#timer-duration-input.disabled === true` dan `#timer-duration-set.disabled === true`

- [ ] 6. Modul `TodoList` — modifikasi dengan `isDuplicate()` dan validasi duplikat
  - [ ] 6.1 Implementasi `isDuplicate(description, excludeId)` dan integrasikan ke `add()`
    - Tambahkan method `isDuplicate(description, excludeId = null)` yang membandingkan `description.toLowerCase().trim()` dengan semua task yang ada (kecualikan task dengan `id === excludeId`)
    - Modifikasi `add()`: sebelum menambahkan task, panggil `isDuplicate(inputValue)`; jika `true`, tampilkan pesan error `"Tugas '${desc}' sudah ada dalam daftar."` di `#todo-add-error`; JANGAN kosongkan input; JANGAN tambahkan task
    - Jika `add()` berhasil, sembunyikan `#todo-add-error`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_
  - [ ] 6.2 Integrasikan `isDuplicate()` ke `saveEdit()` untuk pencegahan duplikat saat edit
    - Modifikasi `saveEdit()`: panggil `isDuplicate(newDesc, task.id)` dengan `excludeId` sebagai ID task yang sedang diedit; jika `true`, tampilkan pesan error inline; JANGAN simpan perubahan
    - _Requirements: 3.6_
  - [ ]* 6.3 Tulis property test untuk Property 8: Deteksi Duplikat Bersifat Case-Insensitive dan Trim-Aware
    - **Property 8: Deteksi Duplikat Bersifat Case-Insensitive dan Trim-Aware**
    - **Validates: Requirements 3.1, 3.2, 3.5**
    - Gunakan `fc.string()` sebagai deskripsi base; buat variasi kapitalisasi dan spasi; verifikasi `isDuplicate(variant)` mengembalikan `true` untuk semua variasi
  - [ ]* 6.4 Tulis property test untuk Property 9: Edit Tugas Tidak Menganggap Dirinya Sendiri sebagai Duplikat
    - **Property 9: Edit Tugas Tidak Menganggap Dirinya Sendiri sebagai Duplikat**
    - **Validates: Requirements 3.6**
    - Gunakan `fc.string()` dan `fc.string()` (sebagai id); verifikasi `isDuplicate(task.description, task.id)` selalu mengembalikan `false` untuk task itu sendiri
  - [ ]* 6.5 Tulis property test untuk Property 10: Penambahan Tugas Unik Selalu Berhasil
    - **Property 10: Penambahan Tugas Unik Selalu Berhasil**
    - **Validates: Requirements 3.4**
    - Gunakan `fc.array(fc.string())` dan `fc.string()` yang unik; verifikasi panjang koleksi bertambah tepat satu setelah `add()` berhasil

- [ ] 7. Checkpoint — Pastikan semua komponen terhubung dan berfungsi
  - Pastikan `Theme_Manager.init()` dipanggil di blok Bootstrap `DOMContentLoaded`
  - Pastikan `FocusTimer` menggunakan `customDuration` di semua tempat yang relevan
  - Pastikan `TodoList` memanggil `isDuplicate()` pada `add()` dan `saveEdit()`
  - Pastikan `Storage.get()` dan `Storage.set()` digunakan secara konsisten oleh semua modul
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

- [ ] 8. Unit test berbasis contoh untuk edge cases
  - [ ]* 8.1 Tulis unit tests untuk edge cases `Theme_Manager` dan `Storage`
    - Light mode aktif saat localStorage kosong (Req 1.6)
    - Nilai `tdld_theme` tidak valid di localStorage → fallback Light_Mode (Req 4.5)
    - Kegagalan localStorage write → error banner muncul, UI tetap berubah (Req 4.7)
    - _Requirements: 1.6, 4.5, 4.7_
  - [ ]* 8.2 Tulis unit tests untuk edge cases `FocusTimer`
    - Default durasi 25 menit saat localStorage kosong (Req 2.7)
    - Tampilan `#timer-duration-display` menunjukkan durasi aktif yang benar (Req 2.10)
    - Nilai `tdld_timer_duration` tidak valid di localStorage → fallback 25 menit (Req 4.6)
    - _Requirements: 2.7, 2.10, 4.6_
  - [ ]* 8.3 Tulis unit tests untuk edge cases `TodoList`
    - Pesan error duplikat menyebutkan deskripsi tugas secara eksplisit (Req 3.2)
    - Input tidak dikosongkan setelah penolakan duplikat (Req 3.3)
    - Setelah menghapus tugas, deskripsi yang sama dapat ditambahkan kembali (Req 3.7)
    - _Requirements: 3.2, 3.3, 3.7_

- [ ] 9. Checkpoint Akhir — Verifikasi keseluruhan
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

---

## Notes

- Task yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task merujuk ke persyaratan spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di titik-titik penting
- Property tests memvalidasi properti kebenaran universal (10 properties dari design.md)
- Unit tests memvalidasi contoh spesifik dan edge cases
- Urutan pengerjaan: CSS → HTML → Storage → Theme_Manager → FocusTimer → TodoList → Tests
- Inline script anti-FOUC harus ditempatkan di `<head>` setelah `<link rel="stylesheet">` agar CSS sudah diparse sebelum class `dark` diterapkan
- Library property-based testing: **fast-check** (`fc`) — lihat `package.json` untuk konfigurasi

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "3.1"] },
    { "id": 2, "tasks": ["4.1", "5.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "5.2", "6.1"] },
    { "id": 4, "tasks": ["5.3", "5.4", "5.5", "6.2", "6.3", "6.4", "6.5"] },
    { "id": 5, "tasks": ["5.6", "5.7", "8.1", "8.2", "8.3"] }
  ]
}
```
