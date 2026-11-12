# Website Pondok Pesantren Nurul Husna

Website profil pondok dan penerimaan santri baru (PPDB) Pondok Pesantren Nurul
Husna, Jl. Balekambang Km.01, Selomerto, Wonosobo.

## Stack

- SvelteKit 2 + Svelte 5 (runes) + TypeScript
- Tailwind CSS 4
- PostgreSQL 17 + Drizzle ORM
- Auth sesi admin (cookie HttpOnly + Argon2)
- Adapter Node

## Fitur yang sudah berjalan

**Pendaftaran online**
- Akun wali dengan verifikasi OTP WhatsApp sebelum mengisi formulir
- Landing kategori santri + rincian biaya
- Wizard 6 langkah: calon santri, ayah, ibu, alamat, berkas, tinjau
- Alamat bertingkat otomatis: provinsi → kabupaten/kota → kecamatan →
  kelurahan/desa (data Kemendagri 2025)
- Autosave di perangkat (`localStorage`), kirim sekali di akhir
- Upload pas foto (opsional) dan dokumen pendukung opsional
  (akta, KK, KTP orang tua, NISN, ijazah, KIP/KKS/PKH); berkas fisik tetap dibawa
- Kode pendaftaran otomatis, format `NH-482913` (enam digit acak)
- Gelombang otomatis: dibuka/ditutup sesuai tanggal, dengan dua gelombang 2027
  (Gelombang 1: Januari–Maret, Gelombang 2: April–Juli)
- QR kode pendaftaran + halaman bukti yang bisa dicetak
- Pilih skema pembayaran: lunas atau cicilan 3×

**Pembayaran**
- Cek status dengan kode + nomor HP (rate limited)
- Rincian tagihan, cicilan, dan riwayat pembayaran
- Upload bukti transfer (JPG/PNG/PDF, maks 5 MB, validasi magic bytes)
- Admin verifikasi/tolak bukti, catat pembayaran tunai
- Status invoice dan cicilan dihitung otomatis dari pembayaran terverifikasi

**Admin**
- Login, dashboard ringkasan
- Dashboard terpisah untuk staff pendaftaran dan staff keuangan
- Role pengurus: super admin, staff pendaftaran, staff keuangan
- Data master: kategori santri, gelombang, paket biaya per kategori
- Rincian biaya pondok dan sekolah sesuai PDF Yayasan Nurul Chusna
- Daftar pendaftar + pencarian/filter status
- Input pendaftaran offline langsung dari panel
- Detail pendaftar, verifikasi, terima/tolak, check-in, dan tanda berkas lengkap
- Verifikasi pembayaran + pratinjau bukti
- Kuitansi pembayaran yang bisa dicetak
- Data santri otomatis setelah cicilan pertama terverifikasi dan berkas lengkap
- Data master asrama: gedung, kamar, loker, dan penempatan santri
- Pengaturan identitas pondok dan rekening

**Profil**
- Beranda dengan sorotan program, kabar terbaru, dan galeri
- Halaman Profil, Program, Fasilitas, Kontak, Berita, dan Galeri
- Halaman tambahan bisa dibuat dari panel admin (Markdown)
- Berita/pengumuman dengan gambar sampul
- Galeri foto
- CMS sederhana: halaman, berita, galeri, dan pengaturan

## Kebutuhan

- Node.js 22+ (diuji pada Node 24)
- Docker (untuk PostgreSQL lokal)

## Menjalankan

```bash
npm install
cp .env.example .env      # lalu isi APP_SECRET dengan string acak
npm run db:start          # PostgreSQL di localhost:5434
npm run db:push           # buat tabel
npm run db:seed           # seed kategori, gelombang, pengaturan
npm run db:seed-biaya     # seed rincian biaya pondok dan sekolah
npm run db:import-wilayah # impor data provinsi s.d. desa/kelurahan
npm run create:admin -- --username admin --password "password-anda" --name "Nama Pengurus" --role super_admin
npm run dev
```

Buka:

- Website: http://localhost:5173
- Pendaftaran: http://localhost:5173/ppdb
- Admin: http://localhost:5173/admin

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run preview` | Pratinjau build |
| `npm run check` | Type & Svelte check |
| `npm run db:start` / `db:stop` | Nyalakan/matikan PostgreSQL |
| `npm run db:push` | Sinkronkan schema ke database |
| `npm run db:generate` | Buat file migrasi |
| `npm run db:migrate` | Jalankan migrasi |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed data master |
| `npm run db:seed-biaya` | Seed kategori dan rincian biaya sesuai PDF |
| `npm run db:seed-dummy` | Buat data contoh galeri dan berita |
| `npm run db:import-wilayah` | Impor data wilayah Indonesia |
| `npm run create:admin -- ...` | Buat/perbarui akun pengurus |

## Environment

```env
DATABASE_URL=postgres://postgres:nurulhusna@localhost:5434/nurulhusna
UPLOAD_DIR=./data/uploads
PUBLIC_ORIGIN=http://localhost:5173
APP_SECRET=string-acak-panjang
WA_PROVIDER=log
WA_API_URL=
WA_API_KEY=
WA_SENDER=
WA_TEMPLATE_OTP=
WA_TEMPLATE_LANG=id
WA_NOTIFY=1
OTP_DEV_MODE=0
```

`WA_PROVIDER` mendukung `log`, `fonnte`, `wablas`, dan `meta`.
`log` hanya menulis kode OTP ke console server dan dipakai untuk development.
`OTP_DEV_MODE=1` menampilkan kode OTP di halaman verifikasi, jangan dipakai di
production.

`APP_SECRET` dipakai untuk menandatangani cookie akses cek status dan hash OTP.

## Akun wali dan OTP

- Akun dibuat dari `/ppdb/akun/masuk` dengan nomor WhatsApp dan nama wali.
- OTP 6 digit berlaku 5 menit, maksimal 5 percobaan, dan bisa dikirim ulang
  setelah 60 detik.
- Maksimal 5 permintaan OTP per nomor dan 20 permintaan per IP dalam satu jam.
- OTP kedaluwarsa lebih dari 24 jam dibersihkan otomatis.
- Kode OTP disimpan sebagai hash, bukan teks asli.
- Setelah verifikasi, sesi akun berlaku 30 hari.
- Pemilik akun bisa melihat status, mengunggah bukti pembayaran, dan mencetak
  kuitansi tanpa memasukkan kode pendaftaran.
- Pendaftaran lama tanpa akun tetap bisa dicek memakai kode + nomor HP.

## Alur pendaftaran

1. Calon wali memilih kategori di `/ppdb` (hanya saat gelombang sedang dibuka).
2. Sebelum mengisi formulir, wali membuat akun dengan nomor WhatsApp.
3. Sistem mengirim OTP 6 digit. Setelah diverifikasi, akun aktif dan wali masuk
   ke dashboard akun.
4. Wali mengisi wizard 6 langkah (termasuk unggah berkas opsional).
5. Saat dikirim, server membuat kode pendaftaran acak, data santri, data wali,
   alamat, checklist berkas, tagihan, dan rincian biaya per komponen.
6. Staff pendaftaran memeriksa data lalu menandai **terima** atau **tolak**.
7. Setelah diterima, calon santri datang ke pondok. Staff menandai **check-in**.
8. Saat kedatangan, berkas fisik dilengkapi lalu staff menandai **berkas lengkap**.
9. Staff keuangan mengonfirmasi pembayaran transfer atau tunai.
10. Sistem menerbitkan kuitansi pembayaran yang bisa dicetak dari halaman status.
11. Jika cicilan pertama sudah terverifikasi dan berkas lengkap, data otomatis masuk **Data Santri**.
12. Staff pendaftaran memplot gedung, kamar, dan loker di menu **Asrama**.

Nomor WhatsApp yang sudah punya akun bisa langsung masuk dengan OTP tanpa
membuat akun baru. Satu akun boleh memiliki lebih dari satu pendaftaran.

**Aturan menjadi santri:** staff pendaftaran tetap boleh menerima dan check-in
sebelum pembayaran. Status santri baru dibuat otomatis oleh sistem setelah
cicilan pertama terverifikasi dan berkas lengkap. Tidak ada tombol manual untuk
menjadikan santri.

**Kelengkapan berkas fisik:** admin harus mencentang setiap berkas wajib di
detail pendaftaran. Status berkas lengkap tidak bisa diset jika masih ada berkas
wajib yang belum dicentang. Berkas KIP, KKS, dan PKH bersifat opsional.

**Koreksi skema pembayaran:** jika skema saat pendaftaran keliru, super admin
bisa mengubahnya di detail pembayaran pada menu Keuangan. Pembayaran yang sudah
terverifikasi tetap dihitung.

**NIS santri:** NIS tidak diisi otomatis dari NIS lokal pendaftaran. Admin
mengisi NIS resmi di menu Data Santri setelah santri dibuat.

**Pendaftaran ditolak:** pembayaran tidak dapat diunggah, diverifikasi, atau
dicatat untuk pendaftaran yang sudah ditolak. Alasan penolakan tampil di halaman
status wali dan dashboard akun. Super admin dapat membuka kembali pendaftaran
yang ditolak melalui detail pendaftaran.

**Revisi data:** staff pendaftaran dapat meminta revisi. Status berubah menjadi
`needs_revision`, wali melihat catatan revisi di akun, lalu memperbaiki data
lewat halaman revisi. Setelah disimpan, status kembali menjadi `submitted`.
Pembayaran ditahan selama status masih `needs_revision`.

**Notifikasi WhatsApp:** perubahan status penting (diterima, ditolak, perlu
revisi, check-in, berkas lengkap, menjadi santri) dan verifikasi pembayaran
dikirim ke nomor wali. Nonaktifkan dengan `WA_NOTIFY=0`.

**Keamanan halaman sukses:** halaman `/ppdb/sukses/[kode]` hanya bisa dibuka
oleh pemilik akun, admin, atau pemegang token akses. Tanpa itu, pengunjung
diarahkan ke halaman cek status.

**Skema pembayaran:** wali wajib memilih Lunas atau Cicilan 3×. Tidak ada lagi
pilihan default yang bisa terlewat. Draft formulir juga dipisahkan per akun.

**Penempatan santri:** saat status santri diubah menjadi lulus atau keluar,
kamar dan loker aktif otomatis dilepas.

Pendaftaran offline diinput pengurus melalui **Admin → Pendaftaran → Pendaftaran
offline**: pilih kategori, isi formulir yang sama, lalu kode pendaftaran langsung
terbit dan tercatat sebagai pendaftaran offline.

## Role pengurus

| Role | Dashboard dan akses |
| --- | --- |
| `super_admin` | Semua menu, data master, konten, pengaturan, dan pengguna |
| `staff_pendaftaran` | Dashboard pendaftaran, menu Pendaftaran, Data Santri, dan Asrama |
| `staff_keuangan` | Dashboard pembayaran, menu Pembayaran dan Tagihan |

Akun dibuat dari **Admin → Pengguna** atau lewat perintah:

```bash
npm run create:admin -- --username nama --password "password-anda" --name "Nama Lengkap" --role staff_pendaftaran
```

Role yang tersedia: `super_admin`, `staff_pendaftaran`, `staff_keuangan`.

Tombol "Daftar Sekarang" di beranda tetap mengarah ke `/ppdb`; jika belum ada
gelombang yang dibuka, halaman PPDB menampilkan jadwal gelombang berikutnya.

## Gelombang

- **Gelombang 1**: 1 Januari – 31 Maret 2027
- **Gelombang 2**: 1 April – 31 Juli 2027

Gelombang dibuka/ditutup otomatis berdasarkan tanggal. Keduanya berstatus
aktif di admin; yang menentukan adalah rentang tanggal.

**Fase pengembangan:** opsi **Mode Pengembangan → Buka pendaftaran di luar
jadwal gelombang** di `/admin/pengaturan` sedang aktif, sehingga formulir bisa
diuji sekarang meski Gelombang 1 baru dimulai Januari 2027. Matikan opsi ini
saat website sudah live.

Kode pendaftaran memakai enam digit acak, mis. `NH-482913`. Kode dicek
keunikannya saat disimpan, jadi tidak bentrok antar gelombang maupun kategori.

## Biaya

Rincian biaya pondok dan sekolah mengikuti PDF Yayasan Nurul Chusna. Jalankan
`npm run db:seed-biaya` untuk mengisi kategori dan komponen biaya.

| Kategori | Total registrasi |
| --- | ---: |
| MI kelas 1-3 | Rp 3.200.000 |
| MI kelas 4-6 | Rp 3.225.000 |
| MTs Putra | Rp 4.355.000 |
| MTs Putri | Rp 4.455.000 |
| Mondok Saja | Rp 2.060.000 |

Biaya bulanan: kos makan Rp 350.000, pemondokan Rp 130.000, dan i'anah
Rp 50.000. Laundry opsional Rp 50.000. Bulan pertama sudah termasuk dalam
biaya registrasi.

Komponen yang ditandai **bulanan** di master biaya disalin sebagai penanda
pada rincian tagihan. Penagihan bulanan otomatis belum dijalankan pada tahap ini.

## Yang perlu diisi pengurus

Melalui `/admin`:

1. **Data master → Kategori**: sesuaikan nama lembaga (mis. nama MI).
2. **Data master → Biaya**: isi komponen dan nominal untuk tiap kategori.
3. **Asrama**: isi gedung, kamar, kapasitas, dan loker.
4. **Pengaturan**: rekening transfer, nomor HP, alamat, teks PPDB.
5. **Konten → Halaman**: lengkapi profil, program, fasilitas, dan kontak.
6. **Konten → Berita**: tulis kabar atau pengumuman.
7. **Konten → Galeri**: unggah foto kegiatan.

## Struktur

```
src/
  lib/
    components/ppdb/      wizard & bagian formulir
    components/public/    komponen halaman publik
    server/
      content/            markdown, layanan konten, slug
      db/                 schema + koneksi Drizzle
      ppdb/               pendaftaran, pembayaran, santri, OTP, WhatsApp, storage
      services/           pengaturan, audit
      auth.ts             sesi admin
      roles.ts            aturan akses per role
    types/registration.ts tipe & opsi formulir
    types/roles.ts        daftar role dan label
  routes/
    (public)/             halaman publik, PPDB, akun wali, status, dan kuitansi
    admin/                login + panel admin (pendaftaran, keuangan, santri, asrama)
    api/ppdb/             endpoint submit pendaftaran
scripts/                  seed, seed biaya, import wilayah, create-admin
data/geo/                 dataset wilayah (sumber: cahyadsn/wilayah, MIT)
data/uploads/             file upload (tidak publik)
```

## Catatan keamanan

- File upload disimpan di `data/uploads`, bukan `static`, dan tidak dapat
  diakses langsung dari browser.
- Hanya admin yang dapat membuka bukti pembayaran dan berkas pendaftaran.
- Cek status memerlukan kode + nomor HP yang cocok, dengan pembatasan percobaan.
- Semua aksi admin penting dicatat di tabel `audit_log`.
- Cookie sesi `HttpOnly` + `SameSite=Lax`; password di-hash Argon2.

## Data contoh

Untuk mengecek tampilan galeri dan berita tanpa konten asli:

```bash
npm run db:seed-dummy
npm run db:seed-dummy -- --clean   # hapus data contoh
```

Data contoh diberi label "Contoh" dan sebaiknya dihapus sebelum website live.

## Version control

Repository lokal memakai Git pada branch `main`. File `.env` dan `data/uploads`
tidak ikut di-commit. Commit dibuat setelah satu revisi selesai dan sudah diuji.

