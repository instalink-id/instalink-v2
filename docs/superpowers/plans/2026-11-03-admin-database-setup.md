# Admin Database Setup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the selected Wi-Fi development PostgreSQL database and recover dashboard access through an audited Super Admin workflow.

**Architecture:** Use the existing Prisma migrations and seed; do not write ad-hoc SQL or change application source. Keep credentials local to the operator's PowerShell session, and gate all database writes on a final target/status review and explicit migration approval.

**Tech Stack:** PostgreSQL, Prisma 6, Node.js, PowerShell on Windows.

**Spec:** [docs/superpowers/specs/2026-11-03-admin-database-setup-design.md](../specs/2026-11-03-admin-database-setup-design.md)

## Global Constraints

- Target only the selected development database `instalink_db` at `192.168.0.103:5432`.
- Never print or store the database URL, password, seed password, token, or other secret in chat, source, or logs.
- Never connect to production, reset the database, or delete existing data.
- Apply only `prisma migrate deploy` after explicit approval of the reviewed target and SQL.
- Seed creates an account only if its email is absent; it does not change existing account credentials, status, or role.
- Do not continue if database identity differs, migration status is unexpected, or schema conflicts are found.

## Review Focus

- Wrong database target: compare only host, port, and database name to the approved values; do not display URL credentials.
- Existing/untracked schema or migration drift: stop and inspect before writing; never use `migrate reset`.
- Duplicate user-role assignments: second migration must abort before changing assignments.
- Existing seed email: seed is create-only for the account; do not tell the user its password was reset.
- Credential exposure: keep seed credentials out of command history, terminal output, and chat; clear environment values immediately after seeding.

---

### Task 1: Verify target and obtain migration approval

**Files:** None; this task performs read-only checks.

**Interfaces:**
- Consumes: approved target `192.168.0.103:5432/instalink_db`.
- Produces: confirmed pending migration list and the explicit approval needed for the write task.

- [x] **Step 1: Verify the configured target without exposing credentials**

Read only the PostgreSQL host, port, and database name from the backend configuration. Do not output or log the full `DATABASE_URL`.

Expected: host is `192.168.0.103`, port is `5432`, and database is `instalink_db`; otherwise stop.

- [x] **Step 2: Check current Prisma migration status**

Run from `instalink-backend`:

```powershell
npm.cmd exec -- prisma migrate status
```

Expected: only `20261102214000_customer_service_foundation` and `20261103140000_admin_foundation` are pending. Stop if applied/failed migrations or schema conflicts change the expected plan.

- [x] **Step 3: Review the exact migration SQL**

Review:

- `instalink-backend/prisma/migrations/20261102214000_customer_service_foundation/migration.sql`
- `instalink-backend/prisma/migrations/20261103140000_admin_foundation/migration.sql`

Expected impact: create the platform foundation tables, add temporary-password columns and audit enum values, then add a unique one-role-per-user index after a duplicate preflight. Do not apply until the user explicitly approves this exact database write.

### Task 2: Apply migrations and prepare the seed account

**Files:** No application source changes.

**Interfaces:**
- Consumes: approved target and pending migration list from Task 1.
- Produces: migrated development database and a Super Admin account created by the existing Prisma seed.

- [x] **Step 1: Apply the reviewed migrations after explicit approval**

Run from `instalink-backend`:

```powershell
npm.cmd exec -- prisma migrate deploy
```

Expected: both named migrations apply successfully. If either fails, stop; do not reset or manually alter data.

- [x] **Step 2: Verify migration state and schema**

Run:

```powershell
npm.cmd exec -- prisma migrate status
npm.cmd exec -- prisma validate
```

Expected: database is up to date and Prisma schema validation passes.

- [x] **Step 3: Seed the Super Admin using credentials entered locally**

Use the existing seed with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` set only in the user's local PowerShell environment, then clear both variables. Do not send the password in chat or echo it in the terminal. If the seed email already exists, stop; the seed intentionally will not reset that account.

Expected: role catalog is present and the requested Super Admin account is created if absent.

Execution status: migrations have been applied and verified. The user ran the seed locally with hidden password input. Read-only verification confirms seven roles, one user, and one active Super Admin.

- [x] **Step 4: Verify the initial account and diagnose login**

Confirm the seed command succeeded and the account has the `super_admin` role using a non-secret check. Then try dashboard login with the locally selected email and password. If login fails, do not repeat attempts; verify account status and password match locally without displaying credentials, then continue to Task 3.

Observed: account is active and has an Argon2id hash; four failed attempts were associated with a recognized user. Local hash verification returned a password mismatch. No credential was displayed or persisted by the assistant.

### Task 3: Recover access through a temporary bootstrap account

**Files:** No application source changes.

**Interfaces:**
- Consumes: the active original Super Admin account, the existing Prisma seed, and `/dashboard/users`.
- Produces: a password reset for the original account using the existing dashboard workflow, followed by deactivation of the temporary bootstrap account.

- [x] **Step 1: Create a second bootstrap account with a different email**

Do not rerun the seed with the original email: its upsert deliberately does not change existing credentials. In the user's PowerShell, enter a different email and enter the new password twice through hidden prompts; abort if the two entries differ. Run `npm.cmd exec -- prisma db seed` and clear all temporary environment values.

Expected: exactly one additional active Super Admin is created; the original account remains unchanged.

- [x] **Step 2: Verify the bootstrap password locally and log in**

Check `argon2.verify` locally without printing the email, hash, or password. If it returns false, stop and do not keep trying login. If it returns true, log in at `http://localhost:3000/dashboard/login` using the bootstrap account.

Expected: the bootstrap account reaches the dashboard without disclosing credentials to chat or logs.

- [x] **Step 3: Reset the original account through dashboard user management**

From `/dashboard/users`, reset the original account's password. Use the one-time temporary password displayed by the dashboard, then change it through the forced-password-change flow.

Expected: the original account can sign in with its new password; the reset is recorded by the existing audit flow.

Verification: the user confirmed the original account login is restored. Read-only audit aggregates now show one `USER_PASSWORD_RESET` and two `USER_PASSWORD_CHANGED` events; no account identifiers or credentials were read.

- [ ] **Step 4: Deactivate the bootstrap account after verifying recovery**

Sign in with the original account, then deactivate the temporary bootstrap account through dashboard user management.

Expected: the original Super Admin remains active and the temporary account is disabled; no direct SQL credential update is used.

Execution status: the user has not yet deactivated the bootstrap account. The latest read-only check shows two active Super Admin accounts; this step remains open.
