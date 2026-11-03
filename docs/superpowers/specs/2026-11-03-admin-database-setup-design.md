# Admin Database Setup Design

## Intent

Prepare the selected development PostgreSQL database so the existing InstaLink
dashboard can authenticate a Super Admin account.

## Current state

- The selected target is the private-network development database
  `instalink_db` at `192.168.0.103:5432`.
- A read-only Prisma migration status check found both migrations pending:
  `20261102214000_customer_service_foundation` and
  `20261103140000_admin_foundation`.
- No migrations or seed operations have been run as part of this request.
- The backend seed upserts the seven role records and creates the requested
  Super Admin only when its email does not already exist. It does not change
  an existing account's password, status, or role.

## Approaches

1. **Use the selected Wi-Fi development database (chosen):** review and apply
   the two existing Prisma migrations, then seed a Super Admin using
   credentials supplied locally through environment variables. This makes the
   laptop backend and dashboard use the shared development database.
2. **Use a separate PostgreSQL database on the laptop:** isolates the test
   but does not prepare the database the user selected for dashboard login.

The selected approach uses the existing migrations, not hand-written SQL.
Migration one creates the platform foundation tables (`BillingRule`, `User`,
`Role`, `UserRole`, `Session`, `Registration`, `RegistrationFollowUp`, and
`AuditLog`). Migration two adds temporary-password fields and audit actions,
and enforces one role per user after a duplicate-assignment preflight. Both
migrations are additive; the preflight aborts rather than modifying duplicate
role assignments.

## Goals and non-goals

- Apply only the reviewed migrations to the selected development database.
- Create or reuse a Super Admin seed account without printing or storing its
  password in source, documentation, or logs.
- Verify migration state and login readiness afterward.
- Do not deploy, alter production, delete existing data, reset the database,
  or use `migrate reset`.
- Do not overwrite credentials or role/status for an existing seed email.

## Safety and execution

Before any write, confirm the database target and pending migration list, show
the migration impact, and receive explicit approval to apply it. Run the seed
only after migration succeeds. Credentials must be entered locally, not sent
in chat. If the seed email already exists, stop rather than implying its
password was reset; use the existing password or the authorized password-reset
flow.

## Bootstrap recovery after a seed-password mismatch

The initial Super Admin account is active and its seed password did not match
the password entered at dashboard login. The seed intentionally uses
`update: {}` for an existing user, so rerunning it with the same email cannot
reset that password.

The approved recovery approach is to create one additional, temporary
Super Admin using the existing seed and a different email. The user enters
that account's credentials locally and verifies the password match without
displaying the password. After login, use the existing dashboard user
management API to reset the original account's password. Verify login using
the original account, then disable the temporary bootstrap account.

Do not directly update password hashes, modify accounts with ad-hoc SQL, or
send either password in chat. The temporary presence of two active Super Admin
accounts is a deliberate, time-limited recovery tradeoff.

## Acceptance criteria

- Both migrations report applied on the selected development database.
- A Super Admin account with a locally supplied email can authenticate through
  the dashboard.
- If the initial seed password mismatches, the original account is reset only
  through the dashboard after bootstrap login, and the bootstrap account is
  disabled after the original login is verified.
- No production database, existing user credential, or unrelated data is
  changed.
