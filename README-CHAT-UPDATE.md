# Dokumentasi Fitur Chat Sensasiwangi

## Daftar Isi
1. [Pendahuluan](#pendahuluan)
2. [Fitur yang Dikembangkan](#fitur-yang-dikembangkan)
3. [Struktur Database](#struktur-database)
4. [Arsitektur Sistem](#arsitektur-sistem)
5. [Integrasi dengan Fitur Sambatan](#integrasi-dengan-fitur-sambatan)
6. [Peningkatan UX/UI](#peningkatan-uxui)
7. [Fitur AI dan Otomatisasi](#fitur-ai-dan-otomatisasi)
8. [Keamanan dan Privasi](#keamanan-dan-privasi)
9. [Panduan Penggunaan](#panduan-penggunaan)
10. [Pengembangan Lebih Lanjut](#pengembangan-lebih-lanjut)

## Pendahuluan

Fitur Chat Sensasiwangi adalah sistem komunikasi terintegrasi yang memungkinkan pengguna untuk berinteraksi secara real-time dalam konteks platform Sensasiwangi. Fitur ini dirancang untuk mendukung komunikasi antar pengguna, baik dalam percakapan pribadi maupun grup, dengan fokus khusus pada integrasi dengan fitur Sambatan.

Dokumentasi ini mencakup semua aspek fitur Chat, termasuk fitur-fitur terbaru yang dikembangkan untuk meningkatkan pengalaman pengguna, keamanan, dan integrasi dengan fitur Sambatan.

## Fitur yang Dikembangkan

### 1. Fitur Dasar
- Percakapan pribadi dan grup
- Pengiriman pesan teks dan media
- Notifikasi real-time
- Indikator online/offline
- Indikator sedang mengetik
- Read receipts (tanda dibaca)

### 2. Integrasi dengan Sambatan
- Grup chat otomatis untuk peserta Sambatan
- Koordinasi tugas dalam chat
- Timeline Sambatan dalam chat
- Polling jadwal dan reminder otomatis

### 3. Peningkatan UX/UI
- Mode gelap dan tema kustom
- Antarmuka responsif untuk berbagai perangkat
- Peningkatan aksesibilitas
- Animasi dan transisi yang halus
- Emoji picker dan reaksi pesan

### 4. Fitur AI dan Otomatisasi
- Asisten virtual Sambatan
- Ringkasan chat otomatis
- Penerjemah bahasa daerah
- Analisis sentimen untuk moderasi proaktif

### 5. Keamanan dan Privasi
- Enkripsi end-to-end untuk pesan pribadi
- Deteksi dan penyensoran informasi pribadi (PII)
- Deteksi phishing dan tautan berbahaya
- Watermark untuk mencegah screenshot
- Pesan sementara (self-destruct messages)
- Verifikasi identitas untuk grup chat
- Sistem audit keamanan

## Struktur Database

Fitur chat menggunakan beberapa tabel di Supabase:

1. `private_conversations` - Menyimpan data percakapan
   - `is_group` - Menandakan apakah percakapan adalah grup
   - `title` - Judul untuk grup chat
   - `created_by` - Pengguna yang membuat grup

2. `private_conversation_participants` - Menyimpan data peserta percakapan
   - `is_admin` - Menandakan apakah peserta adalah admin grup
   - `last_read_at` - Waktu terakhir peserta membaca pesan
   - `is_identity_verified` - Status verifikasi identitas peserta

3. `private_messages` - Menyimpan pesan-pesan dalam percakapan
   - `reply_to_id` - ID pesan yang dibalas (untuk thread)
   - `is_deleted` - Menandakan apakah pesan telah dihapus
   - `is_forwarded` - Menandakan apakah pesan diteruskan dari percakapan lain
   - `is_system_message` - Menandakan pesan sistem
   - `is_encrypted` - Menandakan apakah pesan dienkripsi
   - `encryption_metadata` - Metadata enkripsi pesan

4. `sambatan_group_conversations` - Menghubungkan Sambatan dengan grup chat

5. `chat_notifications` - Menyimpan notifikasi pesan baru

6. `message_reports` - Menyimpan laporan pesan yang tidak pantas
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

16. `sambatan_tasks` - Menyimpan tugas-tugas terkait Sambatan
    - `conversation_id` - ID percakapan grup
    - `sambatan_id` - ID Sambatan
    - `title` - Judul tugas
    - `description` - Deskripsi tugas
    - `assignee_id` - ID pengguna yang ditugaskan
    - `status` - Status tugas (pending, in_progress, completed, cancelled)
    - `due_date` - Tenggat waktu tugas

17. `sambatan_milestones` - Menyimpan milestone Sambatan untuk timeline
    - `sambatan_id` - ID Sambatan
    - `title` - Judul milestone
    - `target_date` - Tanggal target
    - `completed_date` - Tanggal penyelesaian
    - `status` - Status milestone

18. `schedule_polls` - Menyimpan polling jadwal Sambatan
    - `conversation_id` - ID percakapan grup
    - `sambatan_id` - ID Sambatan
    - `options` - Opsi jadwal (JSONB)

19. `schedule_poll_responses` - Menyimpan respons polling jadwal
    - `poll_id` - ID polling
    - `user_id` - ID pengguna
    - `selected_options` - Opsi yang dipilih (JSONB)

20. `sambatan_reminders` - Menyimpan pengingat otomatis Sambatan
    - `conversation_id` - ID percakapan grup
    - `sambatan_id` - ID Sambatan
    - `scheduled_at` - Waktu pengingat dijadwalkan

## Arsitektur Sistem

Fitur Chat Sensasiwangi dibangun dengan arsitektur berikut:

1. **Frontend**:
   - React.js dengan Next.js untuk rendering
   - TailwindCSS dan shadcn/ui untuk komponen UI
   - Tiptap untuk editor rich text
   - Framer Motion untuk animasi

2. **Backend**:
   - Supabase untuk database dan autentikasi
   - Supabase Realtime untuk komunikasi real-time
   - Supabase Storage untuk penyimpanan media
   - Supabase Functions untuk logika backend serverless

3. **Keamanan**:
   - Web Crypto API untuk enkripsi end-to-end
   - Row Level Security (RLS) di Supabase
   - Content filtering dan sanitization

4. **AI dan Otomatisasi**:
   - OpenAI API untuk asisten virtual dan analisis sentimen
   - Supabase Edge Functions untuk pemrosesan NLP

## Integrasi dengan Fitur Sambatan

### Koordinasi Tugas dalam Chat

Fitur ini memungkinkan pengguna untuk membuat, menugaskan, dan melacak tugas Sambatan langsung dari chat grup.

#### Komponen Utama:
- `TaskManager.tsx` - Komponen utama untuk mengelola tugas
- `TaskItem.tsx` - Komponen untuk menampilkan tugas individual
- `NewTaskDialog.tsx` - Dialog untuk membuat tugas baru

#### Alur Kerja:
1. Pengguna membuka chat grup Sambatan
2. Pengguna mengklik tombol "Tugas" untuk melihat daftar tugas
3. Pengguna dapat membuat tugas baru, menugaskan ke peserta, dan menetapkan tenggat waktu
4. Peserta dapat memperbarui status tugas (mulai, selesai, batalkan)
5. Perubahan status tugas dikirim sebagai pesan sistem ke grup

#### Fitur Khusus:
- Filter tugas berdasarkan status
- Notifikasi untuk tugas yang mendekati tenggat waktu
- Integrasi dengan timeline Sambatan

### Timeline Sambatan dalam Chat

Fitur ini menampilkan timeline visual progres Sambatan dalam chat grup.

#### Komponen Utama:
- `SambatanTimeline.tsx` - Komponen utama untuk menampilkan timeline
- `MilestoneItem.tsx` - Komponen untuk menampilkan milestone individual
- `AddMilestoneDialog.tsx` - Dialog untuk menambahkan milestone baru

#### Alur Kerja:
1. Pengguna membuka chat grup Sambatan
2. Pengguna mengklik tab "Timeline" untuk melihat progres Sambatan
3. Timeline menampilkan milestone dengan status berwarna
4. Pengguna dapat menambah atau memperbarui milestone
5. Perubahan status milestone dikirim sebagai pesan sistem ke grup

### Polling Jadwal dan Reminder

Fitur ini memungkinkan pengguna untuk membuat polling jadwal dan mengatur reminder otomatis.

#### Komponen Utama:
- `SchedulePolling.tsx` - Komponen untuk membuat dan menampilkan polling
- `ReminderManager.tsx` - Komponen untuk mengatur reminder
- `PollResults.tsx` - Komponen untuk menampilkan hasil polling

#### Alur Kerja:
1. Pengguna membuat polling jadwal dengan beberapa opsi tanggal/waktu
2. Peserta Sambatan memberikan suara untuk opsi yang mereka pilih
3. Sistem menampilkan hasil polling secara real-time
4. Berdasarkan hasil polling, pengguna dapat mengatur reminder otomatis
5. Reminder dikirim sebagai pesan sistem ke grup pada waktu yang ditentukan

## Peningkatan UX/UI

### Mode Gelap dan Tema Kustom

Fitur ini memungkinkan pengguna untuk beralih antara mode terang dan gelap, serta menyesuaikan tema sesuai preferensi.

#### Komponen Utama:
- `ThemeProvider.tsx` - Context provider untuk manajemen tema
- `ThemeToggle.tsx` - Tombol untuk beralih antara mode terang dan gelap
- `ThemeSettings.tsx` - Panel pengaturan tema kustom

#### Implementasi:
- Menggunakan CSS variables untuk tema yang konsisten
- Menyimpan preferensi tema di localStorage
- Mendukung tema sistem (mengikuti preferensi sistem operasi)
- Preset tema kustom (tradisional, modern, dll.)

### Aksesibilitas dan Responsivitas

Peningkatan aksesibilitas dan responsivitas untuk memastikan fitur chat dapat digunakan oleh semua pengguna pada berbagai perangkat.

#### Fitur Aksesibilitas:
- Dukungan keyboard navigation
- ARIA labels dan roles
- Kontras warna yang memadai
- Text-to-speech untuk pesan

#### Responsivitas:
- Layout adaptif untuk desktop, tablet, dan mobile
- Optimasi untuk layar kecil
- Touch-friendly UI untuk perangkat mobile
- Penggunaan media queries dan Flexbox/Grid

### Peningkatan Interaksi Pengguna

Peningkatan interaksi pengguna dengan animasi dan gesture controls.

#### Fitur:
- Animasi transisi antar halaman
- Micro-interactions untuk feedback
- Animasi untuk status typing dan pengiriman pesan
- Gesture controls untuk mobile (swipe, pinch-to-zoom)

## Fitur AI dan Otomatisasi

### Asisten Virtual Sambatan

Asisten AI yang dapat menjawab pertanyaan umum tentang Sambatan dan membantu koordinasi.

#### Komponen Utama:
- `SambatanAssistant.tsx` - Komponen utama untuk interaksi dengan asisten
- `AssistantMessage.tsx` - Komponen untuk menampilkan respons asisten
- `AssistantPrompt.tsx` - Komponen untuk input pertanyaan

#### Fitur:
- Jawaban untuk pertanyaan umum tentang Sambatan
- Saran untuk koordinasi dan perencanaan
- Bantuan untuk penggunaan fitur chat
- Pembelajaran dari interaksi sebelumnya

### Ringkasan Chat Otomatis

Fitur yang secara otomatis meringkas percakapan panjang untuk memudahkan peserta baru atau yang tidak aktif.

#### Komponen Utama:
- `ChatSummary.tsx` - Komponen untuk menampilkan ringkasan
- `SummarySettings.tsx` - Pengaturan untuk ringkasan otomatis

#### Fitur:
- Ringkasan otomatis setelah jumlah pesan tertentu
- Ekstraksi informasi penting dari percakapan
- Penyesuaian panjang ringkasan
- Penekanan pada keputusan dan tindakan

### Penerjemah Bahasa Daerah dan Analisis Sentimen

Fitur untuk menerjemahkan bahasa daerah dan menganalisis sentimen pesan untuk moderasi proaktif.

#### Komponen Utama:
- `LanguageTranslator.tsx` - Komponen untuk terjemahan
- `SentimentIndicator.tsx` - Indikator sentimen pesan

#### Fitur:
- Terjemahan antara bahasa Indonesia dan bahasa daerah
- Deteksi bahasa otomatis
- Analisis sentimen untuk moderasi proaktif
- Peringatan untuk konten negatif

## Keamanan dan Privasi

### Filter Konten Otomatis
- Pesan yang mengandung kata-kata kasar akan otomatis disensor
- Pesan yang mengandung informasi pribadi akan memicu peringatan
- Pengguna dapat memilih untuk mengedit pesan atau mengirim dengan sensor

### Deteksi Spam dan Flood Protection
- Sistem akan mendeteksi pesan yang dikirim terlalu cepat (flood)
- Pesan duplikat yang dikirim berulang kali akan diblokir
- Pesan dengan terlalu banyak tautan atau mention akan ditandai sebagai spam
- Pengguna yang melanggar berulang kali akan dibatasi sementara

### Moderasi Konten Berbasis AI
- Sistem AI akan memeriksa konten pesan untuk mendeteksi konten yang tidak pantas
- Kategori yang dideteksi: konten seksual, ujaran kebencian, pelecehan, kekerasan, dll.
- Pengguna akan mendapat peringatan jika pesan terdeteksi melanggar pedoman

### Enkripsi End-to-End
- Pesan pribadi dienkripsi menggunakan kriptografi kunci publik
- Hanya pengirim dan penerima yang dapat membaca pesan
- Kunci enkripsi disimpan secara lokal di perangkat pengguna
- Aktifkan enkripsi dengan mengklik ikon gembok di kotak pesan

### Pesan Sementara (Self-Destruct)
- Kirim pesan yang akan dihapus secara otomatis setelah jangka waktu tertentu
- Opsi "Hapus setelah dibaca" untuk pesan yang sangat sensitif
- Klik ikon timer di kotak pesan untuk mengatur waktu kedaluwarsa
- Pilih durasi: 1 menit, 5 menit, 1 jam, 1 hari, dll.

### Verifikasi Identitas
- Verifikasi identitas Anda dalam grup chat untuk meningkatkan kepercayaan
- Bagikan kode verifikasi dengan anggota grup yang Anda kenal secara langsung
- Anggota terverifikasi ditandai dengan badge khusus
- Klik "Verifikasi Identitas" di menu grup chat

### Deteksi Phishing dan Tautan Berbahaya
- Sistem otomatis mendeteksi tautan berbahaya, phishing, dan mencurigakan
- Tautan berbahaya akan diblokir atau diberi peringatan
- Tautan tidak aman (HTTP) akan diberi peringatan
- Pengguna akan diberi notifikasi tentang potensi risiko

### Watermark untuk Mencegah Screenshot
- Pesan sensitif dilindungi dengan watermark yang menampilkan identitas pengguna
- Deteksi percobaan screenshot (pada browser dan perangkat yang mendukung)
- Notifikasi kepada pengguna lain ketika screenshot terdeteksi
- Konten sensitif akan sementara disembunyikan saat screenshot terdeteksi

### Backup dan Ekspor Chat
- Ekspor riwayat chat dalam format JSON, TXT, atau HTML
- Opsi untuk mengenkripsi ekspor dengan kata sandi
- Filter berdasarkan rentang tanggal
- Ekspor termasuk metadata dan informasi peserta

### Audit Keamanan
- Log lengkap semua aktivitas keamanan
- Deteksi aktivitas mencurigakan secara otomatis
- Notifikasi untuk admin tentang pelanggaran keamanan
- Ekspor log audit untuk analisis lanjutan

## Panduan Penggunaan

### Koordinasi Tugas Sambatan

1. **Membuat Tugas Baru**
   - Buka chat grup Sambatan
   - Klik tombol "Tugas" di bagian bawah chat
   - Klik "Tugas Baru"
   - Isi judul, deskripsi, dan tenggat waktu
   - Pilih peserta yang ditugaskan (opsional)
   - Klik "Simpan"

2. **Memperbarui Status Tugas**
   - Buka daftar tugas
   - Cari tugas yang ingin diperbarui
   - Klik tombol "Mulai Kerjakan" untuk memulai tugas
   - Klik tombol "Tandai Selesai" saat tugas selesai
   - Klik tombol "Batalkan" untuk membatalkan tugas

3. **Melihat Timeline Sambatan**
   - Buka chat grup Sambatan
   - Klik tab "Timeline"
   - Lihat milestone dan progres Sambatan
   - Klik milestone untuk melihat detail

### Menggunakan Fitur Keamanan

1. **Mengaktifkan Enkripsi End-to-End**
   - Buka percakapan pribadi
   - Klik ikon gembok di kotak pesan
   - Konfirmasi untuk mengaktifkan enkripsi
   - Pesan yang dikirim setelahnya akan dienkripsi

2. **Mengirim Pesan Sementara**
   - Buka percakapan
   - Klik ikon timer di kotak pesan
   - Pilih durasi atau opsi "Hapus setelah dibaca"
   - Tulis pesan dan kirim
   - Pesan akan dihapus setelah waktu yang ditentukan

3. **Verifikasi Identitas dalam Grup**
   - Buka chat grup
   - Klik menu grup (ikon titik tiga)
   - Pilih "Verifikasi Identitas"
   - Ikuti petunjuk untuk membuat atau memasukkan kode verifikasi

### Menggunakan Asisten Virtual

1. **Bertanya kepada Asisten**
   - Ketik "@asisten" diikuti dengan pertanyaan Anda
   - Contoh: "@asisten Apa itu Sambatan?"
   - Asisten akan merespons dengan informasi yang relevan

2. **Mendapatkan Ringkasan Chat**
   - Ketik "@asisten ringkas percakapan"
   - Asisten akan memberikan ringkasan percakapan terbaru
   - Anda dapat menentukan jumlah pesan yang diringkas

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
