# InstaLink Customer Service Foundation Design

## Intent

Membangun vertical slice pertama sistem manajemen ISP InstaLink untuk membantu
Customer Service menangani registrasi calon pelanggan dari website publik sampai
follow-up awal. Slice ini menjadi fondasi backend, autentikasi, RBAC, audit, dan
dashboard internal tanpa mengaktifkan billing, subscription, atau provisioning
jaringan.

## Why now

Website publik sudah memiliki alur minat pemasangan, tetapi datanya masih
local-only dan belum dapat ditindaklanjuti melalui sistem internal. Backend baru
berupa foundation NestJS/Prisma, sehingga identity dan master flow perlu
dibangun sebelum dashboard domain lain.

## Goals

- Menyediakan login dashboard internal berbasis session cookie.
- Menyediakan RBAC backend untuk tiga role MVP:
  `super_admin`, `customer_service`, dan `auditor_viewer`.
- Menyimpan registrasi publik secara tervalidasi dan dapat dilacak.
- Menyediakan workflow registrasi:
  `baru` -> `ditindaklanjuti` -> `menunggu_konfirmasi_coverage` ->
  `perlu_survei` atau `disetujui`/`ditolak` -> `selesai`.
- Menyediakan dashboard Customer Service dengan:
  - jumlah registrasi per status;
  - registrasi terbaru;
  - filter status, area, dan tanggal;
  - detail registrasi;
  - pencatatan follow-up.
- Mencatat perubahan penting dan aktivitas autentikasi pada audit log.
- Menggunakan data sintetis untuk development dan testing.

## Non-goals

- Tidak membangun invoice, pembayaran, Midtrans, subscription, atau portal
  pelanggan aktif.
- Tidak melakukan automatic suspend, disconnect, reconnect, atau provisioning
  MikroTik/OLT.
- Tidak mengubah harga, speed, atau katalog publik menjadi sumber resmi sebelum
  catalog backend tersedia.
- Tidak mengaktifkan deployment production.
- Tidak memakai data pelanggan nyata selama development.

## Anti-goals

- Jangan menjadikan UI hiding sebagai pengganti authorization backend.
- Jangan menyimpan password plaintext, token mentah, credential router, atau
  secret provider.
- Jangan membuat registrasi langsung menjadi customer/subscription tanpa proses
  verifikasi terpisah.
- Jangan menyimpan koordinat tanpa izin pengguna.
- Jangan menambahkan dashboard KPI pendapatan sebelum billing tersedia.

## Approaches considered

### A. Identity-first

Membangun identity/RBAC sepenuhnya sebelum workflow registrasi dan dashboard.

- Kelebihan: fondasi keamanan selesai lebih dahulu.
- Kekurangan: manfaat operasional dan integrasi frontend tertunda.

### B. Dashboard-first dengan mock data

Membangun UI dashboard menggunakan data dummy, lalu mengganti mock dengan API.

- Kelebihan: cepat untuk validasi visual.
- Kekurangan: risiko UI tidak sesuai authorization, kontrak API, dan model data.

### C. Vertical slice Customer Service (dipilih)

Membangun identity minimum, RBAC, registrasi, audit, API, dan dashboard dalam
satu alur yang dapat diuji dari ujung ke ujung.

- Kelebihan: memberikan manfaat operasional nyata dan memvalidasi batas domain
  backend/frontend secara bersamaan.
- Kekurangan: finance, teknisi, network, dan portal belum tercakup.

Pendekatan C dipilih karena website publik sudah menghasilkan minat pemasangan
dan alur ini tidak membutuhkan integrasi Midtrans atau MikroTik.

## Decisions

### Authentication

- Browser menggunakan session cookie `HttpOnly`.
- Cookie production menggunakan `Secure` dan `SameSite` sesuai deployment.
- Session token disimpan dalam bentuk hash di backend.
- Idle timeout adalah 30 menit dan absolute lifetime adalah 8 jam.
- Session dirotasi saat refresh dan dicabut saat logout atau perubahan role.
- Mutation yang memakai cookie authentication wajib memiliki CSRF protection.
- Error login bersifat generik untuk mencegah user enumeration.
- Rate limit login dan endpoint sensitif wajib tersedia sebelum UAT.

User pertama dibuat melalui seed Super Admin lokal. User internal berikutnya
dibuat atau diundang oleh Super Admin melalui workflow yang diaudit. Detail
reset password dan MFA dirinci pada implementation plan dengan acceptance
security test sebelum UAT.

### Roles

Role aktif pada MVP:

| Role | Kemampuan |
| --- | --- |
| `super_admin` | User/role management dan akses konfigurasi sesuai policy |
| `customer_service` | Membaca, memproses, dan mencatat follow-up registrasi |
| `auditor_viewer` | Read-only untuk registrasi dan audit scope yang diizinkan |

Role lain tetap berada dalam arsitektur, tetapi belum memiliki workflow aktif:
`general_manager`, `finance`, `noc_network_engineer`, `field_technician`, dan
`customer`.

### Registration data

Registrasi awal menyimpan:

- nama lengkap;
- nomor WhatsApp sebagai kontak utama;
- email opsional;
- alamat pemasangan;
- area/alamat ter-normalisasi bila tersedia;
- koordinat opsional hanya setelah izin pengguna;
- paket yang diminati secara opsional;
- catatan kebutuhan;
- sumber pengajuan;
- consent komunikasi;
- status;
- timestamp pengajuan dan perubahan.

Registrasi awal bukan customer resmi. Konversi ke customer dilakukan pada fase
berikutnya setelah aturan verifikasi ditetapkan.

Endpoint public registration dipisahkan dari endpoint staff, tervalidasi, diberi
rate limit, dan mendukung deduplikasi/idempotency untuk pengiriman ulang yang
aman.

### Registration statuses

Status dan transisi harus ditegakkan backend. Transisi tidak valid ditolak dan
dicatat bila relevan:

```text
baru
  -> ditindaklanjuti
  -> ditolak

ditindaklanjuti
  -> menunggu_konfirmasi_coverage
  -> perlu_survei
  -> disetujui
  -> ditolak

menunggu_konfirmasi_coverage
  -> perlu_survei
  -> disetujui
  -> ditolak

perlu_survei
  -> disetujui
  -> ditolak

disetujui
  -> selesai

ditolak
  -> selesai
```

Status dapat disesuaikan setelah workflow operasional disimulasikan dengan
Customer Service, tetapi perubahan harus melalui keputusan desain dan migration.

Customer Service dapat mengubah registrasi menjadi `disetujui` setelah coverage
terkonfirmasi. Alasan atau catatan wajib disimpan untuk keputusan tersebut.
Aturan ini tidak mengaktifkan subscription atau provisioning jaringan.

### Dashboard

Dashboard internal pertama menyediakan:

- summary jumlah registrasi per status;
- tabel registrasi terbaru;
- filter status;
- filter area;
- filter rentang tanggal;
- halaman/detail registrasi;
- riwayat perubahan;
- aksi perubahan status yang diizinkan;
- catatan follow-up;
- empty, loading, error, dan unauthorized states.

Dashboard tidak menampilkan pendapatan, invoice, subscription aktif, atau
network health pada fase ini.

## Proposed architecture

Backend tetap memakai NestJS modular monolith, Prisma, PostgreSQL, dan REST
JSON dengan prefix `/api/v1`.

Website publik dan dashboard internal memakai origin yang sama; dashboard
berada pada route `/dashboard`. Pola ini menyederhanakan cookie session dan
CSRF, sementara backend tetap menjadi sumber authorization.

Modul minimum:

```text
src/
├── common/
│   ├── auth/
│   ├── errors/
│   ├── pagination/
│   └── request-context/
├── modules/
│   ├── identity/
│   ├── access-control/
│   ├── registrations/
│   └── audit/
└── prisma/
```

Frontend menambahkan area dashboard terpisah dari public site, dengan API client
yang tidak mengakses database secara langsung. Struktur route dan komponen final
ditentukan pada implementation plan setelah kontrak API disepakati.

## Proposed API surface

Semua endpoint harus memvalidasi DTO, authorization, pagination/filter, dan
request ID:

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/me

GET  /api/v1/registrations
GET  /api/v1/registrations/:id
POST /api/v1/registrations
PATCH /api/v1/registrations/:id/status
POST /api/v1/registrations/:id/follow-ups

GET /api/v1/dashboard/registrations/summary
GET /api/v1/audit-logs
```

Endpoint public registration dapat memakai namespace
`/api/v1/public/registrations` bila pemisahan public/staff dibutuhkan oleh
kontrak akhir. Keputusan path final dibuat sebelum implementasi.

Response sukses mengembalikan payload endpoint secara langsung dan request ID
tersedia di header `X-Request-Id`; error menggunakan envelope
`{ code, message, details?, requestId }`. Pagination memakai `page`/`pageSize`,
sorting dan filter tervalidasi. Keputusan success response ini dikonfirmasi
pengguna pada 2026-11-02 untuk menjaga keselarasan dengan endpoint yang sudah
berjalan.

## Data integrity and security

- UUID/ULID dan timestamp UTC mengikuti prinsip database yang sudah disetujui.
- Nomor WhatsApp dan email dinormalisasi sebelum penyimpanan.
- PII tidak ditulis ke log biasa.
- Semua mutation registrasi menghasilkan audit event.
- Auditor tidak dapat melakukan mutation.
- Customer Service tidak dapat mengelola role atau konfigurasi keamanan.
- Super Admin tetap tunduk pada audit dan tidak otomatis mendapat akses secret.
- Pagination memiliki cap.
- Public registration memiliki rate limit dan anti-abuse controls.
- CSRF berlaku untuk mutation berbasis cookie.
- Tidak ada credential provider atau router di modul ini.
- Audit MVP mencakup login, perubahan role, registrasi, status, dan follow-up;
  PII di-redact dan retention awal mengikuti 12 bulan.

## Local development constraints

Target laptop memiliki RAM 8 GB dan Docker belum tersedia. Development awal
direkomendasikan memakai Node.js LTS, npm, dan PostgreSQL native Windows agar
lebih ringan. Docker/Compose dapat dipakai pada fase integration atau
staging-like setelah kebutuhan multi-service muncul.

## Testing expectations

- Unit test status transition, normalisasi data, permission policy, session
  policy, dan audit event.
- Integration test Prisma dengan PostgreSQL native Windows pada database/schema
  test terpisah dari development.
- API contract test untuk DTO, response envelope, pagination, dan authorization.
- E2E test login -> submit registration -> staff review -> follow-up -> audit.
- Security test untuk unauthenticated access, role denial, CSRF, rate limit, dan
  data exposure.
- Frontend smoke test untuk login state, dashboard filters, detail, mutation,
  loading, empty, dan error states.

## Decisions delegated to implementation planning

1. Nama tabel dan enum final untuk registration serta follow-up.
2. Detail mekanisme CSRF dan cookie attributes untuk environment production.
3. DTO, response envelope, dan filter field final yang tidak mengubah keputusan
   pagination `page`/`pageSize`.
4. Detail seed/undangan user dan reset password.
5. Setup database/schema test native PostgreSQL yang tidak menyentuh database
   development.

## Approval gate

Dokumen ini harus disetujui sebelum memanggil `writing-plans` atau menulis
production code. Setelah disetujui, implementation plan akan memecah pekerjaan
menjadi migration/schema, identity/RBAC, registrations, audit, API, dashboard,
test, dan validation gates.
