# Sistem Manajemen ISP FTTH

Fondasi perancangan sistem manajemen ISP FTTH yang modular untuk 500-2.000
pelanggan pada fase awal. Fondasi aplikasi awal sekarang tersedia. Domain bisnis, integrasi produksi, dan
deployment production belum diaktifkan.

## Kondisi repository saat ini

- `instalink-frontend/` berisi Next.js public-site foundation dengan route
  beranda, paket, pemasangan, corporate, portal pelanggan, galeri, berita,
  dan kontak. Data paket, coverage, dan submit form masih sintetis/local-only
  sampai kontrak backend domain tersedia.
- `instalink-backend/` berisi NestJS REST foundation, health endpoint, Swagger,
  validation, dan Prisma baseline.
- `instalink-infrastructure/` berisi Compose PostgreSQL lokal dan catatan Nginx.
- Nama produk dan folder memakai prefix `instalink-`; keputusan rename ke
  `isp-*` tidak berlaku.
- Node.js dan npm tersedia di environment pemeriksaan.
- Docker, Docker Compose, pnpm, dan psql belum tersedia di environment
  pemeriksaan.
- Tidak ada deployment, akses server produksi, kredensial nyata, atau data
  pelanggan nyata yang digunakan.

## Menjalankan fondasi lokal

Frontend:

```powershell
Set-Location .\instalink-frontend
npm run dev
```

Route frontend yang tersedia:

- `/`
- `/pasang-wifi-sumedang`
- `/pasang-wifi-sumedang-murah`
- `/corporate`
- `/portal-pelanggan`
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
npm run lint
npm run build
```

Portal pelanggan dan formulir publik saat ini adalah permukaan UI dengan
simulasi lokal. Login, pengajuan pemasangan, coverage API, berita dinamis,
notifikasi, tagihan, serta pembayaran baru boleh dihubungkan ke backend
setelah modul identity dan domain API selesai.

Backend:

```powershell
Set-Location .\instalink-backend
Copy-Item .env.example .env
npm run start:dev
```

Backend tersedia di `http://localhost:3001`, health check di
`/api/v1/health`, dan Swagger di `/docs`. Database belum wajib untuk endpoint
health; Compose PostgreSQL lokal dapat dinyalakan setelah Docker tersedia.

```powershell
docker compose -f .\instalink-infrastructure\compose\compose.dev.yml up -d
```

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

## Persetujuan sebelum coding

Review seluruh dokumen pada `docs/` dan jawab pertanyaan terbuka pada
`docs/implementation-roadmap.md`. Integrasi produksi, modul domain finansial, koneksi MikroTik, dan deployment
produksi tetap memerlukan review serta approval terpisah.