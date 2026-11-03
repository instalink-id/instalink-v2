# Sistem Manajemen ISP FTTH

Fondasi sistem manajemen ISP FTTH modular untuk 500-2.000 pelanggan pada fase
awal. Platform, identity/RBAC MVP, registrasi Customer Service, dan dashboard
admin dasar telah tersedia. Domain bisnis lanjutan, integrasi produksi, dan
deployment production belum diaktifkan.

## Kondisi repository saat ini

- `instalink-frontend/` berisi Next.js public-site foundation dengan route
  beranda, paket, pemasangan, corporate, portal pelanggan, galeri, berita,
  dan kontak. Data paket, coverage, dan submit form masih sintetis/local-only
  sampai kontrak backend domain tersedia.
- `instalink-backend/` berisi NestJS REST API, Prisma/PostgreSQL, session
  authentication, RBAC MVP, registrasi publik, workflow Customer Service,
  manajemen akun admin, audit log, health endpoint, dan Swagger.
- `instalink-frontend/` juga menyediakan dashboard internal pada `/dashboard`
  yang memakai API backend same-origin.
- `instalink-infrastructure/` berisi Compose PostgreSQL lokal dan catatan Nginx.
- Nama produk dan folder memakai prefix `instalink-`; keputusan rename ke
  `isp-*` tidak berlaku.
- Node.js dan npm tersedia di environment pemeriksaan.
- PostgreSQL native Windows direkomendasikan untuk development lokal; Docker
  tidak diperlukan untuk backend slice saat ini.
- Tidak ada deployment, koneksi ke server produksi, kredensial nyata, atau data
  pelanggan nyata yang digunakan.

## Menjalankan fondasi lokal

Frontend:

```powershell
Set-Location .\instalink-frontend
npm.cmd run dev
```

Route frontend yang tersedia:

- `/`
- `/pasang-wifi-sumedang`
- `/pasang-wifi-sumedang-murah`
- `/corporate`
- `/portal-pelanggan`

Dashboard internal tersedia pada `/dashboard`, login pada
`/dashboard/login`, penggantian password wajib pada
`/dashboard/change-password`, dan manajemen akun pada `/dashboard/users`.
Hanya Super Admin yang melihat navigasi manajemen pengguna; backend tetap
menegakkan permission untuk setiap request.
- `/galeri`
- `/berita`
- `/kontak`

### Cek jaringan di lokasi

Fitur cek jaringan tersedia pada `/pasang-wifi-sumedang-murah`. Untuk memuat
jalur kabel secara otomatis, simpan file KML sebagai:

```text
instalink-frontend/public/coverage.kml
```

KML harus memiliki geometri `LineString` dengan koordinat longitude, latitude,
dan altitude opsional. Jika file belum tersedia, halaman menyediakan tombol
**Unggah KML** untuk pengujian lokal. Peta menggunakan tile OpenStreetMap
non-satelit, garis kabel ditampilkan biru, dan lokasi pelanggan ditampilkan
sebagai titik merah **Perangkat Anda**. Ketersediaan ditentukan bila lokasi
berjarak maksimal 50 meter dari segmen garis kabel.

Lokasi dapat diperoleh dari izin geolocation browser atau dari pencarian
alamat melalui OpenStreetMap Nominatim. Geolocation memerlukan HTTPS atau
`localhost` dan izin lokasi dari pengguna.

Validasi frontend:

```powershell
npm.cmd run lint
npm.cmd run build
```

Portal pelanggan dan formulir publik saat ini adalah permukaan UI dengan
simulasi lokal. Login portal pelanggan, pengajuan pemasangan dari website,
coverage API, berita dinamis, notifikasi, tagihan, serta pembayaran belum
terhubung ke backend. Login dashboard internal `/dashboard/login` memakai
session backend.

### PostgreSQL native Windows

Siapkan dua database lokal yang terpisah: `instalink` untuk development dan
`instalink_test` untuk E2E. Gunakan role PostgreSQL lokal Anda; contoh berikut
memakai role `postgres` dan PostgreSQL meminta password sesuai konfigurasi
lokal:

```powershell
createdb -U postgres instalink
createdb -U postgres instalink_test
```

### Menjalankan backend

```powershell
Set-Location .\instalink-backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Atur `DATABASE_URL` pada `.env` lokal agar menunjuk ke database development
`instalink`. File `.env` tidak boleh dikomit. Sebelum mengubah schema, tinjau
status migration dan SQL yang menunggu; terapkan migration hanya ke database
lokal yang sudah diverifikasi. Jangan gunakan `migrate reset` pada database
yang berisi data.

```powershell
npm.cmd exec -- prisma migrate status
# Tinjau SQL pada prisma\migrations sebelum menerapkan migration.
npm.cmd exec -- prisma migrate deploy
$env:SEED_ADMIN_EMAIL = 'admin@example.test'
$env:SEED_ADMIN_PASSWORD = '<password-lokal-yang-anda-tentukan>'
npm.cmd exec -- prisma db seed
Remove-Item Env:SEED_ADMIN_EMAIL, Env:SEED_ADMIN_PASSWORD
npm.cmd run start:dev
```

Seed membuat katalog role dan membuat akun Super Admin hanya jika email seed
belum ada. Menjalankannya kembali tidak mengganti password, status, atau role
akun yang sudah ada. Simpan seed password hanya di environment lokal/secret
store; jangan menaruhnya di source code, dokumentasi, atau commit.

API tersedia di `http://localhost:3001`, health endpoint di
`/api/v1/health`, dan Swagger di `/docs`. Dashboard tersedia melalui frontend
di `http://localhost:3000/dashboard`.

Untuk E2E, set `TEST_DATABASE_URL` hanya ke database lokal `instalink_test`.
Test menolak host non-loopback, nama database tanpa akhiran `_test`, atau URL
yang berbeda dari `DATABASE_URL` aktif. Migration pada database test harus
diterapkan sebelum menjalankan. Gunakan URL lokal yang sama pada kedua
environment variable:

```powershell
$env:DATABASE_URL = '<URL-lokal-untuk-database-instalink_test>'
npm.cmd exec -- prisma migrate deploy
Remove-Item Env:DATABASE_URL
$env:TEST_DATABASE_URL = '<URL-lokal-untuk-database-instalink_test>'
npm.cmd run test:e2e
Remove-Item Env:TEST_DATABASE_URL
```

Validasi backend:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

Docker Compose tetap tersedia untuk kebutuhan lain, tetapi bukan prasyarat
untuk development native ini.

### Cakupan backend saat ini

Fondasi yang sudah berjalan meliputi login/logout, `/me`, penggantian password
wajib, daftar/pembuatan akun admin, perubahan satu role, aktivasi/nonaktifkan,
reset password, pengajuan registrasi publik, workflow Customer Service,
ringkasan dashboard, dan audit log. Password sementara berlaku 24 jam dan
harus diganti saat login pertama; reset mencabut sesi aktif. Billing, payment,
pemulihan password mandiri, administrasi permission/role catalog, customer
portal yang terhubung backend, dan integrasi jaringan belum tersedia. Lihat
[docs/api.md](docs/api.md) untuk status setiap route.

## Rancangan

| Dokumen | Isi |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Arsitektur, batas modul, diagram, dan keputusan teknologi |
| [docs/database.md](docs/database.md) | ERD awal, tabel, status, dan aturan integritas data |
| [docs/api.md](docs/api.md) | Modul dan endpoint REST utama |
| [docs/operations-security.md](docs/operations-security.md) | Auth, integrasi, testing, backup, deployment, dan keamanan |
| [docs/implementation-roadmap.md](docs/implementation-roadmap.md) | Tahapan implementasi, risiko, dan pertanyaan keputusan |

## Prinsip penting

1. Frontend, backend, dan infrastruktur dikembangkan serta di-deploy
   terpisah.
2. PostgreSQL tidak boleh terekspos ke internet.
3. RouterOS API hanya dapat diakses melalui jaringan privat dan akun least
   privilege.
4. Webhook pembayaran diverifikasi, diproses idempotent, dan direkonsiliasi
   sebelum invoice dianggap lunas.
5. Pemutusan layanan otomatis belum diaktifkan.

## Persetujuan sebelum domain dan production work

Fondasi platform dan identity MVP mengikuti desain yang telah disetujui.
Sebelum melanjutkan modul domain, review dokumen terkait dan putuskan pertanyaan
yang menjadi dependency pada [docs/implementation-roadmap.md](docs/implementation-roadmap.md).
Integrasi produksi, migrasi ke database remote, koneksi MikroTik, dan deployment
produksi tetap memerlukan review serta approval eksplisit terpisah.