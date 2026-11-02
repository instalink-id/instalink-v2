# Instalink Infrastructure

This directory contains local and future staging/production infrastructure
configuration. The current Compose file starts only a local PostgreSQL
container and binds it to loopback. It does not deploy the application or
expose a production database.

## Local database

From the repository root, after Docker is installed:

```powershell
docker compose -f .\instalink-infrastructure\compose\compose.dev.yml up -d
```

Use the matching local-only `DATABASE_URL` from
`instalink-backend\.env.example`. The password in Compose is a development
placeholder and must never be reused in staging or production.
