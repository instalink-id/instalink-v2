# Verifikasi Customer Service Foundation

## Cakupan

Verifikasi mencakup alur registrasi publik sampai tindak lanjut staf, autentikasi
session dan CSRF, hak auditor, audit log, isolasi database test, dokumentasi
setup native Windows, serta build frontend/backend.

## Hasil

| Pemeriksaan | Hasil |
| --- | --- |
| Backend lint | Lulus tanpa warning |
| Backend unit/contract | 12 file, 31 test lulus |
| Backend E2E | 2 file, 5 test lulus |
| Backend production build | Lulus |
| Frontend lint | Lulus |
| Frontend production build | Lulus |
| `git diff --check` | Lulus |
| Prisma migration | Migration foundation berhasil diterapkan pada database test terisolasi |
| Seed Super Admin | Satu akun sintetis dibuat dan diverifikasi pada database test |

E2E memakai PostgreSQL 18 sementara pada loopback, database `instalink_test`,
dan hanya fixture sintetis. Test memeriksa guard URL test, idempotency
registrasi, login berhasil/gagal, atribut cookie, `/me`, filter dan detail,
penolakan mutation tanpa CSRF, transisi status, approval invalid yang tidak
mencatat audit, follow-up, redaksi auditor, penolakan mutation auditor,
logout/revokasi session, serta redaksi snapshot audit. Tidak ada koneksi ke
database produksi atau database PostgreSQL lokal yang sudah berjalan.

## Temuan yang ditangani

- E2E menemukan mutation status dan follow-up belum mewajibkan CSRF. Guard
  ditambahkan dan alur tanpa token kini ditolak tanpa mengubah status.
- E2E menemukan event login/logout dan registrasi baru belum dicatat. Event
  ditambahkan secara transaksional; snapshot yang memuat PII di-redact.
- Review independen menemukan `x-request-id` lebih dari 128 karakter dapat
  menggagalkan insert audit. Nilai panjang kini diganti UUID server; UUID yang
  sama dipakai di response dan correlation audit.

## Batasan dan pekerjaan tertunda

- Login rate limit belum tersedia. Rate limit registrasi publik masih
  in-memory per proses dan bukan solusi untuk deployment multi-instance.
- Refresh session, reset password, MFA, role management, provider eksternal,
  billing, subscription, serta integrasi MikroTik/OLT belum diaktifkan.
- Pertanyaan TBD pada implementation roadmap masih memerlukan owner dan
  keputusan sebelum fase yang bergantung padanya; tidak ada keputusan bisnis
  baru yang diasumsikan dalam vertical slice ini.
- Tidak dilakukan deployment, push, atau koneksi ke sistem produksi.
