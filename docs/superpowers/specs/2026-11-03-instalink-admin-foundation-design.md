# InstaLink Admin Foundation Design

## Intent

Lengkapi fondasi dashboard admin InstaLink secara bertahap dengan manajemen
akun internal, konfigurasi backend yang tervalidasi, dan alur penggantian
password pertama. Fitur harus memakai NestJS, Prisma, PostgreSQL, dan dashboard
Next.js yang sudah ada; tidak membuat mekanisme autentikasi kedua.

## Current state

- Backend sudah menggunakan NestJS modular monolith, Prisma/PostgreSQL,
  Argon2id, session cookie, logout, CSRF, `SessionGuard`, `PermissionGuard`,
  validasi global, error envelope, dan audit service.
- Dashboard Next.js memakai backend same-origin, menampilkan ringkasan serta
  alur registrasi Customer Service, dan memiliki shell berbasis `/me`.
- Schema sudah memiliki `User`, `Role`, `UserRole`, `Session`, dan `AuditLog`.
  Relasi role saat ini many-to-many; password user belum memiliki penanda wajib
  ganti password.
- Belum ada API atau halaman manajemen pengguna, alur perubahan password,
  maupun middleware konfigurasi environment yang memvalidasi konfigurasi saat
  backend mulai.
- Pemeriksaan PostgreSQL terakhir dilakukan dalam transaksi read-only: schema
  target yang dikonfigurasi tidak menampilkan tabel atau riwayat migration.
  Tidak ada perubahan pada database. Nilai secret `.env` tidak dicatat pada
  dokumen ini.

## Goals

- Memvalidasi konfigurasi runtime dan koneksi PostgreSQL tanpa mengekspos
  secret.
- Membuat migration Prisma additive, dapat direview, tanpa menghapus atau
  mengubah data bisnis yang ada.
- Menambahkan manajemen akun staf pada dashboard melalui endpoint yang hanya
  dapat diakses `super_admin`.
- Mempertahankan autentikasi, sesi, CSRF, validasi, error envelope, dan audit
  yang sudah ada.
- Menerapkan satu role per akun dan permission least-privilege untuk tujuh role
  yang disetujui.
- Memberi akun baru password sementara acak yang hanya ditampilkan sekali dan
  wajib diganti sebelum menggunakan endpoint dashboard lainnya.
- Menguji migration, RBAC, status akun, session revocation, redaksi audit, dan
  alur dashboard memakai data sintetis serta database test terpisah.

## Non-goals

- Tidak mengganti framework, menulis ulang dashboard, atau membuat auth kedua.
- Tidak mengimplementasikan domain billing, payment, customer, teknisi, atau
  network provisioning pada pekerjaan ini.
- Tidak menambah provider email atau mengirim invitation/reset link.
- Tidak menghapus user, audit log, atau data lama.
- Tidak menjalankan deployment, migration ke production, atau membuka akses
  PostgreSQL ke internet.
- Tidak menambahkan MFA pada tahap ini; MFA tetap wajib sebelum UAT/production
  untuk role yang ditentukan security policy.

## Anti-goals

- Jangan menetapkan `super_admin` sebagai role default akun baru.
- Jangan memberi role permission untuk domain yang belum diimplementasikan.
- Jangan mengembalikan atau mencatat password hash, token session, atau secret.
- Jangan mengandalkan UI hiding sebagai kontrol otorisasi.
- Jangan menonaktifkan atau menurunkan role Super Admin terakhir yang masih
  aktif.
- Jangan menjalankan migration terhadap database remote tanpa persetujuan
  eksplisit dan pemeriksaan target tepat sebelum eksekusi.

## Approaches

1. **Fondasi admin lengkap (dipilih):** validasi environment, migration
   additive, API dan UI manajemen user, first-login password change, RBAC,
   audit, serta integrasi pada dashboard yang ada. Memberi alur administrasi
   utuh tanpa mengaktifkan domain yang belum siap.
2. **Backend dahulu:** implementasikan config, migration, API/RBAC, dan test;
   UI manajemen user menyusul. Risiko lebih kecil per tahap tetapi belum
   menyediakan alur administrasi yang dapat dipakai dari dashboard.
3. **Aktifkan seluruh workflow role:** menambahkan billing, teknisi, network,
   serta approval untuk semua role. Ditolak untuk scope ini karena bergantung
   pada aturan bisnis/provider yang masih TBD dan memperluas risiko.

## Decisions

### Roles and access

Role kanonis dan kode internal:

| Label | Code |
| --- | --- |
| General Manager | `general_manager` |
| Super Admin | `super_admin` |
| Keuangan / Finance | `finance` |
| Customer Service | `customer_service` |
| NOC / Network Engineer | `noc_network_engineer` |
| Teknisi Lapangan / Field Technician | `field_technician` |
| Auditor / Viewer | `auditor_viewer` |

Setiap akun staf memiliki tepat satu role. `super_admin` adalah satu-satunya
role yang dapat mengelola akun dan role. Role yang belum memiliki workflow
domain tidak menerima izin untuk mengakses fitur lain. Untuk fitur yang sudah
ada, `general_manager` mendapat akses baca setara `auditor_viewer`, termasuk
redaksi PII; `customer_service` mempertahankan akses kerja registrasi;
`super_admin` mempertahankan akses operasional yang ada; dan role
`finance`, `noc_network_engineer`, serta `field_technician` belum memperoleh
permission dashboard sampai domain mereka tersedia.

### User lifecycle and passwords

- Super Admin membuat akun dengan email dan satu role yang dipilih eksplisit.
- Backend membuat password sementara acak secara kriptografis, menyimpan
  Argon2id hash saja, dan mengembalikan plaintext satu kali pada response
  create/reset. UI menampilkannya sekali; tidak menyimpan pada Web Storage.
- Password sementara berlaku selama 24 jam sejak create/reset. Percobaan login
  setelah kedaluwarsa tetap menghasilkan respons kredensial generik. Akun
  hanya dapat digunakan lagi setelah Super Admin melakukan reset; reset baru
  memberi masa berlaku 24 jam.
- Akun dibuat aktif dengan `mustChangePassword=true`. Login tetap memakai
  session cookie yang sudah ada. Sampai password diganti, `/me`, logout, dan
  endpoint ganti password diizinkan; endpoint terproteksi lainnya ditolak
  backend dengan error terstruktur. Jika password sementara kedaluwarsa saat
  sesi berlangsung, akses selain logout ditolak dan user harus meminta reset
  dari Super Admin.
- Perubahan password memerlukan CSRF, password saat ini (termasuk password
  sementara), dan validasi password baru. Perubahan password mencabut semua
  sesi lain namun mempertahankan sesi yang sedang digunakan. Reset oleh Super
  Admin mengganti password sementara dan mencabut semua sesi akun sasaran.
  Perubahan role atau penonaktifan juga mencabut semua sesi.
- User dinonaktifkan, bukan dihapus. Self-disable, self-role-change, serta
  perubahan yang menonaktifkan/menurunkan Super Admin aktif terakhir ditolak.
  Pemeriksaan last-admin dan mutasinya berjalan dalam transaksi
  `Serializable`; konflik transaksi dikembalikan sebagai konflik yang aman
  untuk dicoba ulang.

### API surface

Semua endpoint memakai `/api/v1`, payload sukses langsung, `X-Request-Id`,
error envelope standar, DTO validation, session cookie, dan CSRF untuk
mutation.

| Method | Path | Access |
| --- | --- | --- |
| GET | `/users` | `super_admin`; filter status/role/search dan pagination tervalidasi |
| POST | `/users` | `super_admin` + CSRF; create user dan password sementara sekali |
| PATCH | `/users/:id/role` | `super_admin` + CSRF; ganti satu role |
| PATCH | `/users/:id/status` | `super_admin` + CSRF; aktif/nonaktifkan |
| POST | `/users/:id/reset-password` | `super_admin` + CSRF; password sementara sekali |
| POST | `/auth/password/change` | session + CSRF; wajib saat `mustChangePassword=true` |
| GET | `/me` | session; menyertakan flag wajib ganti password |

Password, hash, session token, dan CSRF secret tidak menjadi bagian response
user list/detail.

### Database and migrations

- Gunakan model `User`, `Role`, `UserRole`, `Session`, dan `AuditLog` yang ada.
- Tambahkan `mustChangePassword Boolean NOT NULL DEFAULT false` pada `User`.
- Tambahkan `passwordChangeExpiresAt DateTime?` untuk batas 24 jam password
  sementara; kosongkan saat password wajib ganti sudah diperbarui.
- Tegakkan satu role per user dengan unique index pada `UserRole.userId`.
  Sebelum menerapkan index pada schema yang telah dipakai, periksa duplikasi;
  migration harus gagal aman jika data konflik dan tidak boleh menghapus
  assignment otomatis.
- Tambahkan enum audit action untuk user dibuat, role/status berubah, dan
  password di-reset/diganti. Snapshot audit mengikuti serializer redaksi.
- Upsert katalog role kanonis pada seed. Akun Super Admin seed dibuat hanya
  bila email tersebut belum ada; menjalankan seed ulang tidak mengubah password,
  status, ataupun role akun yang sudah ada. Seed tetap mewajibkan email/password
  dari environment dan tidak membuat akun lain secara default.
- Migration hanya additive. Generate dan review SQL sebelum menjalankannya.
  Verifikasi menggunakan database test terpisah. Untuk database remote,
  berhenti dan minta persetujuan eksplisit sebelum menerapkan migration.
- Strategi rollback operasional: hentikan rilis dan gunakan forward-fix untuk
  database yang sudah berisi user; jangan drop data/kolom/index secara otomatis.
  Pada database test kosong, database dapat dibuat ulang sesuai prosedur test.

### Configuration and error handling

- Validasi `DATABASE_URL` sebagai PostgreSQL URL dan validasi `NODE_ENV`,
  `PORT`, serta format origin. Nilai secret tidak dimasukkan ke log maupun
  pesan validasi.
- Jangan mengubah `.env` lokal pengguna atau menambahkan credential ke Git.
  Perbarui `.env.example` hanya dengan placeholder/struktur bila diperlukan.
- Pertahankan `ValidationPipe` dan error envelope saat ini. Mapping error
  Prisma yang dikenal (misalnya email duplikat/unique constraint) menjadi
  error client yang aman dan konsisten; kesalahan tak terduga tetap
  disampaikan sebagai 500 tanpa detail internal.

### Dashboard integration

- Tambahkan navigasi dan route manajemen user pada dashboard yang ada; hanya
  tampilkan untuk `super_admin`, dan backend tetap memeriksa permission.
- Implementasikan list/search/status/role filter, create-user form, pilihan
  role berlabel Indonesia, perubahan role/status, reset temporary password,
  loading/empty/error/forbidden state, dan tampilan password sementara sekali.
- Tambahkan halaman wajib-ganti-password dan arahkan user ke halaman ini
  selama `mustChangePassword` masih aktif.
- Pertahankan gaya dashboard yang sudah ada dan tidak menambah dependency
  frontend.

### Audit

Audit append-only mencatat actor, target user, action, correlation ID, serta
snapshot redacted sebelum/sesudah perubahan yang relevan. User/email tetap
disamarkan sesuai kebijakan auditor. Jangan pernah mengaudit password,
password hash, temporary password, token session, atau CSRF token.

## Validation strategy

- Unit tests untuk environment validation, password policy/generation,
  permission matrix, dan aturan last-active-super-admin/self-change.
- API tests untuk unauthenticated/forbidden/CSRF, DTO validation, duplikasi
  email, user create/list/update/reset, password change, revocation, dan audit.
- PostgreSQL E2E pada DB test lokal terpisah: seed role, create user,
  first login, paksa password change, akses endpoint setelah perubahan,
  reset/revocation, serta authorization tiap role.
- Migration test: review SQL dan terapkan berurutan pada DB test kosong;
  uji unique-index failure pada fixture duplikat tanpa menghapus assignment.
- Frontend lint/build dan smoke test untuk user management serta redirect
  password wajib ganti.
- Jangan menganggap query database yang telah dilakukan sebagai migration
  approval; database remote tidak berubah selama tahap desain ini.

## Remaining builder choices

- Nama dan lokasi route frontend detail (`/dashboard/users` dan
  `/dashboard/change-password` diusulkan).
- Ukuran batas halaman/search dan minimal panjang password baru ditetapkan
  mengikuti batas global proyek dan praktik keamanan yang berlaku.
- Pesan UI Bahasa Indonesia dirumuskan konsisten dengan komponen dashboard
  yang sudah ada.
