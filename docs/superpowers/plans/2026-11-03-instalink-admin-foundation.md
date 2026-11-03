# InstaLink Admin Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe admin user management and first-login password change to the existing InstaLink backend and dashboard without replacing authentication or enabling unfinished business domains.

**Architecture:** Keep NestJS modular monolith, Prisma/PostgreSQL, the existing session-cookie/CSRF/RBAC pipeline, and the same-origin Next.js dashboard. Add only user lifecycle state and API/UI flows needed for a Super Admin to manage one-role staff accounts; backend remains the authorization source.

**Tech Stack:** NestJS 12, TypeScript, Prisma 6, PostgreSQL, Argon2id, class-validator, Vitest/Supertest, Next.js 16 App Router, React 19, existing Tailwind components, npm.

**Spec:** [docs/superpowers/specs/2026-11-03-instalink-admin-foundation-design.md](../specs/2026-11-03-instalink-admin-foundation-design.md)

## Global Constraints

- Preserve the existing framework, public website, registration dashboard, session-cookie authentication, CSRF, audit, and REST contract.
- Use PostgreSQL; never print database URLs, passwords, hashes, session tokens, temporary passwords, or other secrets to logs.
- Use additive, reviewable Prisma migrations; never delete existing users, role assignments, audit rows, or other data.
- Canonical role codes are `general_manager`, `super_admin`, `finance`, `customer_service`, `noc_network_engineer`, `field_technician`, and `auditor_viewer`; one role per staff account.
- Only `super_admin` can manage users. GM has auditor-equivalent redacted read access to current registration views; unfinished Finance/NOC/Field Technician domains have no permissions.
- New/reset temporary passwords are cryptographically random, displayed once, expire after 24 hours, and require password change before other protected endpoints.
- Change password requires the current password and CSRF; revoke other sessions but retain the current session. Role/status/reset mutations revoke target sessions.
- Last-active-Super-Admin checks and status/role changes use `Serializable` transactions; serialization conflicts fail safely as conflicts and are not silently retried.
- Do not delete users, enable production integrations, deploy, or connect to production.
- Test migrations and E2E only against a separate local PostgreSQL test database; request explicit approval immediately before applying migrations to the configured remote database.
- Do not stage or commit pre-existing changes, including `instalink-backend/tsconfig.build.tsbuildinfo`.

## Review Focus

- **Existing duplicate `UserRole` rows:** migration must fail without deleting or rewriting any assignment; Task 1 tests migration against duplicate synthetic assignments.
- **Temporary password expires during an authenticated forced-change session:** the next protected request must be denied and the UI must direct the user to request a Super Admin reset; Task 2 tests expiry at request time.
- **Last active Super Admin is disabled or demoted concurrently:** serializable transactions must reject a second concurrent change and retain an active Super Admin; Task 3 tests concurrent disable/demotion.
- **Stale sessions after disable, role change, or password reset:** previously issued cookies must no longer authorize requests; Task 3 E2E verifies revocation.
- **Role escalation or user-management access by non-Super-Admin:** every user-management route must reject other roles regardless of UI state; Task 3 API tests exercise the authorization matrix.
- **Password changes during login:** session creation must be conditional on the verified password hash and active account status still matching; Task 5 adds a regression test for the stale-password race.

---

### Task 1: Validate runtime configuration and extend the user schema

**Files:**
- Create: `instalink-backend/src/config/environment.ts`
- Create: `instalink-backend/test/config/environment.spec.ts`
- Create: `instalink-backend/prisma/migrations/20261103140000_admin_foundation/migration.sql`
- Create: `instalink-backend/prisma/migrations/migration_lock.toml`
- Create: `instalink-backend/test/migrations/admin-foundation-migration.e2e-spec.ts`
- Modify: `instalink-backend/src/app.module.ts`
- Modify: `instalink-backend/prisma/schema.prisma`
- Modify: `instalink-backend/package.json` only if a Prisma command is missing

**Interfaces:**
- Produces `validateEnvironment(config: Record<string, unknown>): Record<string, unknown>`, wired to `ConfigModule.forRoot({ validate })`.
- Requires a valid PostgreSQL `DATABASE_URL` outside `NODE_ENV=test`; validates allowed runtime mode, integer port range `1..65535`, and comma-separated absolute frontend origins without printing values.
- Adds `User.mustChangePassword Boolean @default(false)` and nullable `User.passwordChangeExpiresAt DateTime?`.
- Adds a unique index on `UserRole.userId` and audit enum values `USER_CREATED`, `USER_ROLE_CHANGED`, `USER_STATUS_CHANGED`, `USER_PASSWORD_RESET`, and `USER_PASSWORD_CHANGED`.
- Migration must not delete data and must fail if existing user-role assignments violate the one-role invariant.

- [x] **Step 1: Write failing environment validation tests**

Test valid PostgreSQL URLs, missing/invalid `DATABASE_URL` outside tests,
non-PostgreSQL schemes, malformed frontend origins, invalid ports, and test
mode without a database URL. Assert failures do not include the URL or secret.

- [x] **Step 2: Run the focused tests**

Run:

```powershell
Set-Location .\instalink-backend
npm.cmd test -- --run test/config/environment.spec.ts
```

Expected: FAIL because the validator does not yet exist.

- [x] **Step 3: Implement and wire environment validation**

Implement `validateEnvironment` and register it in `ConfigModule.forRoot`.
Keep existing `.env.local` / `.env` loading behavior and do not read or modify
the user's `.env` from code-generation commands.

- [x] **Step 4: Verify environment tests**

Run the focused command from Step 2.

Expected: all valid cases pass, invalid cases fail with sanitized messages,
and no database secret appears in test output.

- [x] **Step 5: Add schema fields and additive migration**

Update Prisma schema and generate/review migration SQL. Use a preflight
duplicate-assignment check that raises an error before creating the unique
index; do not auto-select or delete a role. Keep all existing rows and
defaults intact.

- [x] **Step 6: Validate migration on isolated PostgreSQL**

Create a disposable local `instalink_test` database, apply the existing
foundation migration and this migration, then verify the two new user columns
and unique index with
`npm.cmd run test:e2e -- --run test/migrations/admin-foundation-migration.e2e-spec.ts`.
In a separate disposable database, insert two role assignments for one user
and verify the new migration fails without deleting either row. Do not apply
migrations to the remote configured database in this task.

- [x] **Step 7: Run focused backend validation and commit**

Run `npm.cmd test -- --run test/config/environment.spec.ts`,
`npm.cmd exec -- prisma validate`, `npm.cmd exec -- prisma generate`, and
`npm.cmd run lint`.
Expected: all commands pass.

Commit only Task 1 files:

```powershell
git add instalink-backend/src/config/environment.ts instalink-backend/test/config/environment.spec.ts instalink-backend/src/app.module.ts instalink-backend/prisma/schema.prisma instalink-backend/prisma/migrations/20261103140000_admin_foundation/migration.sql
git commit -m "feat: validate admin database configuration"
```

### Task 2: Enforce temporary-password lifecycle

**Files:**
- Create: `instalink-backend/src/modules/identity/password-policy.ts`
- Create: `instalink-backend/src/modules/identity/decorators/forced-password-change.decorator.ts`
- Create: `instalink-backend/src/modules/identity/dto/change-password.dto.ts`
- Create: `instalink-backend/test/identity/password-policy.spec.ts`
- Create: `instalink-backend/test/e2e/identity-password-change.e2e-spec.ts`
- Modify: `instalink-backend/src/modules/identity/identity.service.ts`
- Modify: `instalink-backend/src/modules/identity/identity.controller.ts`
- Modify: `instalink-backend/src/modules/identity/guards/session.guard.ts`
- Modify: `instalink-backend/src/http-error.filter.ts`
- Modify: `instalink-backend/src/modules/identity/session-cookie.ts` only if shared constants/helper are needed
- Modify: `instalink-backend/src/modules/identity/dto/` with password-change DTO
- Modify: `instalink-backend/test/identity/session.spec.ts`
- Modify: `instalink-backend/test/identity/me.spec.ts`
- Modify: `instalink-backend/test/dashboard/dashboard-api.spec.ts`
- Modify: `instalink-backend/test/registrations/registration-list-api.spec.ts`
- Modify: `instalink-backend/test/e2e/customer-service-flow.e2e-spec.ts`

**Interfaces:**
- Consumes Task 1's `mustChangePassword` and `passwordChangeExpiresAt`.
- Produces `POST /api/v1/auth/password/change`, protected by existing session and CSRF guards.
- `POST /auth/password/change` accepts `{ currentPassword: string; newPassword: string }`; new password is `12..128` characters.
- `/me` includes `mustChangePassword` but no session/hash/token data.
- Unexpired forced-change sessions may access only `/me`, logout, and password change; expired temporary-password sessions cannot use protected routes.
- Login response remains generic for expired/invalid temporary credentials.

- [x] **Step 1: Write failing password-policy and guard tests**

Test random temporary passwords are URL-safe and at least 32 characters,
temporary password expiry is exactly 24 hours from creation/reset, expiry is
checked at request time, and password policy rejects under-12/over-128
characters.

- [x] **Step 2: Run focused tests and verify RED**

Run:

```powershell
Set-Location .\instalink-backend
npm.cmd test -- --run test/identity/password-policy.spec.ts test/identity/session.spec.ts test/identity/me.spec.ts
```

Expected: FAIL because temporary-password lifecycle is not implemented.

- [x] **Step 3: Implement temporary password policy**

Generate temporary passwords with Node's cryptographic random source; hash
with the existing Argon2id dependency. Store only the hash and expiry timestamp.

- [x] **Step 4: Implement forced-change enforcement and password change**

Use the authenticated principal's current session ID. Require current password
and CSRF, verify before updating, clear the forced-change/expiry fields, revoke
other active sessions in the same transaction, and keep the current session
usable.

- [x] **Step 5: Verify identity tests**

Run the focused command from Step 2 and the full `npm.cmd test`.
Run the password-change E2E and complete E2E suites on the isolated local
PostgreSQL database with file parallelism disabled because the E2E files share
that database.

Expected: forced-change access boundaries, mid-session expiry, successful
change, invalid current password, and session revocation tests pass.

- [x] **Step 6: Commit**

```powershell
git add instalink-backend/src/modules/identity instalink-backend/src/http-error.filter.ts instalink-backend/test/identity instalink-backend/test/e2e/identity-password-change.e2e-spec.ts instalink-backend/test/e2e/customer-service-flow.e2e-spec.ts instalink-backend/test/dashboard/dashboard-api.spec.ts instalink-backend/test/registrations/registration-list-api.spec.ts
git commit -m "feat: require first-login password changes"
```

### Task 3: Add role catalog and Super Admin user-management API

**Files:**
- Create: `instalink-backend/src/modules/users/users.module.ts`
- Create: `instalink-backend/src/modules/users/users.controller.ts`
- Create: `instalink-backend/src/modules/users/users.service.ts`
- Create: `instalink-backend/src/modules/users/dto/user-list-query.dto.ts`
- Create: `instalink-backend/src/modules/users/dto/create-user.dto.ts`
- Create: `instalink-backend/src/modules/users/dto/change-user-role.dto.ts`
- Create: `instalink-backend/src/modules/users/dto/change-user-status.dto.ts`
- Create/modify: `instalink-backend/test/users/users-api.spec.ts`
- Modify: `instalink-backend/src/modules/access-control/permissions.ts`
- Modify: `instalink-backend/src/modules/audit/audit-serializer.ts`
- Modify: `instalink-backend/prisma/seed.ts`
- Modify: `instalink-backend/src/app.module.ts`
- Create: `instalink-backend/test/users/seed.spec.ts`
- Create: `instalink-backend/test/e2e/admin-user-management.e2e-spec.ts`
- Review without changing unless needed: `instalink-backend/src/modules/registrations/registration-serializer.ts` and `instalink-backend/src/modules/audit/audit.service.ts`

**Interfaces:**
- Consumes Task 1 schema/config and Task 2 password policy.
- Produces `GET /users`, `POST /users`, `PATCH /users/:id/role`,
  `PATCH /users/:id/status`, and `POST /users/:id/reset-password`.
- `GET /users` supports `page`, `pageSize`, `role`, `status`, and case-insensitive
  email search; response never includes `passwordHash`.
- Role catalog is idempotently upserted by seed. The seed creates the
  environment-configured Super Admin only if absent; reruns do not change an
  existing user's password, status, or roles.
- Permission map: Super Admin retains current permissions plus user
  management; Customer Service retains registration read/write/dashboard;
  General Manager and Auditor/Viewer have read/dashboard/audit only with PII
  redacted; Finance, NOC, and Field Technician receive no permissions for
  unfinished domains.
- Only Super Admin may use user endpoints. All mutations require CSRF.
- Role/status/reset writes, audit entries, and relevant session revocations are
  transactional. Prevent self role-change/self-disable and prevent disabling
  or demoting the last active Super Admin with `Serializable` isolation; return
  serialization conflicts as a safe 409 without silently retrying.
- Create/reset returns plaintext temporary password once with expiry timestamp;
  audit snapshots must exclude password and redact email.

- [x] **Step 1: Write failing permission and user API tests**

Test the seven role permission sets; Super Admin-only route access; CSRF;
pagination/filter validation; duplicate email conflict; create with explicitly
selected single role; password/hash not present in normal responses; role/status
change session revocation; self-change prevention; last-active-Super-Admin
protection including simultaneous disable/demotion attempts; reset
expiry/revocation; seed reruns preserving existing admin credentials/status/
roles; and audit redaction.

- [x] **Step 2: Run focused tests and verify RED**

Run:

```powershell
Set-Location .\instalink-backend
npm.cmd test -- --run test/users/users-api.spec.ts test/access-control/permission.spec.ts
```

Expected: FAIL because user routes and expanded role policy are absent.

- [x] **Step 3: Implement role catalog, policies, and safe seed**

Add the seven role codes and Indonesian display labels. Seed roles idempotently;
create the seed Super Admin only when its normalized email is absent.

- [x] **Step 4: Implement user CRUD-lifecycle service and controllers**

Implement list/create/role/status/reset endpoints. Use DTO validation, map
Prisma uniqueness errors to the existing conflict envelope, and never expose
hashes or temporary credentials outside create/reset responses. No delete
endpoint.

- [x] **Step 5: Verify API tests and database-backed user lifecycle**

Run focused tests, then PostgreSQL E2E on the isolated local test database for
create -> login -> forced password change -> role update/disable/reset ->
revoked session. Include test proving no destructive cleanup is used on the
configured remote database.

No schema change is required for this task, so do not run migrations. Set
`DATABASE_URL` and `TEST_DATABASE_URL` only in the current PowerShell process
to the same loopback `instalink_test` URL while running E2E, then clear both.
Do not copy the remote development URL from `.env` into either variable.

Expected: Super Admin actions succeed, all other roles receive 403, expired
temporary credentials are blocked, and audit records contain no password
material.

- [x] **Step 6: Run backend lint/build and commit**

Run `npm.cmd run lint`, `npm.cmd test`,
`npm.cmd run test:e2e -- --no-file-parallelism`, and
`npm.cmd run build`.

Expected: all backend checks pass.

```powershell
git add instalink-backend/src/modules/users instalink-backend/src/modules/access-control instalink-backend/src/modules/registrations/registration-serializer.ts instalink-backend/src/modules/audit instalink-backend/src/modules/identity instalink-backend/src/app.module.ts instalink-backend/prisma/seed.ts instalink-backend/test
git commit -m "feat: add super admin user management api"
```

### Task 4: Integrate user management into the existing dashboard

**Files:**
- Create: `instalink-frontend/app/dashboard/users/page.tsx`
- Create: `instalink-frontend/app/dashboard/change-password/page.tsx`
- Modify: `instalink-frontend/components/dashboard/dashboard-shell.tsx`
- Modify: `instalink-frontend/lib/dashboard-api.ts`
- Modify: `instalink-frontend/lib/dashboard-types.ts`
- Modify: `instalink-frontend/app/dashboard/login/page.tsx`
- Modify: `instalink-frontend/app/dashboard/layout.tsx` only if route shell handling requires it

**Interfaces:**
- Consumes Task 2 `/me` password-change flag and Task 3 typed user endpoints.
- Produces `/dashboard/users` and `/dashboard/change-password`.
- Navigation and user actions are shown only to `super_admin`; APIs remain
  authoritative for authorization.
- New-user/reset temporary password is shown once in UI memory, not browser
  storage. Role selection is explicit; no default Super Admin.
- A user with `mustChangePassword` is redirected to the change-password page
  and cannot navigate to other protected dashboard pages.

- [x] **Step 1: Define typed API functions and verify with typecheck**

Add types and API client methods for list/create/role/status/reset/change
password. New API methods use existing credentials, CSRF, error handling, and
same-origin route conventions. Run `npm.cmd run build` in the frontend.
Expected: existing routes compile with the new API types.

- [x] **Step 2: Implement the forced password change page and redirect**

Add current/new password fields, validation errors, success state, and
redirect back to dashboard only after successful change; clear temporary
credential UI state after use.

- [x] **Step 3: Implement the users list and actions**

Build responsive list/search/role/status filters, pagination, create form,
one-time temporary password display, role change, deactivate/reactivate, and
reset-password confirmation with expiry display. Include explicit loading,
empty, error, and forbidden states.

- [x] **Step 4: Run frontend validation and browser smoke**

Run `npm.cmd run lint` and `npm.cmd run build`; smoke-test Super Admin,
Customer Service, and auditor navigation; verify forced-password redirect,
create/reset disclosure, and no Web Storage credential writes.

Expected: lint/build pass; only Super Admin sees user-management navigation,
and backend-denied roles cannot reach user APIs.

- [x] **Step 5: Commit**

```powershell
git add instalink-frontend
git commit -m "feat: add admin user management dashboard"
```

### Task 5: Align documentation and complete the release gate

**Files:**
- Modify: `README.md`
- Modify: `docs/api.md`
- Modify: `docs/database.md`
- Modify: `docs/operations-security.md`
- Modify: `docs/implementation-roadmap.md`

**Interfaces:**
- Documents actual implemented routes and distinguishes planned domain routes.
- Documents runtime environment names and local Postgres setup without secret
  values, seed create-only behavior, 24-hour temporary passwords, first-login
  change, session revocation, role matrix, migration review, and remaining MFA/
  domain dependencies.

- [x] **Step 1: Update implementation and operations documentation**

Record the approved role/permission decisions and local migration process.
Keep secrets out of documentation and `.env.example`.

- [ ] **Step 2: Run complete validation**

```powershell
Set-Location .\instalink-backend
npm.cmd exec -- prisma validate
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build

Set-Location ..\instalink-frontend
npm.cmd run lint
npm.cmd run build

Set-Location ..
git diff --check
```

Expected: all commands pass; E2E uses the isolated local PostgreSQL test
database, never the configured remote DB.

Validation note: backend unit tests passed 60/60, backend lint/build passed,
and Prisma validation plus frontend lint/build passed before the final
identity race fix. `TEST_DATABASE_URL` is unset and no explicit local `_test`
database is configured, so final PostgreSQL E2E remains unrun. The `.env`
`DATABASE_URL` target was not inspected or used. Do not substitute the
Wi-Fi/remote database.

- [x] **Step 3: Ask before applying migrations remotely**

Before any `prisma migrate deploy` against the configured Wi-Fi database,
re-verify its host/database and current migration state without printing
credentials. Present the reviewed migration names/SQL and wait for explicit
approval. If approval is not given, leave the remote database unchanged and
report that local code/tests are ready but the database schema is not applied.
No remote migration was attempted and no remote database was accessed.

- [ ] **Step 4: Final review and commit**

Review found a login/password-change race. A regression test failed before
the fix and passed afterward; login now conditionally updates the active user
against the verified password hash before creating a session. A minor
deferred item remains: add a committed migration regression test for duplicate
`UserRole` assignments failing without changing data. Rerun the runnable
validation gate and commit only files belonging to this plan. Keep this step
open until commits are complete; the isolated-database E2E gate remains open
until a valid local `TEST_DATABASE_URL` is available.

```powershell
git add README.md docs/api.md docs/database.md docs/operations-security.md docs/implementation-roadmap.md docs/superpowers/specs/2026-11-03-instalink-admin-foundation-design.md docs/superpowers/plans/2026-11-03-instalink-admin-foundation.md
git commit -m "docs: document admin foundation setup and access"
```
