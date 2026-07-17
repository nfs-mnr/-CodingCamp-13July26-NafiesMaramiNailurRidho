## Dokumen Persyaratan: Dashboard Enhancements

## Pendahuluan

Fitur ini menambahkan tiga peningkatan pada To-Do Life Dashboard yang sudah ada:

1. **Light/Dark Mode** — toggle untuk mengubah tema tampilan antara mode terang dan mode gelap, dengan preferensi yang persisten di antara sesi browser.
2. **Ubah Durasi Pomodoro Timer** — kontrol bagi pengguna untuk mengatur durasi countdown Focus_Timer dengan nilai kustom (bukan hanya 25 menit bawaan), dengan pengaturan yang persisten di antara sesi browser.
3. **Pencegahan Tugas Duplikat** — validasi yang mencegah penambahan tugas dengan deskripsi yang identik secara case-insensitive, disertai pesan error yang informatif.

Semua fitur baru mengikuti arsitektur yang sudah ada: satu halaman HTML, satu file `css/style.css`, satu file `js/app.js`, dan penyimpanan data via Browser Local Storage API tanpa dependensi eksternal.

---

## Glosarium

- **Dashboard**: Aplikasi web satu halaman yang sudah ada yang dijelaskan dalam dokumen ini.
- **Theme_Manager**: Komponen logika yang bertanggung jawab mengelola preferensi tema (light/dark), menerapkan kelas CSS yang sesuai pada elemen `<body>`, dan menyimpan preferensi ke Local_Storage.
- **Theme_Toggle**: Elemen UI berupa tombol atau switch yang dapat diaktifkan pengguna untuk berpindah antara mode terang dan mode gelap.
- **Focus_Timer**: Komponen UI yang sudah ada yang mengimplementasikan timer countdown dengan kontrol start, stop, dan reset.
- **Timer_Duration_Control**: Elemen UI berupa input angka yang memungkinkan pengguna mengatur durasi Focus_Timer dalam satuan menit.
- **Task_List**: Komponen UI yang sudah ada yang mengelola kumpulan tugas milik pengguna.
- **Duplicate_Validator**: Logika validasi dalam Task_List yang memeriksa apakah deskripsi tugas baru sudah ada dalam koleksi tugas yang aktif, secara case-insensitive.
- **Local_Storage**: Browser Local Storage API, digunakan sebagai satu-satunya mekanisme persistensi.
- **Light_Mode**: Tema tampilan dengan latar belakang terang dan teks gelap.
- **Dark_Mode**: Tema tampilan dengan latar belakang gelap dan teks terang.

---

## Persyaratan

### Persyaratan 1: Light/Dark Mode

**User Story:** Sebagai pengguna, saya ingin dapat berpindah antara tema terang dan gelap, sehingga saya dapat menyesuaikan tampilan dashboard sesuai kondisi pencahayaan lingkungan dan preferensi pribadi saya.

#### Kriteria Penerimaan

1. THE Dashboard SHALL menampilkan Theme_Toggle pada posisi yang mudah dijangkau di seluruh tampilan halaman.
2. WHEN pengguna mengaktifkan Theme_Toggle saat Light_Mode aktif, THE Theme_Manager SHALL menerapkan Dark_Mode pada seluruh tampilan Dashboard dengan mengubah skema warna latar belakang, teks, dan komponen UI.
3. WHEN pengguna mengaktifkan Theme_Toggle saat Dark_Mode aktif, THE Theme_Manager SHALL menerapkan Light_Mode pada seluruh tampilan Dashboard.
4. WHEN tema berubah, THE Theme_Manager SHALL menyimpan preferensi tema ke Local_Storage di bawah kunci tetap yang spesifik untuk aplikasi ini sebelum perubahan visual diterapkan ke layar.
5. WHEN Dashboard dimuat dan Local_Storage mengandung preferensi tema yang tersimpan, THE Theme_Manager SHALL menerapkan tema yang tersimpan tersebut sebelum render pertama selesai, tanpa kilatan tampilan tema default.
6. IF Local_Storage tidak mengandung preferensi tema pada saat Dashboard dimuat, THEN THE Theme_Manager SHALL menerapkan Light_Mode sebagai tema default.
7. THE Theme_Toggle SHALL menampilkan label atau ikon yang mencerminkan tema yang saat ini aktif, sehingga pengguna selalu mengetahui status tema.
8. WHEN tema berubah, THE Dashboard SHALL menyelesaikan transisi visual dalam waktu 300ms atau kurang.

---

### Persyaratan 2: Ubah Durasi Pomodoro Timer

**User Story:** Sebagai pengguna, saya ingin dapat mengatur durasi fokus timer saya sendiri, sehingga saya dapat menyesuaikan interval kerja Pomodoro dengan kebutuhan dan preferensi saya.

#### Kriteria Penerimaan

1. THE Focus_Timer SHALL menampilkan Timer_Duration_Control yang memungkinkan pengguna memasukkan durasi dalam satuan menit.
2. WHEN pengguna mengirimkan nilai durasi baru melalui Timer_Duration_Control, THE Focus_Timer SHALL menerima nilai integer dalam rentang 1 hingga 180 menit (inklusif) sebagai input yang valid.
3. IF pengguna memasukkan nilai di luar rentang 1 hingga 180 menit, atau nilai yang bukan merupakan bilangan bulat positif, THEN THE Focus_Timer SHALL menolak input tersebut dan menampilkan pesan validasi inline yang menyebutkan rentang yang diperbolehkan.
4. WHEN pengguna menyimpan durasi yang valid, THE Focus_Timer SHALL memperbarui nilai countdown ke durasi baru tersebut dan menampilkan waktu yang diperbarui dalam format MM:SS.
5. WHEN pengguna menyimpan durasi yang valid, THE Focus_Timer SHALL menyimpan nilai durasi tersebut ke Local_Storage di bawah kunci tetap yang spesifik untuk aplikasi ini.
6. WHEN Dashboard dimuat dan Local_Storage mengandung durasi timer yang tersimpan, THE Focus_Timer SHALL menginisialisasi countdown dengan durasi yang tersimpan tersebut, bukan dengan nilai default 25 menit.
7. IF Local_Storage tidak mengandung durasi timer yang tersimpan pada saat Dashboard dimuat, THEN THE Focus_Timer SHALL menginisialisasi countdown dengan durasi default 25 menit (1500 detik).
8. WHILE sebuah Timer_Session sedang aktif (timer sedang berjalan), THE Timer_Duration_Control SHALL dinonaktifkan untuk mencegah perubahan durasi di tengah sesi yang sedang berjalan.
9. WHEN pengguna mengaktifkan kontrol reset, THE Focus_Timer SHALL mereset countdown ke nilai durasi yang saat ini tersimpan (bukan selalu ke 25 menit).
10. THE Focus_Timer SHALL menampilkan durasi aktif saat ini dalam satuan menit di dekat Timer_Duration_Control sebagai referensi bagi pengguna.

---

### Persyaratan 3: Pencegahan Tugas Duplikat

**User Story:** Sebagai pengguna, saya ingin sistem mencegah saya menambahkan tugas yang sama dua kali, sehingga daftar tugas saya tetap bersih dan bebas dari entri yang berulang.

#### Kriteria Penerimaan

1. WHEN pengguna mengirimkan deskripsi tugas baru, THE Duplicate_Validator SHALL membandingkan deskripsi tersebut (setelah trimming spasi di awal dan akhir) secara case-insensitive terhadap deskripsi semua tugas yang ada dalam koleksi Task_List yang aktif.
2. IF deskripsi tugas baru, setelah trimming dan konversi ke huruf kecil, cocok dengan deskripsi tugas mana pun yang sudah ada dalam koleksi, THEN THE Task_List SHALL menolak penambahan tugas tersebut dan menampilkan pesan error inline yang secara eksplisit menyebutkan bahwa tugas dengan deskripsi tersebut sudah ada.
3. WHEN tugas duplikat ditolak, THE Task_List SHALL mempertahankan teks yang diketik pengguna di kolom input, sehingga pengguna dapat memodifikasinya tanpa harus mengetik ulang.
4. WHEN pengguna mengirimkan deskripsi tugas yang tidak duplikat dan tidak melanggar aturan validasi lainnya, THE Task_List SHALL menambahkan tugas tersebut ke koleksi dan menghapus pesan error duplikat jika sebelumnya ditampilkan.
5. THE Duplicate_Validator SHALL melakukan perbandingan case-insensitive, sehingga deskripsi seperti "belajar JavaScript", "Belajar JavaScript", dan "BELAJAR JAVASCRIPT" dianggap duplikat satu sama lain.
6. WHEN pengguna mengedit tugas yang sudah ada dan menyimpannya, THE Duplicate_Validator SHALL memeriksa apakah deskripsi yang telah diedit sudah ada pada tugas lain dalam koleksi (tidak termasuk tugas yang sedang diedit), dan SHALL menolak penyimpanan jika terdapat duplikat.
7. THE Duplicate_Validator SHALL hanya memeriksa duplikat pada tugas yang masih aktif dalam koleksi Task_List; tugas yang telah dihapus tidak relevan untuk pengecekan duplikat.

---

### Persyaratan 4: Persistensi Data untuk Fitur Baru

**User Story:** Sebagai pengguna, saya ingin preferensi tema dan pengaturan durasi timer saya tersimpan secara otomatis, sehingga saya tidak perlu mengkonfigurasi ulang setiap kali membuka dashboard.

#### Kriteria Penerimaan

1. THE Dashboard SHALL menyimpan preferensi tema sebagai nilai string (`"light"` atau `"dark"`) di bawah kunci `tdld_theme` dalam Local_Storage setiap kali tema berubah.
2. THE Dashboard SHALL menyimpan durasi timer sebagai nilai integer (dalam satuan menit) di bawah kunci `tdld_timer_duration` dalam Local_Storage setiap kali pengguna menyimpan durasi baru.
3. WHEN Dashboard dimuat dan Local_Storage mengandung nilai pada kunci `tdld_theme`, THE Theme_Manager SHALL membaca dan menerapkan nilai tersebut.
4. WHEN Dashboard dimuat dan Local_Storage mengandung nilai pada kunci `tdld_timer_duration`, THE Focus_Timer SHALL membaca dan menggunakan nilai tersebut sebagai durasi awal countdown.
5. IF nilai yang dibaca dari kunci `tdld_theme` pada Local_Storage bukan `"light"` atau `"dark"`, THEN THE Theme_Manager SHALL mengabaikan nilai tersebut dan menerapkan Light_Mode sebagai fallback.
6. IF nilai yang dibaca dari kunci `tdld_timer_duration` pada Local_Storage bukan bilangan bulat dalam rentang 1 hingga 180, THEN THE Focus_Timer SHALL mengabaikan nilai tersebut dan menggunakan durasi default 25 menit sebagai fallback.
7. IF operasi penulisan ke Local_Storage gagal saat menyimpan preferensi tema atau durasi timer, THEN THE Dashboard SHALL menampilkan notifikasi error non-blocking kepada pengguna dan SHALL NOT menggagalkan perubahan UI yang sudah diterapkan.
