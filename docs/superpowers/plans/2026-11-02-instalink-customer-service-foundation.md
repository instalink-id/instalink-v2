# InstaLink Customer Service Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure, testable Customer Service vertical slice from public registration through staff follow-up and audit.

**Architecture:** Keep the NestJS modular monolith, Prisma/PostgreSQL, and REST `/api/v1` backend. Add a same-origin `/dashboard` Next.js surface that uses the backend API and session cookie; enforce authentication, RBAC, CSRF, validation, and audit behavior in the backend rather than relying on UI visibility.

**Tech Stack:** NestJS 12, TypeScript, Prisma 6, PostgreSQL, class-validator/class-transformer, Swagger/OpenAPI, Vitest, Supertest, Next.js 16 App Router, React 19, Tailwind CSS 4, npm.

**Spec:** [docs/superpowers/specs/2026-11-02-instalink-customer-service-foundation-design.md](../specs/2026-11-02-instalink-customer-service-foundation-design.md)

## Global Constraints

- Use session cookie authentication; production cookies are `HttpOnly` and `Secure`, idle timeout is 30 minutes, absolute lifetime is 8 hours, and sessions rotate and revoke on logout or role changes.
- Active MVP roles are `super_admin`, `customer_service`, and `auditor_viewer`; UI hiding is never authorization.
- Public registration stores WhatsApp as the primary contact, email as optional, address, consent, optional coordinates only with permission, and remains distinct from a customer.
- Registration status transitions are backend-enforced; approval requires confirmed coverage and a required reason/note.
- Public registration is rate-limited, validated, deduplicated/idempotent, and isolated from staff endpoints.
- Dashboard is served at `/dashboard` on the same origin as the public website.
- API uses `/api/v1`, a consistent response/error envelope, validated `page`/`pageSize` pagination, sorting, and filters.
- Audit login, role changes, registrations, status changes, and follow-ups; redact PII and retain the initial audit scope for 12 months.
- Use synthetic fixtures only; do not add production credentials, customer data, router secrets, or provider secrets.
- Do not implement billing, Midtrans, subscription activation, automatic disconnection, MikroTik/OLT provisioning, or production deployment.
- Use PostgreSQL native Windows with a separate test database/schema; do not require Docker for the first local development slice.
- Preserve the existing public-site routes and existing backend hardening.

## Review Focus

- **Session fixation/replay:** a rotated or revoked session must no longer authenticate; covered by Task 2 session lifecycle tests.
- **Cross-role mutation:** `auditor_viewer` must receive authorization denial for every mutation and `customer_service` must not manage roles; covered by Task 3 policy and API tests.
- **Public duplicate/abuse submission:** repeated idempotency keys and normalized duplicate contacts must not create unintended registrations; covered by Task 4 public registration tests.
- **Invalid status approval:** approval without confirmed coverage or without a reason must fail atomically and create no misleading audit event; covered by Task 5 transition tests.
- **PII leakage through list/audit responses:** list, detail, and audit serialization must redact fields according to role/scope; covered by Tasks 5 and 6 serialization tests.

---

### Task 1: Establish Prisma service, schema, and test database boundary

**Files:**
- Create: `instalink-backend/src/prisma/prisma.service.ts`
- Create: `instalink-backend/src/prisma/prisma.module.ts`
- Modify: `instalink-backend/src/app.module.ts`
- Modify: `instalink-backend/prisma/schema.prisma`
- Create: `instalink-backend/prisma/seed.ts`
- Create: `instalink-backend/test/helpers/test-database.ts`
- Create: `instalink-backend/test/prisma-foundation.spec.ts`
- Create: `instalink-backend/prisma/migrations/<timestamp>_customer_service_foundation/migration.sql`
- Modify: `instalink-backend/package.json` only if a seed script is required

**Interfaces:**
- Produces `PrismaService` as a global injectable database client.
- Produces models for `User`, `Role`, `UserRole`, `Session`, `Registration`, `RegistrationFollowUp`, `AuditLog`, and the minimum enums/constraints needed by later tasks.
- Produces a deterministic synthetic seed entry for one local Super Admin without storing a plaintext password.
- Test helper requires an explicit test `DATABASE_URL` and refuses to run against the development database.

- [ ] **Step 1: Write failing Prisma foundation tests**

Create tests proving the schema can persist and retrieve:

- one seeded Super Admin and role relation;
- one registration with optional email/coordinates;
- one follow-up linked to a registration;
- one audit event linked to an actor;
- uniqueness/idempotency constraints reject duplicate keys.

- [ ] **Step 2: Run the focused test and verify the expected schema/service failure**

Run:

```powershell
Set-Location .\instalink-backend
npm.cmd test -- prisma-foundation.spec.ts
```

Expected: FAIL because the models and `PrismaService` do not yet exist.

- [ ] **Step 3: Implement the Prisma service/module and schema**

Use UUID primary keys, UTC timestamps, explicit status/role enums, indexes for
status/area/submitted time, unique constraints for session token hashes and
idempotency keys, and foreign keys with appropriate deletion behavior. Keep
registration separate from customer records.

- [ ] **Step 4: Add migration and guarded synthetic seed**

Create the migration through the repository's Prisma workflow. The seed must
create the local Super Admin role/user using an environment-provided password
input or a documented development-only mechanism; never commit a password.

- [ ] **Step 5: Run the focused and backend foundation tests**

Run:

```powershell
npm.cmd test -- prisma-foundation.spec.ts
npm.cmd run lint
```

Expected: schema persistence tests and lint pass against the separate test
database.

- [ ] **Step 6: Commit**

```powershell
git add instalink-backend
git commit -m "feat: add customer service data foundation"
```

### Task 2: Implement session authentication and CSRF protection

**Files:**
- Create: `instalink-backend/src/modules/identity/identity.module.ts`
- Create: `instalink-backend/src/modules/identity/identity.controller.ts`
- Create: `instalink-backend/src/modules/identity/identity.service.ts`
- Create: `instalink-backend/src/modules/identity/dto/login.dto.ts`
- Create: `instalink-backend/src/modules/identity/guards/session.guard.ts`
- Create: `instalink-backend/src/modules/identity/guards/csrf.guard.ts`
- Create: `instalink-backend/src/modules/identity/session-cookie.ts`
- Create: `instalink-backend/src/common/decorators/current-user.decorator.ts`
- Create: `instalink-backend/test/identity/session.spec.ts`
- Modify: `instalink-backend/src/app.module.ts`
- Modify: `instalink-backend/src/main.ts`

**Interfaces:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `SessionGuard` attaches a typed authenticated principal.
- `CsrfGuard` protects cookie-authenticated mutations and exposes only a
  non-secret CSRF token through the documented flow.

- [ ] **Step 1: Write failing session tests**

Test successful login, generic invalid-login response, HttpOnly cookie issuance,
30-minute idle/8-hour absolute policy values, refresh rotation, logout
revocation, role-change revocation hook, `/me`, and CSRF rejection/acceptance.

- [ ] **Step 2: Run the tests and verify failure**

```powershell
npm.cmd test -- session.spec.ts
```

Expected: FAIL because identity endpoints, session persistence, and guards do
not exist.

- [ ] **Step 3: Implement password verification and session lifecycle**

Use a memory-hard password hashing adapter selected in the plan execution
without exposing hashes or passwords in responses/logs. Store only hashed
session tokens, rotate on refresh, enforce idle and absolute expiry, and revoke
on logout or role change.

- [ ] **Step 4: Implement cookie and CSRF policy**

Use same-origin assumptions for `/dashboard`, explicit production cookie flags,
origin validation, and a CSRF mechanism compatible with the existing CORS
configuration. Do not weaken existing security headers.

- [ ] **Step 5: Run identity tests and full backend checks**

```powershell
npm.cmd test -- session.spec.ts
npm.cmd run lint
npm.cmd run build
```

Expected: all identity tests pass and the backend compiles.

- [ ] **Step 6: Commit**

```powershell
git add instalink-backend
git commit -m "feat: add session authentication and csrf protection"
```

### Task 3: Add role and permission enforcement

**Files:**
- Create: `instalink-backend/src/modules/access-control/access-control.module.ts`
- Create: `instalink-backend/src/modules/access-control/permissions.ts`
- Create: `instalink-backend/src/modules/access-control/permission.decorator.ts`
- Create: `instalink-backend/src/modules/access-control/permission.guard.ts`
- Create: `instalink-backend/test/access-control/permission.spec.ts`
- Modify: `instalink-backend/src/app.module.ts`

**Interfaces:**
- `Permission` is a string-literal union with explicit MVP permissions.
- `@RequirePermissions(...permissions: Permission[])` annotates protected
  handlers.
- `PermissionGuard` checks the authenticated principal's role permissions from
  backend data, not frontend state.

- [ ] **Step 1: Write failing authorization tests**

Prove:

- Super Admin can manage users/roles and registrations according to policy.
- Customer Service can read and process registrations.
- Auditor can read allowed registration/audit data.
- Auditor cannot mutate.
- Customer Service cannot manage roles.
- Unauthenticated requests receive the repository-standard auth error.

- [ ] **Step 2: Run tests to verify failure**

```powershell
npm.cmd test -- permission.spec.ts
```

Expected: FAIL because permissions and guard enforcement do not exist.

- [ ] **Step 3: Implement explicit permission map and guard**

Define only permissions needed by the vertical slice, apply guards after
session authentication, and return a consistent authorization error without
revealing role internals.

- [ ] **Step 4: Run authorization and existing backend tests**

```powershell
npm.cmd test -- permission.spec.ts
npm.cmd test
npm.cmd run lint
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```powershell
git add instalink-backend
git commit -m "feat: enforce customer service rbac"
```

### Task 4: Implement public registration intake and idempotency

**Files:**
- Create: `instalink-backend/src/modules/registrations/registrations.module.ts`
- Create: `instalink-backend/src/modules/registrations/registrations.controller.ts`
- Create: `instalink-backend/src/modules/registrations/registrations.service.ts`
- Create: `instalink-backend/src/modules/registrations/dto/create-registration.dto.ts`
- Create: `instalink-backend/src/modules/registrations/registration-normalizer.ts`
- Create: `instalink-backend/src/modules/registrations/registration-status.ts`
- Create: `instalink-backend/test/registrations/public-registration.spec.ts`
- Modify: `instalink-backend/src/app.module.ts`
- Modify: `instalink-backend/src/app.config.ts` if rate-limit configuration requires it

**Interfaces:**
- `POST /api/v1/public/registrations`
- `GET /api/v1/registrations`
- `GET /api/v1/registrations/:id`
- Public response returns a safe reference/status envelope and never exposes
  internal audit or credential data.

- [ ] **Step 1: Write failing intake tests**

Test required name/WhatsApp/address/consent validation, optional email and
coordinates, whitespace normalization, invalid coordinate rejection,
idempotent repeat submission, duplicate handling, and public response
redaction.

- [ ] **Step 2: Run tests to verify failure**

```powershell
npm.cmd test -- public-registration.spec.ts
```

Expected: FAIL because the registration module and endpoint do not exist.

- [ ] **Step 3: Implement normalization, validation, persistence, and dedupe**

Normalize WhatsApp/email/address before persistence, require consent, preserve
the original source, enforce idempotency/duplicate constraints, apply public
rate limiting, and initialize status as `baru`.

- [ ] **Step 4: Implement staff list/detail read endpoints**

Add validated filters for status, area, submitted date range, sorting, and
bounded `page`/`pageSize`; apply permission checks and role-aware serialization.

- [ ] **Step 5: Run registration and backend checks**

```powershell
npm.cmd test -- public-registration.spec.ts
npm.cmd test
npm.cmd run lint
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add instalink-backend
git commit -m "feat: accept public customer registrations"
```

### Task 5: Add status transitions, follow-ups, and audit logging

**Files:**
- Create: `instalink-backend/src/modules/audit/audit.module.ts`
- Create: `instalink-backend/src/modules/audit/audit.service.ts`
- Create: `instalink-backend/src/modules/audit/audit.controller.ts`
- Create: `instalink-backend/src/modules/audit/audit-serializer.ts`
- Create: `instalink-backend/src/modules/registrations/dto/change-registration-status.dto.ts`
- Create: `instalink-backend/src/modules/registrations/dto/create-follow-up.dto.ts`
- Create: `instalink-backend/test/registrations/status-transition.spec.ts`
- Create: `instalink-backend/test/audit/audit-redaction.spec.ts`
- Modify: `instalink-backend/src/modules/registrations/registrations.controller.ts`
- Modify: `instalink-backend/src/modules/registrations/registrations.service.ts`
- Modify: `instalink-backend/src/app.module.ts`

**Interfaces:**
- `PATCH /api/v1/registrations/:id/status`
- `POST /api/v1/registrations/:id/follow-ups`
- `GET /api/v1/audit-logs`
- `RegistrationStatusPolicy.canTransition(from, to, context)` returns a typed
  decision.
- `AuditService.record(event)` stores redacted append-only events.

- [ ] **Step 1: Write failing state-machine and audit tests**

Test every approved transition, invalid transitions, approval without confirmed
coverage, approval without reason, required follow-up note, atomic failure
behavior, audit creation, and PII redaction for auditor responses.

- [ ] **Step 2: Run tests to verify failure**

```powershell
npm.cmd test -- status-transition.spec.ts audit-redaction.spec.ts
```

Expected: FAIL because transition policy and audit service do not exist.

- [ ] **Step 3: Implement typed status policy and transactional mutations**

Enforce:

```text
baru -> ditindaklanjuti | ditolak
ditindaklanjuti -> menunggu_konfirmasi_coverage | perlu_survei | disetujui | ditolak
menunggu_konfirmasi_coverage -> perlu_survei | disetujui | ditolak
perlu_survei -> disetujui | ditolak
disetujui -> selesai
ditolak -> selesai
```

Require confirmed coverage and a reason for `disetujui`, require notes for
follow-ups, update registration and audit in one transaction, and reject
self-inconsistent mutations.

- [ ] **Step 4: Implement append-only audit query and redaction**

Record actor, action, resource, correlation/request ID, before/after redacted
snapshots, and timestamp. Restrict audit visibility to the configured scope and
retention metadata.

- [ ] **Step 5: Run transition, audit, and full backend checks**

```powershell
npm.cmd test -- status-transition.spec.ts audit-redaction.spec.ts
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: all tests pass and the backend compiles.

- [ ] **Step 6: Commit**

```powershell
git add instalink-backend
git commit -m "feat: add registration workflow and audit trail"
```

### Task 6: Add dashboard summary and API contract coverage

**Files:**
- Create: `instalink-backend/src/modules/dashboard/dashboard.module.ts`
- Create: `instalink-backend/src/modules/dashboard/dashboard.controller.ts`
- Create: `instalink-backend/src/modules/dashboard/dashboard.service.ts`
- Create: `instalink-backend/src/modules/dashboard/dto/registration-summary.dto.ts`
- Create: `instalink-backend/test/dashboard/dashboard-api.spec.ts`
- Modify: `instalink-backend/src/app.module.ts`
- Modify: `instalink-backend/src/main.ts` for complete Swagger metadata

**Interfaces:**
- `GET /api/v1/dashboard/registrations/summary`
- Summary response contains counts for every registration status, including
  zero-count statuses, plus a bounded latest-registration list.
- All list/detail/summary responses use the documented success envelope and
  errors use `{ code, message, details?, requestId }`.

- [ ] **Step 1: Write failing dashboard API tests**

Test role access, zero-count status buckets, latest ordering, date/area
filters, pagination caps, error envelope/request ID, and Swagger route metadata.

- [ ] **Step 2: Run tests to verify failure**

```powershell
npm.cmd test -- dashboard-api.spec.ts
```

Expected: FAIL because the dashboard module and summary endpoint do not exist.

- [ ] **Step 3: Implement dashboard query service and controller**

Use aggregate queries with indexes from Task 1, keep filtering server-side, and
return a stable typed DTO that the frontend can consume without database-shaped
responses.

- [ ] **Step 4: Verify API contract**

```powershell
npm.cmd test -- dashboard-api.spec.ts
npm.cmd run lint
npm.cmd run build
```

Expected: all contract tests pass and Swagger generation compiles.

- [ ] **Step 5: Commit**

```powershell
git add instalink-backend
git commit -m "feat: expose customer service dashboard api"
```

### Task 7: Build authenticated dashboard shell and registration workflow UI

**Files:**
- Create: `instalink-frontend/app/dashboard/layout.tsx`
- Create: `instalink-frontend/app/dashboard/page.tsx`
- Create: `instalink-frontend/app/dashboard/login/page.tsx`
- Create: `instalink-frontend/app/dashboard/registrations/page.tsx`
- Create: `instalink-frontend/app/dashboard/registrations/[id]/page.tsx`
- Create: `instalink-frontend/components/dashboard/dashboard-shell.tsx`
- Create: `instalink-frontend/components/dashboard/registration-summary.tsx`
- Create: `instalink-frontend/components/dashboard/registration-table.tsx`
- Create: `instalink-frontend/components/dashboard/registration-filters.tsx`
- Create: `instalink-frontend/components/dashboard/follow-up-form.tsx`
- Create: `instalink-frontend/lib/api-client.ts`
- Create: `instalink-frontend/lib/dashboard-api.ts`
- Create: `instalink-frontend/lib/dashboard-types.ts`
- Create: `instalink-frontend/tests/dashboard-smoke.spec.ts`
- Modify: `instalink-frontend/components/site-header.tsx` only if dashboard link/access state is needed
- Modify: `instalink-frontend/package.json` only if an existing approved browser test runner is already available; do not add a new runner without approval

**Interfaces:**
- API client sends same-origin requests with credentials and CSRF header where
  required; it never stores session tokens in localStorage.
- Dashboard pages consume the typed summary/list/detail/follow-up contracts from
  Tasks 5 and 6.
- Unauthorized responses redirect to `/dashboard/login`; forbidden responses
  render an explicit access-denied state.

- [ ] **Step 1: Write failing frontend contract/smoke tests**

Test login state routing, summary cards, latest registrations, status/area/date
filters, registration detail, follow-up submission, loading/empty/error states,
and absence of token storage in localStorage.

- [ ] **Step 2: Run the focused frontend test and verify failure**

Use the repository's existing browser validation mechanism if available. If no
test runner is present, document the gap and use a deterministic browser smoke
script without adding a dependency.

Expected: FAIL because dashboard routes and API client do not exist.

- [ ] **Step 3: Implement typed same-origin API client**

Implement request/response types, credentials policy, CSRF handling, structured
error parsing, and unauthorized/forbidden behavior.

- [ ] **Step 4: Implement dashboard layout and pages**

Build the shell, summary, table, filters, detail, status action, and follow-up
form using the existing visual language. Include explicit loading, empty,
error, and unauthorized states. Keep Indonesian-facing labels and do not show
unimplemented billing/network metrics.

- [ ] **Step 5: Run frontend validation**

```powershell
Set-Location ..\instalink-frontend
npm.cmd run lint
npm.cmd run build
```

Expected: lint and production build pass; browser smoke assertions cover the
dashboard route where the existing environment supports them.

- [ ] **Step 6: Commit**

```powershell
git add instalink-frontend
git commit -m "feat: add customer service dashboard"
```

### Task 8: End-to-end verification, documentation, and security gate

**Files:**
- Create: `instalink-backend/test/e2e/customer-service-flow.e2e-spec.ts`
- Create: `docs/superpowers/verification/2026-11-02-customer-service-foundation.md`
- Modify: `README.md`
- Modify: `docs/api.md`
- Modify: `docs/database.md`
- Modify: `docs/operations-security.md`

**Interfaces:**
- E2E flow: public registration -> staff login -> list/filter -> detail ->
  coverage confirmation -> approval with reason -> follow-up -> audit query.
- Documentation records local setup without exposing secrets and distinguishes
  implemented endpoints from planned endpoints.

- [ ] **Step 1: Write the failing end-to-end flow**

Use synthetic fixtures and a separate PostgreSQL test database. Assert response
envelopes, cookie auth, CSRF, role denial, registration lifecycle, and audit
record redaction.

- [ ] **Step 2: Run the E2E test to verify the expected failure**

```powershell
Set-Location .\instalink-backend
npm.cmd run test:e2e -- customer-service-flow.e2e-spec.ts
```

Expected: FAIL until all preceding modules are wired together.

- [ ] **Step 3: Implement only integration wiring required by the flow**

Do not add billing, payment, subscription, network, or production deployment
behavior to make the test pass.

- [ ] **Step 4: Update local setup and API/database/security documentation**

Document native PostgreSQL test database separation, seed behavior, dashboard
route, implemented API paths, session/CSRF expectations, role matrix, and
synthetic-data constraints. Do not document secret values.

- [ ] **Step 5: Run the complete validation gate**

```powershell
Set-Location .\instalink-backend
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build

Set-Location ..\instalink-frontend
npm.cmd run lint
npm.cmd run build

Set-Location ..
git diff --check
git status --short
```

Expected: every command exits successfully, the full test suites are green,
`git diff --check` reports no issues, and only intended files are modified.

- [ ] **Step 6: Request final code review and record deferred work**

Review authentication, authorization, PII handling, transaction boundaries,
idempotency, and public endpoint abuse controls. Record remaining TBD items
such as MFA, provider integrations, billing, and network provisioning without
silently enabling them.

- [ ] **Step 7: Commit**

```powershell
git add README.md docs instalink-backend instalink-frontend
git commit -m "test: verify customer service foundation end to end"
```
