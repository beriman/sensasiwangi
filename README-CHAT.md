# Fitur Chat Sensasiwangi

## Instalasi Dependensi

Untuk menggunakan fitur chat dengan emoji picker, Anda perlu menginstal beberapa dependensi tambahan:

```bash
npm install @emoji-mart/data @emoji-mart/react
```

## Dokumentasi Terkait

Untuk informasi lebih detail tentang pengembangan fitur chat, silakan lihat dokumen berikut:

- [CHANGELOG-CHAT.md](./CHANGELOG-CHAT.md) - Riwayat perubahan fitur chat
- [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) - Rencana implementasi fitur lanjutan

## Fitur yang Dikembangkan

1. **Integrasi dengan Sambatan**
   - Tombol chat grup di halaman detail Sambatan
   - Grup chat otomatis untuk peserta Sambatan
   - Koordinasi tugas Sambatan dalam chat
   - Timeline progres Sambatan dalam chat
   - Polling jadwal dan reminder otomatis

2. **Peningkatan UI/UX**
   - Emoji picker untuk menambahkan emoji ke pesan
   - Read receipts (tanda dibaca) untuk mengetahui siapa yang sudah membaca pesan
   - Tampilan yang responsif untuk mobile
   - Typing indicator (indikator sedang mengetik)
   - Pencarian pesan dalam percakapan

3. **Fitur Interaksi Pesan**
   - Reply thread (balasan bersarang)
   - Forward pesan ke percakapan lain
   - Hapus pesan
   - Edit pesan

4. **Fitur Berbagi Konten**
   - Berbagi produk dalam chat
   - Berbagi lokasi dengan peta interaktif
   - Berbagi gambar

5. **Fitur Sosial**
   - Notifikasi real-time untuk pesan baru
   - Manajemen grup chat (tambah/hapus anggota, ubah nama grup)
   - Indikator online/offline untuk pengguna

6. **Fitur Keamanan dan Moderasi**
   - Filter konten otomatis untuk kata-kata kasar
   - Deteksi dan penyensoran informasi pribadi (PII)
   - Sistem pelaporan pesan yang tidak pantas
   - Panel moderasi untuk admin
   - Log aktivitas moderasi
   - Deteksi spam dan flood protection
   - Fitur blokir pengguna
   - Moderasi konten berbasis AI
   - Sistem peringatan dan sanksi untuk pengguna yang melanggar
   - Enkripsi end-to-end untuk pesan pribadi
   - Pesan sementara (self-destruct messages)
   - Verifikasi identitas untuk grup chat
   - Dashboard statistik keamanan untuk admin
   - Deteksi phishing dan tautan berbahaya
   - Watermark untuk mencegah screenshot
   - Backup dan ekspor riwayat chat terenkripsi
   - Sistem audit keamanan dan notifikasi pelanggaran

## Struktur Database

Fitur chat menggunakan beberapa tabel di Supabase:

1. `private_conversations` - Menyimpan data percakapan
   - `is_group` - Menandakan apakah percakapan adalah grup
   - `title` - Judul untuk grup chat
   - `created_by` - Pengguna yang membuat grup

2. `private_conversation_participants` - Menyimpan data peserta percakapan
   - `is_admin` - Menandakan apakah peserta adalah admin grup
   - `last_read_at` - Waktu terakhir peserta membaca pesan

3. `private_messages` - Menyimpan pesan-pesan dalam percakapan
   - `reply_to_id` - ID pesan yang dibalas (untuk thread)
   - `is_deleted` - Menandakan apakah pesan telah dihapus
   - `is_forwarded` - Menandakan apakah pesan diteruskan dari percakapan lain
   - `is_system_message` - Menandakan pesan sistem

4. `sambatan_group_conversations` - Menghubungkan Sambatan dengan grup chat

5. `sambatan_tasks` - Menyimpan tugas-tugas terkait Sambatan
   - `conversation_id` - ID percakapan grup
   - `sambatan_id` - ID Sambatan
   - `title` - Judul tugas
   - `description` - Deskripsi tugas
   - `assignee_id` - ID pengguna yang ditugaskan
   - `status` - Status tugas (pending, in_progress, completed, cancelled)
   - `due_date` - Tenggat waktu tugas

6. `chat_notifications` - Menyimpan notifikasi pesan baru

7. `message_reports` - Menyimpan laporan pesan yang tidak pantas
   - `reason` - Alasan pelaporan
   - `status` - Status laporan (pending, reviewed, dismissed, action_taken)
   - `action_taken` - Tindakan yang diambil oleh moderator

7. `moderation_logs` - Menyimpan log aktivitas moderasi

8. `user_blocks` - Menyimpan informasi pengguna yang diblokir

9. `spam_violations` - Menyimpan pelanggaran spam

10. `user_encryption_keys` - Menyimpan kunci publik untuk enkripsi end-to-end

11. `self_destruct_messages` - Mengatur pesan sementara yang akan dihapus otomatis

12. `identity_verifications` - Menyimpan kode verifikasi identitas untuk grup chat

13. `security_audit_logs` - Menyimpan log audit keamanan

14. `screenshot_logs` - Menyimpan log percobaan screenshot

15. `malicious_link_logs` - Menyimpan log tautan berbahaya yang terdeteksi

## Cara Penggunaan

### Chat Grup Sambatan

1. Buka halaman detail Sambatan
2. Jika Anda adalah peserta atau inisiator Sambatan, Anda akan melihat tombol "Chat Grup Sambatan"
3. Klik tombol tersebut untuk membuka grup chat
4. Semua peserta Sambatan akan otomatis ditambahkan ke grup chat

### Koordinasi Tugas Sambatan

1. Buka chat grup Sambatan
2. Klik tombol "Tugas" di bagian bawah chat
3. Untuk membuat tugas baru:
   - Klik "Tugas Baru"
   - Isi judul, deskripsi, dan tenggat waktu
   - Pilih peserta yang ditugaskan (opsional)
   - Klik "Simpan"
4. Untuk memperbarui status tugas:
   - Klik tombol "Mulai Kerjakan" untuk memulai tugas
   - Klik tombol "Tandai Selesai" saat tugas selesai
   - Klik tombol "Batalkan" untuk membatalkan tugas
5. Gunakan filter untuk melihat tugas berdasarkan status

### Berbagi Produk dalam Chat

1. Buka halaman chat
2. Klik tombol produk (ikon tas belanja)
3. Cari produk yang ingin dibagikan
4. Klik produk untuk menambahkannya ke pesan
5. Tambahkan teks tambahan jika diperlukan
6. Kirim pesan

### Emoji Picker

1. Klik tombol emoji (ikon smiley)
2. Pilih emoji yang ingin ditambahkan
3. Emoji akan ditambahkan ke pesan Anda

### Reply Thread (Balasan Bersarang)

1. Arahkan kursor ke pesan yang ingin dibalas
2. Klik tombol titik tiga (menu) yang muncul
3. Pilih "Balas"
4. Tulis balasan Anda dan kirim
5. Balasan akan ditampilkan dengan referensi ke pesan asli

### Forward Pesan

1. Arahkan kursor ke pesan yang ingin diteruskan
2. Klik tombol titik tiga (menu) yang muncul
3. Pilih "Teruskan"
4. Pilih percakapan tujuan dari daftar
5. Klik "Teruskan" untuk mengirim pesan

### Berbagi Lokasi

1. Klik tombol lokasi (ikon pin) di kotak pesan
2. Klik "Dapatkan Lokasi Saat Ini"
3. Izinkan akses lokasi jika diminta
4. Lokasi Anda akan ditampilkan dengan peta
5. Klik "Bagikan Lokasi" untuk mengirim

### Pencarian Pesan

1. Buka halaman chat
2. Klik tombol pencarian (ikon kaca pembesar) di pojok kanan atas
3. Ketik kata kunci yang ingin dicari
4. Gunakan tombol panah atas dan bawah untuk navigasi hasil pencarian

### Manajemen Grup Chat

1. Buka halaman chat grup
2. Klik tombol info grup (ikon pengguna) di pojok kanan atas
3. Untuk menambah peserta, klik tombol "Tambah"
4. Untuk mengubah nama grup, klik tombol edit di samping nama grup
5. Untuk keluar dari grup, klik tombol "Keluar dari Grup"

### Keamanan dan Moderasi

1. **Filter Konten Otomatis**
   - Pesan yang mengandung kata-kata kasar akan otomatis disensor
   - Pesan yang mengandung informasi pribadi akan memicu peringatan
   - Pengguna dapat memilih untuk mengedit pesan atau mengirim dengan sensor

2. **Deteksi Spam dan Flood Protection**
   - Sistem akan mendeteksi pesan yang dikirim terlalu cepat (flood)
   - Pesan duplikat yang dikirim berulang kali akan diblokir
   - Pesan dengan terlalu banyak tautan atau mention akan ditandai sebagai spam
   - Pengguna yang melanggar berulang kali akan dibatasi sementara

3. **Moderasi Konten Berbasis AI**
   - Sistem AI akan memeriksa konten pesan untuk mendeteksi konten yang tidak pantas
   - Kategori yang dideteksi: konten seksual, ujaran kebencian, pelecehan, kekerasan, dll.
   - Pengguna akan mendapat peringatan jika pesan terdeteksi melanggar pedoman

4. **Enkripsi End-to-End**
   - Pesan pribadi dienkripsi menggunakan kriptografi kunci publik
   - Hanya pengirim dan penerima yang dapat membaca pesan
   - Kunci enkripsi disimpan secara lokal di perangkat pengguna
   - Aktifkan enkripsi dengan mengklik ikon gembok di kotak pesan

5. **Pesan Sementara (Self-Destruct)**
   - Kirim pesan yang akan dihapus secara otomatis setelah jangka waktu tertentu
   - Opsi "Hapus setelah dibaca" untuk pesan yang sangat sensitif
   - Klik ikon timer di kotak pesan untuk mengatur waktu kedaluwarsa
   - Pilih durasi: 1 menit, 5 menit, 1 jam, 1 hari, dll.

6. **Verifikasi Identitas**
   - Verifikasi identitas Anda dalam grup chat untuk meningkatkan kepercayaan
   - Bagikan kode verifikasi dengan anggota grup yang Anda kenal secara langsung
   - Anggota terverifikasi ditandai dengan badge khusus
   - Klik "Verifikasi Identitas" di menu grup chat

7. **Blokir Pengguna**
   - Klik menu titik tiga pada pesan pengguna yang ingin diblokir
   - Pilih "Blokir Pengguna"
   - Masukkan alasan pemblokiran (opsional)
   - Klik "Blokir Pengguna"
   - Pengguna yang diblokir tidak akan dapat mengirim pesan kepada Anda

8. **Pelaporan Pesan**
   - Klik menu titik tiga pada pesan yang ingin dilaporkan
   - Pilih "Laporkan"
   - Pilih alasan pelaporan dan berikan informasi tambahan jika perlu
   - Klik "Kirim Laporan"

9. **Panel Moderasi (Admin)**
   - Akses panel moderasi di `/admin/moderation`
   - Tinjau laporan pesan yang masuk
   - Ambil tindakan: abaikan laporan atau hapus pesan
   - Lihat log aktivitas moderasi dan pelanggaran spam

10. **Dashboard Keamanan (Admin)**
    - Akses dashboard keamanan di `/admin/security`
    - Lihat statistik laporan, spam, dan pengguna yang diblokir
    - Analisis tren keamanan dengan grafik dan diagram
    - Pantau efektivitas sistem moderasi

11. **Deteksi Phishing dan Tautan Berbahaya**
    - Sistem otomatis mendeteksi tautan berbahaya, phishing, dan mencurigakan
    - Tautan berbahaya akan diblokir atau diberi peringatan
    - Tautan tidak aman (HTTP) akan diberi peringatan
    - Pengguna akan diberi notifikasi tentang potensi risiko

12. **Watermark untuk Mencegah Screenshot**
    - Pesan sensitif dilindungi dengan watermark yang menampilkan identitas pengguna
    - Deteksi percobaan screenshot (pada browser dan perangkat yang mendukung)
    - Notifikasi kepada pengguna lain ketika screenshot terdeteksi
    - Konten sensitif akan sementara disembunyikan saat screenshot terdeteksi

13. **Backup dan Ekspor Chat**
    - Ekspor riwayat chat dalam format JSON, TXT, atau HTML
    - Opsi untuk mengenkripsi ekspor dengan kata sandi
    - Filter berdasarkan rentang tanggal
    - Ekspor termasuk metadata dan informasi peserta

14. **Audit Keamanan**
    - Log lengkap semua aktivitas keamanan
    - Deteksi aktivitas mencurigakan secara otomatis
    - Notifikasi untuk admin tentang pelanggaran keamanan
    - Ekspor log audit untuk analisis lanjutan

## Pengembangan Lebih Lanjut

Beberapa ide untuk pengembangan lebih lanjut:

1. Fitur voice message
2. Fitur video call
3. Fitur polling/voting dalam grup chat
4. Fitur pin pesan penting
5. Fitur auto-translate untuk pesan dalam bahasa asing
6. Fitur pengenalan wajah untuk verifikasi identitas
7. Fitur multi-device dengan sinkronisasi enkripsi
8. Fitur pendeteksi emosi untuk analisis sentimen pesan
9. Fitur anti-spoofing untuk mencegah impersonasi
10. Fitur keamanan biometrik untuk akses chat sensitif
