import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { requireIsolatedTestDatabaseUrl } from '../helpers/test-database.js';

type AdminMigrationState = {
  userColumns: number;
  auditActions: number;
  userIdUniqueIndex: boolean;
};

describe('admin foundation migration', () => {
  let prisma: PrismaClient | undefined;

  beforeAll(async () => {
    const databaseUrl = requireIsolatedTestDatabaseUrl(process.env);
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
  });

  it('adds password lifecycle fields, audit actions, and one-role enforcement', async () => {
    if (!prisma) throw new Error('Migration test database is not initialized');

    const [state] = await prisma.$queryRaw<AdminMigrationState[]>`
      SELECT
        (
          SELECT COUNT(*)::int
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'User'
            AND column_name IN ('mustChangePassword', 'passwordChangeExpiresAt')
        ) AS "userColumns",
        (
          SELECT COUNT(*)::int
          FROM pg_enum enum_value
          JOIN pg_type enum_type ON enum_type.oid = enum_value.enumtypid
          WHERE enum_type.typname = 'AuditAction'
            AND enum_value.enumlabel IN (
              'USER_CREATED',
              'USER_ROLE_CHANGED',
              'USER_STATUS_CHANGED',
              'USER_PASSWORD_RESET',
              'USER_PASSWORD_CHANGED'
            )
        ) AS "auditActions",
        EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'UserRole'
            AND indexname = 'UserRole_userId_key'
        ) AS "userIdUniqueIndex"
    `;

    expect(state).toEqual({
      userColumns: 2,
      auditActions: 5,
      userIdUniqueIndex: true,
    });
  });
});
