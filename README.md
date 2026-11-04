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
- Landing 4 kategori santri + rincian biaya
- Wizard 6 langkah: calon santri, ayah, ibu, alamat, berkas, tinjau
- Alamat bertingkat otomatis: provinsi → kabupaten/kota → kecamatan →
  kelurahan/desa (data Kemendagri 2025)
- Autosave di perangkat (`localStorage`), kirim sekali di akhir
- Upload pas foto (opsional) dan dokumen pendukung opsional
  (akta, KK, KTP orang tua, NISN, ijazah, KIP/KKS/PKH); berkas fisik tetap dibawa
- Kode pendaftaran otomatis, format `NH-2627-MI13-G1-0001`
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
- Data master: kategori santri, gelombang, paket biaya per kategori
- Daftar pendaftar + pencarian/filter status
- Input pendaftaran offline langsung dari panel
- Detail pendaftar, verifikasi, terima/tolak, check-in asrama
- Verifikasi pembayaran + pratinjau bukti
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
npm run db:import-wilayah # impor data provinsi s.d. desa/kelurahan
npm run create:admin -- --username admin --password "password-anda" --name "Nama Pengurus"
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
| `npm run db:import-wilayah` | Impor data wilayah Indonesia |
| `npm run create:admin -- ...` | Buat/perbarui akun pengurus |

## Environment

```env
DATABASE_URL=postgres://postgres:nurulhusna@localhost:5434/nurulhusna
UPLOAD_DIR=./data/uploads
PUBLIC_ORIGIN=http://localhost:5173
APP_SECRET=string-acak-panjang
```

`APP_SECRET` dipakai untuk menandatangani cookie akses cek status.

## Alur pendaftaran

1. Calon santri memilih kategori di `/ppdb` (hanya saat gelombang sedang dibuka).
2. Mengisi wizard 6 langkah (termasuk unggah berkas opsional).
3. Saat dikirim, server membuat:
   - kode pendaftaran berurutan per gelombang+kategori,
   - data santri, ayah, ibu, wali (opsional), alamat, checklist berkas,
   - tagihan + cicilan sesuai paket biaya kategori.
4. Halaman sukses menampilkan kode, QR, dan rincian tagihan.
5. Wali mengecek status di `/ppdb/status` memakai kode + salah satu nomor HP.
6. Bukti transfer diunggah, lalu diverifikasi pengurus di `/admin/pembayaran`.
7. Saat tiba di asrama, pengurus menandai check-in di detail pendaftar.

Pendaftaran offline diinput pengurus melalui **Admin → Pendaftaran → Pendaftaran
offline**: pilih kategori, isi formulir yang sama, lalu kode pendaftaran langsung
terbit dan tercatat sebagai pendaftaran offline.

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

Kode pendaftaran memuat kode gelombang agar tidak bentrok:
`NH-2627-MI13-G1-0001` dan `NH-2627-MI13-G2-0001`.

## Yang perlu diisi pengurus

Melalui `/admin`:

1. **Data master → Kategori**: sesuaikan nama lembaga (mis. nama MI).
2. **Data master → Biaya**: isi komponen dan nominal untuk tiap kategori.
3. **Pengaturan**: rekening transfer, nomor HP, alamat, teks PPDB.
4. **Konten → Halaman**: lengkapi profil, program, fasilitas, dan kontak.
5. **Konten → Berita**: tulis kabar atau pengumuman.
6. **Konten → Galeri**: unggah foto kegiatan.

## Struktur

```
src/
  lib/
    components/ppdb/      wizard & bagian formulir
    components/public/    komponen halaman publik
    server/
      content/            markdown, layanan konten, slug
      db/                 schema + koneksi Drizzle
      ppdb/               validasi, service pendaftaran, pembayaran, akses, storage
      services/           pengaturan, audit
      auth.ts             sesi admin
    types/registration.ts tipe & opsi formulir
  routes/
    (public)/             halaman publik & PPDB
    admin/                login + panel admin
    api/ppdb/             endpoint submit pendaftaran
scripts/                  seed, import wilayah, create-admin
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

## Version control

Repository lokal memakai Git pada branch `main`. File `.env` dan `data/uploads`
tidak ikut di-commit. Commit dibuat setelah satu revisi selesai dan sudah diuji.

