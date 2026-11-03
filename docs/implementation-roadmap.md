# Roadmap Implementasi, Risiko, dan Pertanyaan Keputusan

## Kondisi environment yang diperiksa

Repository kini berisi frontend Next.js, backend NestJS/Prisma, infrastruktur,
dan dokumentasi arsitektur. Backend memakai PostgreSQL melalui `DATABASE_URL`;
E2E diwajibkan memakai database lokal loopback dengan nama berakhiran `_test`.
Tidak ada koneksi ke production database, deployment, atau kredensial nyata
dalam fondasi ini. Docker Compose tersedia untuk PostgreSQL lokal tetapi tidak
menjadi prasyarat bagi development native Windows.

Fondasi platform, login/session, permission MVP, audit log, user administration,
Customer Service registration API, dan dashboard terkait sudah tersedia.
Master data pelanggan, billing, pembayaran, provisioning jaringan, dan
deployment production masih menunggu keputusan/dependensi domain.

## Tahapan realistis

### Fase 0 - keputusan dan bootstrap

**Selesai sebagian:** dokumen arsitektur dan nama folder/product telah
disetujui; environment contract, `.env.example`, quality checks, dan synthetic
seed tersedia. Pemilihan provider email/notification dan keputusan domain yang
masih terbuka tercatat pada tabel owner/decision gate di bawah.

### Fase 1 - platform foundation

**Selesai untuk fondasi MVP:** frontend/backend/infrastructure terpisah, health
endpoints, validasi konfigurasi, error envelope, OpenAPI, PostgreSQL/Prisma,
migrations, serta lint/test/build lokal. CI dan baseline Nginx production-ready
tetap menjadi hardening work.

### Fase 2 - identity dan master data

**Selesai sebagian:** login/logout/session, password change, RBAC MVP, audit
log, admin users, dan registration intake tersedia. Self-service recovery,
MFA, customer/address/coverage/plan master data, serta domain approval masih
belum diimplementasikan.

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
- Kode role backend: `general_manager`, `super_admin`, `finance`,
  `customer_service`, `noc_network_engineer`, `field_technician`,
  `auditor_viewer`. MVP permissions aktif untuk Super Admin, Customer Service,
  General Manager, dan Auditor/Viewer; Finance, NOC, dan Teknisi menunggu
  implementasi modul domain masing-masing.
- Admin lifecycle MVP: hanya Super Admin mengelola akun staf; satu role per
  akun; password sementara berlaku 24 jam dan wajib diganti pada login pertama.
  Reset password dan perubahan status mencabut session target.
- Session MVP: idle timeout 30 menit, absolute lifetime 8 jam, cookie session
  HttpOnly, dan mutasi memakai CSRF token. Seed membuat akun Super Admin jika
  belum ada; seed ulang tidak merotasi password/status/role akun yang sudah ada.
- Browser MFA belum tersedia dan tetap menjadi gate wajib sebelum UAT/production
  dengan akun nyata.
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

## Hal yang masih TBD: owner dan decision gate

Pemilik proyek InstaLink adalah accountable owner untuk keputusan bisnis sampai
owner individu ditunjuk. Keputusan tetap TBD dan memblokir hanya fase yang
bergantung padanya; tidak memblokir fondasi identity yang sudah disetujui.

| Topik yang belum diputuskan | Owner | Keputusan/gate |
| --- | --- | --- |
| Pajak Indonesia, format e-invoice/faktur pajak, nomor seri, penyedia pajak | Pemilik proyek; konsultasi finance/accounting | Tetapkan kewajiban dan acceptance criteria sebelum Fase 4 |
| Prorata, deposit, grace period final, denda, validasi pembayaran suspend/reconnect | Pemilik proyek; konsultasi finance dan Customer Service | No auto-disconnect tetap berlaku; aturan rinci diputuskan sebelum billing/provisioning |
| Batas approval dan separation of duties | Pemilik proyek; konsultasi finance | Tetapkan threshold dan approver sebelum workflow approval/billing |
| Provider WhatsApp/email, kepemilikan sender, consent, template | Pemilik proyek; owner komunikasi ditunjuk sebelum integrasi | Pilih provider dan kebijakan consent sebelum notifikasi eksternal |
| Produk/metode Midtrans, merchant account, settlement/rekening | Pemilik proyek; owner finance | Tentukan untuk Sandbox/pilot sebelum transaksi non-sintetis |
| RouterOS, topology, management VLAN/VPN, PPPoE profile, bandwidth, lab | Pemilik proyek; owner network ditunjuk | Putuskan sebelum MikroTik pilot; tetap mock/lab sampai saat itu |
| Vendor/model OLT/ONU, jumlah PON, VLAN, protokol, rollback | Pemilik proyek; owner network ditunjuk | Putuskan sebelum integrasi OLT/ONU |
| Server, anggaran, backup/DR, konektivitas, static IP, RAID/UPS | Pemilik proyek; owner infrastructure ditunjuk | Putuskan melalui capacity planning sebelum staging |
| SLA support serta target RPO/RTO | Pemilik proyek; owner operations ditunjuk | Validasi melalui operasi/restore drill sebelum production readiness |
| Data migrasi, mapping, duplikasi, redaksi dan approval | Pemilik proyek; data owner ditunjuk | Putuskan setelah sample data ditinjau sebelum import/migration |

## Dependensi sebelum implementasi

| Modul | Dependensi minimum |
| --- | --- |
| Identity/RBAC | role dan permission MVP/password/session policy sudah diputuskan; MFA wajib sebelum UAT/production; self-service recovery dan role-catalog administration masih backlog |
| Customer/master data | field identitas perusahaan/pelanggan, privacy/retention policy |
| Billing/invoice | aturan pajak yang berlaku, tax configuration, prorata/deposit detail, approval threshold |
| Midtrans | akses Sandbox, product/method final untuk pilot, webhook contract, settlement report sample |
| Notification | provider WhatsApp/email, ownership sender, template, opt-in/consent policy |
| MikroTik | RouterOS version, topology, management network/VPN, lab/mock contract |
| OLT/ONU | vendor/model, firmware, protocol, topology, rollback procedure |
| Import/migration | sample file, mapping fields, normalization rules, duplicate policy, backup/approval owner |
| Infrastructure | capacity budget, backup destination, DR location, firewall/VPN plan |
| Operations | SLA definitions, on-call ownership, monitoring signals, RPO/RTO test plan |

## Urutan kerja berikutnya

1. Putuskan field/privasi master data dan implement customers, addresses,
   coverage, plan version, serta import preview/approval.
2. Implement survey, installation, technician, subscription, dan customer
   portal dasar.
3. Implement billing/invoice setelah pajak, approval threshold, dan aturan
   suspend/reconnect diputuskan.
4. Implement notification outbox/provider adapters; gunakan mock sampai
   provider, ownership, dan consent disetujui.
5. Midtrans Sandbox, webhook verification, idempotency, dan reconciliation.
6. MikroTik mock/lab adapter; provisioning manual dan auto-disconnect tetap off.
7. OLT/ONU vendor-neutral model tanpa vendor implementation.
8. Backup/restore drill, MFA, monitoring, security/load testing, lalu staging.

## Gate persetujuan

Fondasi platform dan identity MVP telah diimplementasikan berdasarkan desain
yang disetujui. Pertanyaan domain di atas memiliki accountable owner dan gate
per fase; keputusan rinci tetap harus dicatat sebagai ADR sebelum pekerjaan
domain terkait dimulai. Tidak ada koneksi production, migration remote, atau
deployment production tanpa review dan persetujuan eksplisit terpisah.
