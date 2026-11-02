# Operasi, Keamanan, Integrasi, dan Testing

## 1. Authentication dan RBAC

- Login memakai password hash Argon2id (parameter ditetapkan melalui benchmark
  server), session refresh token yang di-rotate dan disimpan hashed.
- Cookie production: `Secure`, `HttpOnly`, `SameSite=Lax/Strict`, CSRF
  protection untuk cookie-authenticated mutations.
- Access token/session berumur pendek; logout dan reset password mencabut
  session aktif.
- Role minimum: `general_manager`, `super_admin`, `finance`, `customer_service`,
  `noc_network_engineer`, `field_technician`, `auditor_viewer`, `customer`.
- Permission dicek di guard/policy backend pada resource dan tenant/customer
  ownership; UI hiding bukan security control.
- MFA untuk admin dan network/billing roles menjadi acceptance criterion
  sebelum production.
- General Manager menjadi approver untuk diskon khusus, refund, billing
  correction, invoice cancellation, piutang write-off, instalasi, dan network
  changes berisiko tinggi. Batas nominal dan kebutuhan approver dikonfigurasi
  dalam approval policy; pemohon tidak boleh menyetujui permintaannya sendiri.

### Matriks akses awal

| Role | Fokus akses |
| --- | --- |
| General Manager | approval lintas domain dan laporan; tidak otomatis mendapat secret |
| Super Admin | konfigurasi teknis dan user; approval finansial tetap policy-controlled |
| Finance | invoice, payment, reconciliation; tidak menyetujui request sendiri |
| Customer Service | customer, tiket, registrasi; tanpa akses secret/network |
| NOC/Network Engineer | network service/device dan provisioning; tidak mengubah invoice |
| Teknisi Lapangan | work order, survey, instalasi yang ditugaskan |
| Auditor/Viewer | read-only laporan/audit sesuai scope |

Semua role menggunakan least privilege dan policy resource-level.

## 2. Billing dan pembayaran Midtrans

- Biaya instalasi gratis. Tidak ada charge instalasi pada invoice.
- Siklus tagihan bulanan dimulai satu bulan setelah layanan terpasang dan
  berstatus aktif. `activated_at` dan `first_bill_at` harus disimpan eksplisit.
- Default rule: IDR, Asia/Jakarta, monthly billing, grace period 5 hari
  kalender, prorata enabled, deposit optional, partial payment disabled,
  penalty disabled, automatic termination disabled, automatic suspension
  disabled. Semua rule configurable dan perubahan rule diaudit.

### Billing workflow

1. Subscription menjadi aktif setelah instalasi disetujui dan layanan
   terpasang; backend menyimpan `activated_at`.
2. Billing job menghitung invoice bulanan berdasarkan plan version, prorata
   bila berlaku, deposit bila dikonfigurasi, tax configuration snapshot, lalu
   membuat nomor `INV-YYYYMM-XXXXXX` secara atomik.
3. Invoice dikirim melalui WhatsApp, dengan email sebagai fallback dan salinan
   pada portal. Notification outbox memakai dedupe key dan retry.
4. Customer membuat payment intent Midtrans Snap melalui backend. Redirect
   browser hanya UX, bukan bukti pembayaran.
5. Webhook diverifikasi, payment status diambil server-side, nominal/order
   dicocokkan, lalu invoice dan payment event diperbarui idempotently.
6. Setelah due date, sistem menandai grace period lima hari. Tidak ada
   termination atau auto-suspend; reconnect/suspend hanya workflow eksplisit
   setelah validasi pembayaran dan approval policy.
7. Finance menjalankan reconciliation terhadap settlement report Midtrans dan
   membuat adjustment/reversal melalui approval, tanpa menghapus histori.

### Midtrans workflow

1. Backend membuat payment intent/order Midtrans Snap dengan `order_id` unik
   dan idempotency key.
2. User diarahkan ke payment flow Midtrans; frontend tidak mengubah invoice.
3. Webhook diverifikasi memakai signature/server credential, ukuran payload
   dibatasi, dan event disimpan dengan unique provider event/reference.
4. Backend mengambil status dari Midtrans (server-to-server), mencocokkan
   order, nominal, currency, dan invoice; hanya status valid yang mengubah
   invoice menjadi paid.
5. Pemrosesan diulang aman; job retry menggunakan backoff dan dead-letter
   visibility. Reconciliation periodik membandingkan invoice dan settlement
   report provider.
6. Refund, chargeback, settlement, invoice cancellation, write-off, dan manual
   adjustment memiliki permission terpisah, approval threshold configurable,
   separation of duties bila diwajibkan policy, dan audit log.

## 3. MikroTik dan OLT/ONU

**MikroTik tahap awal:** adapter `RouterOsClient` di backend/worker,
management IP privat/VPN, API service dibatasi firewall ke host aplikasi,
akun least privilege, timeout, circuit breaker, dan audit event. Backend
menyimpan desired state dan result provisioning; jangan mengeksekusi command
mentah dari request user. Gunakan mock adapter/lab terlebih dahulu. Tidak ada
akses RouterOS API dari browser, dan auto-disconnect tidak tersedia pada tahap
awal.

**OLT/ONU masa depan:** tetapkan interface vendor-neutral (device, PON port,
ONU serial number, location, optical information, service profile, VLAN,
provisioning status). Implementasi vendor adapter hanya setelah merek/model,
protokol, dan prosedur rollback dipilih.
Tidak ada asumsi SNMP/SSH/NETCONF/OMCI sebelum survei perangkat.

## 4. Validasi aplikasi dan proteksi

- DTO/schema validation, output serialization, strict CORS allowlist, security
  headers, body/parameter limits, pagination caps, dan rate limits per IP,
  account, serta endpoint.
- Generic auth errors untuk mencegah enumeration; log detail hanya di server.
- Secret hanya melalui environment/secret manager; `.env*` di-ignore dan
  `.env.example` berisi placeholder.
- Dependency lockfile, vulnerability scan, image scan, SBOM, dan patch policy.
- Audit semua login gagal/sukses, role changes, invoice/payment mutations,
  webhook results, provisioning, exports, dan administrative changes.
- Jangan mengirim data pelanggan asli ke layanan AI. Development memakai dummy
  data; import CSV/Excel wajib normalize, preview, duplicate-check, row-error
  report, approval, dan audit.

## 4.1 Provider adapters dan notifikasi

Gunakan interface provider untuk `WhatsAppBusinessProvider` dan
`EmailProvider`; modul customer/billing hanya menghasilkan notification
message, bukan memanggil SDK provider langsung. WhatsApp adalah channel utama,
email fallback, dan portal inbox selalu menyimpan status internal. Setiap
pesan memiliki dedupe key, idempotency key, status queued/sent/delivered/
failed, retry count, provider reference, dan redacted error. Provider dapat
diganti tanpa mengubah modul customer atau billing.

## 5. Testing strategy

- **Unit**: domain rules, invoice totals, status transitions, RBAC policies,
  signature verification, idempotency.
- **Integration**: Nest modules + PostgreSQL disposable database, Prisma
  migrations, transaction/concurrency, webhook replay.
- **Contract**: OpenAPI schema and frontend API client compatibility.
- **E2E**: registration -> survey -> installation -> subscription -> invoice ->
  Midtrans sandbox webhook -> portal status.
- **Security**: dependency/image scan, SAST, secret scan, auth abuse, rate
  limit, authorization matrix, OWASP API checks.
- **Operational**: backup restore drill, migration rollback rehearsal,
  health/readiness checks, queue retry/dead-letter behavior.
- CI blocks merge on formatting, typecheck, lint, tests, migration validation,
  and secret scan. Use synthetic fixtures only.

## 6. Backup dan pemulihan

- PostgreSQL daily encrypted full backup plus WAL/PITR strategy setelah
  kapasitas dan storage dipastikan; salinan backup disimpan terpisah dari host.
- Retention contoh: daily 14 hari, weekly 8 minggu, monthly 12 bulan; final
  retention mengikuti kebijakan bisnis/legal.
- Backup memakai least-privilege account, checksum, encryption, dan alert jika
  gagal. Jangan menyimpan secret backup di repository.
- Restore test minimal setiap 3 bulan ke environment terisolasi; ukur target
  RPO 24 jam dan RTO 8 jam serta
  dokumentasikan runbook. Backup belum dianggap valid sampai restore berhasil.

## 7. Deployment dan firewall

1. Ubuntu Server LTS hardening, automatic security updates, SSH key-only,
   management IP allowlist, non-root admin, dan firewall default deny.
2. Nginx menerima 80/443 (80 hanya redirect bila diperlukan); app port,
   PostgreSQL 5432, RouterOS API, metrics, dan SSH tidak dibuka publik.
3. Compose memakai pinned images, non-root containers, read-only filesystem
   jika kompatibel, resource limits, private networks, named volumes, dan
   healthchecks.
4. CI membangun image immutable, melakukan scan, push ke private registry,
   lalu deployment staging dengan approval. Production memakai backup,
   migration review, smoke test, dan rollback plan.
5. Frontend/backend dapat ditempatkan pada host berbeda; komunikasi backend
   database/integrasi tetap melalui private network/VPN.
6. Maintenance window awal Minggu 01.00-04.00 WIB. SLA support dibedakan
   berdasarkan prioritas insiden dan divalidasi pada fase staging. Target awal
   non-komitmen: P1 15 menit, P2 1 jam, P3 4 jam, P4 1 hari kerja. Jam layanan,
   target penyelesaian, dukungan di luar jam kerja, dan definisi dampak masih
   TBD.

## 8. Observability

Structured JSON logs tanpa secret/PII berlebih, correlation/request ID,
latency/error metrics, queue depth, database health, backup freshness,
webhook failure, dan provisioning failure. Alert harus actionable dan
memiliki runbook.
