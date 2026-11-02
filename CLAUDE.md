## Project status

This repository is currently in the architecture and documentation phase. Do not
scaffold the applications, install dependencies, deploy services, or connect to
production systems until the architecture in `docs/` is approved.

## Product context

The product is an ISP FTTH management system for an initial target of 500-2,000
customers. The initial access network uses PPPoE directly on MikroTik. RADIUS,
OLT/ONU automation, production servers, domains, and payment credentials are not
yet available.

## Repository boundaries

- `instalink-frontend/`: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui.
- `instalink-backend/`: NestJS REST API, Swagger/OpenAPI, Prisma.
- `instalink-infrastructure/`: Docker Compose, Nginx, certificates, backup and
  operational configuration.
- `docs/`: decisions, architecture, data model, security, operations, and
  implementation plans.

The current `instalink-*` directory names are the approved product naming and
must be retained.

## Engineering rules

1. Use TypeScript with strict type checking and modular separation of concerns.
2. Keep frontend, backend, and infrastructure independently testable and
   deployable.
3. Use migrations for all schema changes; never edit production data manually.
4. Validate and authorize every backend input and action.
5. Never commit secrets, real customer data, payment credentials, or router
   credentials. Use documented environment variables and secret storage.
6. Treat Midtrans webhooks as untrusted input: verify the signature, enforce
   idempotency, and re-check payment status server-side before closing an
   invoice.
7. Do not implement automatic customer disconnection until business rules,
   grace periods, payment reconciliation, and recovery procedures are approved.
8. Keep MikroTik and future OLT integrations behind backend adapters. Do not
   expose RouterOS, database, or management interfaces to the public internet.
9. Record important administrative, financial, access-control, and integration
   actions in an append-only audit log.
10. Use Indonesian-facing product terminology consistently, while keeping
    internal identifiers and API resource names in English.

## Required validation before implementation

Read `docs/architecture.md`, `docs/database.md`, `docs/api.md`, and
`docs/operations-security.md` before changing application structure. Confirm
that the unresolved questions in `docs/implementation-roadmap.md` have owners
and decisions.