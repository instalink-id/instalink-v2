# Kontrak REST API Awal

Base URL: `/api/v1`. Response sukses mengembalikan payload endpoint secara
langsung; request ID tersedia pada header `X-Request-Id`. Error memakai format
terstruktur `{ code, message, details?, requestId }`. Pagination memakai
`page`, `pageSize`, `sort`, dan filter tervalidasi. Swagger tersedia di
environment non-production atau di balik akses admin. Request ID dari client
dibatasi 128 karakter; nilai lebih panjang diganti dengan UUID server sebelum
dipakai pada response dan audit correlation.

## Implemented endpoints: Customer Service foundation

Endpoint berikut telah tersedia pada backend:

| Method | Path | Akses |
| --- | --- | --- |
| GET | `/health`, `/health/ready` | public |
| POST | `/auth/login` | public |
| POST | `/auth/logout` | authenticated + CSRF |
| GET | `/me` | authenticated |
| POST | `/public/registrations` | public, validation, idempotency, rate limited |
| GET | `/registrations` | `customer_service`, `super_admin`, `auditor_viewer` |
| GET | `/registrations/:id` | `customer_service`, `super_admin`, `auditor_viewer` |
| PATCH | `/registrations/:id/status` | `customer_service`, `super_admin` + CSRF |
| POST | `/registrations/:id/follow-ups` | `customer_service`, `super_admin` + CSRF |
| GET | `/dashboard/registrations/summary` | `customer_service`, `super_admin`, `auditor_viewer` |
| GET | `/audit-logs` | `super_admin`, `auditor_viewer` |

Registrasi mendukung filter `status`, `area`, `from`, `to`, `page`, dan
`pageSize`. Status dan follow-up ditegakkan backend. Mutasi staf menggunakan
session cookie dan header `x-csrf-token` yang harus sama dengan cookie
`instalink_csrf`; cookie session bernama `instalink_session` dan berstatus
HttpOnly. Endpoint login mengeluarkan kedua cookie tersebut.

Audit tersedia untuk login berhasil/gagal, logout, registrasi baru, perubahan
status, dan follow-up. Snapshot audit dan response auditor meredaksi PII.
Rate limit registrasi saat ini berbasis memori proses dan harus diganti dengan
mekanisme bersama sebelum deployment multi-instance.

## Planned identity and access endpoints (not implemented)

| Method | Path | Akses |
| --- | --- | --- |
| POST | `/auth/refresh` | refresh session |
| POST | `/auth/password/forgot` | public, rate limited |
| POST | `/auth/password/reset` | reset token |
| GET | `/users` | `users:read` |
| POST | `/users` | `users:write` |
| PATCH | `/users/:id/roles` | `roles:write` |
| GET/PATCH | `/approval-policies` | `approval_policy:read/write` |

Login rate limit, refresh/reset password, manajemen user, dan policy approval
belum diimplementasikan.

## Planned website, customer, coverage, and catalog endpoints

| Method | Path | Akses |
| --- | --- | --- |
| GET | `/public/plans` | public |
| GET | `/public/coverage-areas` | public |
| GET/POST/PATCH | `/customers`, `/customers/:id` | customer_service/finance sesuai policy |
| GET/POST/PATCH | `/service-addresses`, `/service-addresses/:id` | owner/customer_service; perubahan perlu approval bila policy |
| GET/POST/PATCH | `/coverage-areas`, `/coverage-areas/:id` | `coverage:*` |
| GET/POST/PATCH | `/plans`, `/plans/:id` | `catalog:*` |
| GET/POST/PATCH | `/imports`, `/imports/:id` | finance/admin; upload, preview, validate, approve |
| POST | `/imports/:id/commit` | approver setelah preview dan error review |

Untuk `auditor_viewer`, API meredaksi nama, kontak, alamat pemasangan,
koordinat presisi, serta catatan bebas; izin read-only tidak membuka PII.

## Survey, instalasi, dan teknisi

| Method | Path | Akses |
| --- | --- | --- |
| GET/POST/PATCH | `/surveys`, `/surveys/:id` | customer_service/field_technician |
| GET/POST/PATCH | `/installations`, `/installations/:id` | customer_service/field_technician |
| GET/POST/PATCH | `/technicians`, `/technicians/:id` | super_admin/customer_service |
| POST | `/installations/:id/complete` | assigned field technician + approval |

## Subscription, billing, payment, dan portal

| Method | Path | Akses |
| --- | --- | --- |
| GET/POST/PATCH | `/subscriptions`, `/subscriptions/:id` | finance/customer_service; perubahan perlu approval |
| GET | `/portal/subscriptions` | current customer |
| GET | `/invoices`, `/invoices/:id` | owner/billing |
| POST | `/invoices/preview` | finance; hitung prorata dan tax configuration |
| POST | `/invoices/:id/adjustments` | finance mengajukan; policy approval |
| POST | `/invoices/:id/cancel-request` | finance mengajukan; policy approval |
| POST | `/invoices/:id/payment-intent` | owner, idempotency key |
| POST | `/payments/midtrans/webhook` | provider signature + rate limit |
| GET | `/payments/:id/status` | owner/billing |
| POST | `/payments/:id/refund-request` | billing mengajukan; General Manager menyetujui |
| POST | `/approvals/:id/decide` | General Manager atau approver yang ditentukan policy |
| GET | `/settlements/midtrans` | finance; reconciliation report |

## Planned support, notifications, reports, and network endpoints

| Method | Path | Akses |
| --- | --- | --- |
| GET/POST/PATCH | `/tickets`, `/tickets/:id` | customer/customer_service |
| POST | `/tickets/:id/messages` | participant |
| GET/POST | `/notifications`, `/notifications/:id/retry` | staff/system |
| GET | `/portal/notifications` | current customer |
| GET | `/reports/customers`, `/reports/revenue`, `/reports/payments` | reporting |
| GET | `/network/devices` | noc_network_engineer/auditor_viewer |
| POST | `/network/services/:id/provision` | noc_network_engineer, feature flag |
| POST | `/network/services/:id/suspend` | disabled until payment/business approval |
| POST | `/network/services/:id/reconnect` | disabled until payment/business validation |

Endpoint write yang sensitif wajib memiliki permission, approval workflow bila
diperlukan, audit event,
idempotency key bila dapat diulang, validasi DTO, dan optimistic/concurrency
guard bila relevan. Jangan menganggap endpoint internal aman hanya karena
tidak ditampilkan pada frontend.

Semua route pada bagian berjudul **Planned** di atas belum tersedia pada
backend saat ini.
