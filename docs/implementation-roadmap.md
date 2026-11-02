# Roadmap Implementasi, Risiko, dan Pertanyaan Keputusan

## Kondisi environment yang diperiksa

Repository hanya berisi folder dan dokumen kosong. Node.js `v24.22.0` dan npm
`11.19.1` tersedia. pnpm, Docker, Docker Compose, dan psql belum tersedia.
Tidak ada instalasi yang dilakukan pada tahap desain ini.

## Tahapan realistis

### Fase 0 - keputusan dan bootstrap

Setujui dokumen arsitektur, gunakan nama produk dan folder **Instalink**,
pilih Node LTS, package manager, provider email/notification, domain strategy,
dan environment matrix. Siapkan
`.env.example`, quality gates, branch policy, dan synthetic seed data.

### Fase 1 - platform foundation

Scaffold frontend/backend/infrastructure terpisah, health endpoints, config
validation, logging, error envelope, OpenAPI, PostgreSQL Compose lokal, Prisma
migrations, CI lint/typecheck/test, dan baseline Nginx development.

### Fase 2 - identity dan master data

Implement login/session/reset, RBAC, audit log, users, customers, addresses,
coverage areas, plans, public pages, dan customer registration intake.

### Fase 3 - operasi lapangan dan layanan

Survey scheduling, technician/work order, installation checklist, subscription
lifecycle, service numbering, dan approval workflow. Network provisioning masih
feature-flagged/manual.

### Fase 4 - billing dan Midtrans sandbox

Invoice generation, payment intent, verified webhook, idempotency,
reconciliation, portal invoice, notifications, reports dasar, dan refund/manual
adjustment workflow. Uji hanya dengan sandbox.

### Fase 5 - MikroTik pilot terbatas

Buat adapter dan desired-state model, uji pada lab router/synthetic service,
audit dan rollback. Tidak ada auto-disconnect. Pilot dengan pelanggan internal
atau data non-produksi setelah runbook disetujui.

### Fase 6 - hardening dan staging

Security review, load test target 2.000 pelanggan, restore drill, monitoring,
backup verification, staging E2E, vulnerability remediation, dan UAT dengan
role nyata.

### Fase 7 - production readiness

Server Ubuntu LTS, DNS/TLS, firewall/VPN, secrets, on-call/runbook, change
approval, migration/rollback rehearsal, go-live checklist, dan post-deployment
smoke test. Deployment produksi hanya setelah persetujuan eksplisit.

Tidak ada fase deployment produksi pada tahap desain ini. Fase 7 hanya
mendefinisikan readiness gate dan runbook yang kelak memerlukan persetujuan
terpisah.

## Risiko teknis dan keamanan

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Aturan suspend belum jelas | pelanggan terputus/komplain | manual approval, grace period, no auto-disconnect |
| Aturan pajak/e-invoice belum rinci | invoice tidak sesuai kewajiban | tetapkan yurisdiksi, format, nomor seri, dan acceptance test sebelum billing production |
| Webhook duplikat/terlambat | invoice salah status | signature, provider recheck, unique event, idempotency |
| Router API terekspos | takeover jaringan | private VLAN/VPN, firewall allowlist, least privilege |
| OLT belum dipilih | adapter salah arah | vendor-neutral interface dan spike setelah hardware dipilih |
| Harga/paket berubah | histori billing rusak | plan version/effective dates dan immutable invoice |
| Backup tidak dapat dipulihkan | kehilangan data | encrypted off-host backup dan restore drill terjadwal |
| PII/log secret bocor | insiden compliance | redaction, access control, retention, secret scanning |
| Modular monolith membesar | deployment/ownership sulit | domain modules, dependency rules, outbox boundaries |
| Beban webhook/reporting | API lambat | queue, indexes, pagination, read models/report jobs |
| Ketergantungan provider | lock-in/outage | adapter, retry, reconciliation, manual fallback |
| Invoice internal disalahpahami sebagai faktur pajak | risiko kepatuhan | simpan tax configuration/version, disclaimer, dan validasi dengan pihak kompeten |
| Approval tanpa separation of duties | fraud atau koreksi tidak sah | maker-checker, threshold configurable, self-approval block |
| Pesan notifikasi ganda | kebingungan pelanggan | dedupe key, idempotency, outbox, provider reference |
| Target RPO/RTO tidak tercapai | downtime/data loss | capacity test, backup monitoring, restore drill, ukur hasil aktual |
| Import data salah | customer/invoice tidak akurat | preview, normalisasi, duplicate detection, row errors, approval, backup |

## Keputusan yang sudah disetujui

- Nama produk dan folder tetap **Instalink**; gunakan `instalink-frontend`,
  `instalink-backend`, dan `instalink-infrastructure`.
- Biaya instalasi gratis.
- Siklus tagihan satu bulan; tagihan pertama dibuat satu bulan setelah layanan
  terpasang dan aktif.
- General Manager menjadi approver untuk diskon, refund, adjustment, dan
  approval instalasi sesuai policy.
- Perubahan paket/alamat pelanggan memerlukan approval staf; tidak self-service.
- Invoice internal mendukung identitas perusahaan, pelanggan, rincian layanan,
  periode tagihan, pajak, dan total; tidak diklaim sebagai faktur pajak resmi.
- Detail pajak/e-invoice, status perpajakan perusahaan, dan provider pajak tetap
  TBD.
- Yurisdiksi bisnis Indonesia, mata uang IDR, dan zona waktu Asia/Jakarta.
- Format invoice internal `INV-YYYYMM-XXXXXX`; invoice bukan asumsi faktur pajak.
- Billing bulanan dengan prorata configurable, deposit optional, grace period
  awal 5 hari kalender, denda dan pembayaran sebagian nonaktif, serta tidak ada
  termination otomatis.
- Role final: General Manager, Super Admin, Finance, Customer Service,
  NOC/Network Engineer, Teknisi Lapangan, Auditor/Viewer.
- WhatsApp channel utama, email fallback, dan notifikasi portal; provider
  WhatsApp belum dipilih.
- Midtrans Snap Sandbox sebagai tahap awal; transaksi dibuat backend, webhook
  dan status diverifikasi server-side, redirect bukan bukti pembayaran, dan
  settlement direkonsiliasi.
- MikroTik CCR1036 dengan PPPoE langsung dan tanpa RADIUS tahap awal; adapter
  terisolasi, mock/lab sebelum router produksi, tanpa auto-disconnect.
- Backup harian dengan salinan terpisah; target awal RPO 24 jam, RTO 8 jam,
  restore test minimal setiap 3 bulan, maintenance Minggu 01.00-04.00 WIB,
  retensi audit 12 bulan.
- Import CSV/Excel wajib memiliki validasi, preview, deduplikasi, error per
  baris, approval, normalisasi, dan audit.
- RBAC memakai General Manager, Super Admin, Finance, Customer Service,
  NOC/Network Engineer, Teknisi Lapangan, dan Auditor/Viewer. Approval
  threshold dan matriks final masih configurable/TBD.
- Separation of duties diterapkan untuk pembuatan, persetujuan, dan rekonsiliasi
  transaksi sesuai risiko.
- Target SLA awal non-komitmen: P1 15 menit, P2 1 jam, P3 4 jam, P4 1 hari
  kerja. Jam layanan, target penyelesaian, dan definisi dampak masih TBD.

## Asumsi sementara

- Provider WhatsApp Business Platform dan email akan dipanggil melalui adapter,
  bukan langsung dari modul domain.
- Portal notification inbox selalu menyimpan status internal meskipun provider
  eksternal gagal.
- Invoice internal adalah dokumen komersial sampai status pajak dan format resmi
  dikonfirmasi.
- Mock adapter dan data sintetis digunakan untuk Midtrans, MikroTik, OLT/ONU,
  notifikasi, dan migrasi selama desain/pengembangan awal.
- Hardware server dan lokasi disaster recovery belum mengubah arsitektur
  logical; keputusan kapasitas akan dilakukan melalui capacity planning.

## Hal yang masih TBD

1. Detail aturan pajak Indonesia, format e-invoice/faktur pajak, nomor seri,
   dan apakah perlu integrasi penyedia pajak tertentu?
2. Detail prorata, deposit, grace period setelah fase awal, denda, serta aturan
   validasi pembayaran sebelum suspend/reconnect?
3. Batas nominal approval dan separation of duties untuk setiap jenis request?
4. Provider WhatsApp, sender/account ownership, fallback email provider, dan
   template notifikasi wajib?
5. Produk/metode pembayaran Midtrans final, merchant account, settlement
   report format, dan rekening settlement?
6. Detail MikroTik: RouterOS version, topology, management VLAN/VPN, address
   plan, PPPoE naming, profile, bandwidth policy, dan lab router?
7. Merek/model OLT/ONU, jumlah PON, VLAN model, dan protokol management yang
   mungkin dipilih?
8. Spesifikasi server, anggaran, backup target, lokasi disaster recovery,
   konektivitas, static IP, dan kebutuhan RAID/UPS?
9. SLA support per prioritas insiden serta validasi target RPO/RTO?
10. Data migrasi awal apa yang tersedia, dan bagaimana memastikan data tersebut
    sintetis/di-redact selama development?

## Dependensi sebelum implementasi

| Modul | Dependensi minimum |
| --- | --- |
| Identity/RBAC | daftar role final, permission matrix, MFA policy, password/session policy |
| Customer/master data | field identitas perusahaan/pelanggan, privacy/retention policy |
| Billing/invoice | aturan pajak yang berlaku, tax configuration, prorata/deposit detail, approval threshold |
| Midtrans | akses Sandbox, product/method final untuk pilot, webhook contract, settlement report sample |
| Notification | provider WhatsApp/email, ownership sender, template, opt-in/consent policy |
| MikroTik | RouterOS version, topology, management network/VPN, lab/mock contract |
| OLT/ONU | vendor/model, firmware, protocol, topology, rollback procedure |
| Import/migration | sample file, mapping fields, normalization rules, duplicate policy, backup/approval owner |
| Infrastructure | capacity budget, backup destination, DR location, firewall/VPN plan |
| Operations | SLA definitions, on-call ownership, monitoring signals, RPO/RTO test plan |

## Rekomendasi urutan implementasi setelah persetujuan coding

1. Platform foundation dan environment contract tanpa koneksi produksi.
2. Identity, RBAC, audit log, approval engine, dan konfigurasi.
3. Customer, address, coverage, plan version, dan import preview/approval.
4. Survey, installation, technician, subscription, dan customer portal dasar.
5. Billing/invoice dengan tax abstraction dan rule configuration.
6. Notification outbox dengan mock WhatsApp/email/portal providers.
7. Midtrans Sandbox, webhook verification, idempotency, dan reconciliation.
8. MikroTik mock/lab adapter; provisioning manual dan auto-disconnect tetap off.
9. OLT/ONU vendor-neutral model tanpa vendor implementation.
10. Backup/restore drill, monitoring, security testing, load testing, lalu staging.

## Gate persetujuan

Implementasi belum dimulai sampai keputusan pertanyaan di atas memiliki owner
dan jawaban minimum untuk fase terkait. Setelah disetujui, fase dikerjakan
berurutan dengan demo, test evidence, dan approval gate; keputusan baru dicatat
sebagai ADR di folder `docs/`.
