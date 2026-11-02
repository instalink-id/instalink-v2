# Kontrak REST API Awal

Base URL: `/api/v1`. Response sukses mengembalikan payload endpoint secara
langsung; request ID tersedia pada header `X-Request-Id`. Error memakai format
terstruktur `{ code, message, details?, requestId }`. Pagination memakai
`page`, `pageSize`, `sort`, dan filter tervalidasi. Swagger tersedia di
environment non-production atau di balik akses admin.

## Identity dan akses

| Method | Path | Akses |
| --- | --- | --- |
| POST | `/auth/login` | public, rate limited |
| POST | `/auth/refresh` | refresh session |
| POST | `/auth/logout` | authenticated |
| POST | `/auth/password/forgot` | public, rate limited |
| POST | `/auth/password/reset` | reset token |
| GET | `/me` | authenticated |
| GET | `/users` | `users:read` |
| POST | `/users` | `users:write` |
| PATCH | `/users/:id/roles` | `roles:write` |
| GET/PATCH | `/approval-policies` | `approval_policy:read/write` |

## Website, pelanggan, cakupan, dan catalog

| Method | Path | Akses |
| --- | --- | --- |
| GET | `/public/plans` | public |
| GET | `/public/coverage-areas` | public |
| POST | `/public/registrations` | public, anti-abuse |
| GET/POST/PATCH | `/customers`, `/customers/:id` | customer_service/finance sesuai policy |
| GET/POST/PATCH | `/service-addresses`, `/service-addresses/:id` | owner/customer_service; perubahan perlu approval bila policy |
| GET/POST/PATCH | `/coverage-areas`, `/coverage-areas/:id` | `coverage:*` |
| GET/POST/PATCH | `/plans`, `/plans/:id` | `catalog:*` |
| GET/POST/PATCH | `/imports`, `/imports/:id` | finance/admin; upload, preview, validate, approve |
| POST | `/imports/:id/commit` | approver setelah preview dan error review |

## Customer Service dashboard

| Method | Path | Akses |
| --- | --- | --- |
| GET | `/dashboard/registrations/summary` | `dashboard:read` |
| GET | `/registrations`, `/registrations/:id` | `registration:read` |
| PATCH | `/registrations/:id/status` | `registration:write` |
| POST | `/registrations/:id/follow-ups` | `registration:write` |

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

## Support, notifications, reports, audit, dan network

| Method | Path | Akses |
| --- | --- | --- |
| GET/POST/PATCH | `/tickets`, `/tickets/:id` | customer/customer_service |
| POST | `/tickets/:id/messages` | participant |
| GET/POST | `/notifications`, `/notifications/:id/retry` | staff/system |
| GET | `/portal/notifications` | current customer |
| GET | `/reports/customers`, `/reports/revenue`, `/reports/payments` | reporting |
| GET | `/audit-logs` | security/admin, read-only |
| GET | `/network/devices` | noc_network_engineer/auditor_viewer |
| POST | `/network/services/:id/provision` | noc_network_engineer, feature flag |
| POST | `/network/services/:id/suspend` | disabled until payment/business approval |
| POST | `/network/services/:id/reconnect` | disabled until payment/business validation |

Endpoint write yang sensitif wajib memiliki permission, approval workflow bila
diperlukan, audit event,
idempotency key bila dapat diulang, validasi DTO, dan optimistic/concurrency
guard bila relevan. Jangan menganggap endpoint internal aman hanya karena
tidak ditampilkan pada frontend.
