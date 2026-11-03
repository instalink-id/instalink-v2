import { ConflictException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { hash, verify } from 'argon2';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.config.js';
import { UsersService } from '../../src/modules/users/users.service.js';
import { seedRolesAndAdmin } from '../../prisma/seed.js';
import { requireIsolatedTestDatabaseUrl } from '../helpers/test-database.js';

const userPrefix = 'admin-user-e2e-';
const fixturePassword = 'synthetic-admin-password-123';
const fixtureUsers = [
  {
    key: 'adminA',
    id: '00000000-0000-4000-8000-000000000201',
    roleCode: 'super_admin',
  },
  {
    key: 'adminB',
    id: '00000000-0000-4000-8000-000000000202',
    roleCode: 'super_admin',
  },
  {
    key: 'manager',
    id: '00000000-0000-4000-8000-000000000203',
    roleCode: 'general_manager',
  },
  {
    key: 'finance',
    id: '00000000-0000-4000-8000-000000000204',
    roleCode: 'finance',
  },
  {
    key: 'customerService',
    id: '00000000-0000-4000-8000-000000000205',
    roleCode: 'customer_service',
  },
  {
    key: 'networkEngineer',
    id: '00000000-0000-4000-8000-000000000206',
    roleCode: 'noc_network_engineer',
  },
  {
    key: 'fieldTechnician',
    id: '00000000-0000-4000-8000-000000000207',
    roleCode: 'field_technician',
  },
  {
    key: 'auditor',
    id: '00000000-0000-4000-8000-000000000208',
    roleCode: 'auditor_viewer',
  },
] as const;

const roleNames: Record<string, string> = {
  general_manager: 'General Manager',
  super_admin: 'Super Admin',
  finance: 'Keuangan',
  customer_service: 'Customer Service',
  noc_network_engineer: 'NOC / Network Engineer',
  field_technician: 'Teknisi Lapangan',
  auditor_viewer: 'Auditor / Viewer',
};

function fixtureEmail(key: string) {
  return `${userPrefix}${key}@example.test`.toLowerCase();
}

function readCookie(
  header: string[] | string | undefined,
  name: string,
): string {
  const cookies = Array.isArray(header) ? header : header ? [header] : [];
  const cookie = cookies
    .map((value) => value.split(';', 1)[0])
    .find((value) => value.startsWith(`${name}=`));

  if (!cookie) throw new Error(`Expected ${name} cookie`);
  return decodeURIComponent(cookie.slice(name.length + 1));
}

describe('Super Admin user management', () => {
  let app: INestApplication<App> | undefined;
  let prisma: PrismaClient | undefined;
  let previousDatabaseUrl: string | undefined;

  async function clearFixtures() {
    if (!prisma) return;
    const fixtures = await prisma.user.findMany({
      where: { email: { startsWith: userPrefix } },
      select: { id: true },
    });
    const ids = [
      ...new Set([
        ...fixtureUsers.map(({ id }) => id),
        ...fixtures.map(({ id }) => id),
      ]),
    ];
    await prisma.$transaction([
      prisma.auditLog.deleteMany({
        where: {
          OR: [{ actorId: { in: ids } }, { resourceId: { in: ids } }],
        },
      }),
      prisma.session.deleteMany({ where: { userId: { in: ids } } }),
      prisma.userRole.deleteMany({ where: { userId: { in: ids } } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);
  }

  async function login(key: string) {
    if (!app) throw new Error('E2E application is not initialized');
    const agent = request.agent(app.getHttpServer());
    const response = await agent
      .post('/api/v1/auth/login')
      .send({
        email: fixtureEmail(key),
        password: fixturePassword,
      });
    expect(response.status, `${key}: ${JSON.stringify(response.body)}`).toBe(201);
    return {
      agent,
      csrfToken: readCookie(response.headers['set-cookie'], 'instalink_csrf'),
    };
  }

  beforeAll(async () => {
    const databaseUrl = requireIsolatedTestDatabaseUrl(process.env);
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = databaseUrl;
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    configureApp(app);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 30_000);

  beforeEach(async () => {
    if (!prisma) throw new Error('User-management database is not initialized');
    await clearFixtures();
    const roles = await Promise.all(
      Object.entries(roleNames).map(([code, name]) =>
        prisma!.role.upsert({
          where: { code },
          create: { code, name },
          update: { name },
        }),
      ),
    );
    const roleIds = new Map(roles.map((role) => [role.code, role.id]));
    const passwordHash = await hash(fixturePassword);
    for (const fixture of fixtureUsers) {
      await prisma.user.create({
        data: {
          id: fixture.id,
          email: fixtureEmail(fixture.key),
          passwordHash,
          status: 'ACTIVE',
          roles: {
            create: { roleId: roleIds.get(fixture.roleCode)! },
          },
        },
      });
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    await clearFixtures();
    if (prisma) await prisma.$disconnect();
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }, 30_000);

  it('restricts user routes to Super Admin and validates filters and CSRF', async () => {
    if (!app || !prisma) throw new Error('E2E application is not initialized');
    await request(app.getHttpServer()).get('/api/v1/users').expect(401);

    for (const fixture of fixtureUsers.filter(
      ({ roleCode }) => roleCode !== 'super_admin',
    )) {
      const { agent } = await login(fixture.key);
      await agent.get('/api/v1/users').expect(403);
      if (fixture.roleCode === 'general_manager') {
        await agent.get('/api/v1/registrations').expect(200);
        await agent.get('/api/v1/audit-logs').expect(200);
      } else if (fixture.roleCode === 'auditor_viewer') {
        await agent.get('/api/v1/audit-logs').expect(200);
      } else if (fixture.roleCode !== 'customer_service') {
        await agent.get('/api/v1/registrations').expect(403);
      }
    }

    const { agent } = await login('adminA');
    await agent
      .get('/api/v1/users?page=invalid')
      .expect(400);
    await agent
      .get('/api/v1/users?role=unknown_role')
      .expect(400);
    await agent
      .post('/api/v1/users')
      .send({
        email: 'admin-user-e2e-no-csrf@example.test',
        roleCode: 'customer_service',
      })
      .expect(403);
    await agent
      .patch(`/api/v1/users/${fixtureUsers[3].id}/role`)
      .send({ roleCode: 'auditor_viewer' })
      .expect(403);
    await agent
      .patch(`/api/v1/users/${fixtureUsers[3].id}/status`)
      .send({ status: 'DISABLED' })
      .expect(403);
    await agent
      .post(`/api/v1/users/${fixtureUsers[3].id}/reset-password`)
      .expect(403);
    const allUsers = await agent.get('/api/v1/users').expect(200);
    expect(allUsers.body.items).toHaveLength(fixtureUsers.length);
    expect(JSON.stringify(allUsers.body)).not.toContain('passwordHash');

    const firstPage = await agent
      .get('/api/v1/users?page=1&pageSize=1')
      .expect(200);
    const secondPage = await agent
      .get('/api/v1/users?page=2&pageSize=1')
      .expect(200);
    expect(firstPage.body.total).toBe(fixtureUsers.length);
    expect(firstPage.body.items[0].id).not.toBe(secondPage.body.items[0].id);
  });

  it('creates explicitly assigned users and redacts credentials from list and audit', async () => {
    if (!app || !prisma) throw new Error('E2E application is not initialized');
    const { agent, csrfToken } = await login('adminA');
    const email = `${userPrefix}created@example.test`;

    const created = await agent
      .post('/api/v1/users')
      .set('x-csrf-token', csrfToken)
      .send({ email, roleCode: 'customer_service' })
      .expect(201);

    expect(created.body.email).toBe(email);
    expect(created.body.role).toEqual({
      code: 'customer_service',
      name: roleNames.customer_service,
    });
    expect(created.body.status).toBe('ACTIVE');
    expect(created.body.mustChangePassword).toBe(true);
    expect(created.body.passwordHash).toBeUndefined();
    expect(typeof created.body.temporaryPassword).toBe('string');
    const expiry = new Date(created.body.passwordChangeExpiresAt).getTime();
    expect(expiry - Date.now()).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(expiry - Date.now()).toBeLessThanOrEqual(24 * 60 * 60 * 1000);

    const createdRecord = await prisma.user.findUniqueOrThrow({
      where: { id: created.body.id },
      include: { roles: { include: { role: true } } },
    });
    expect(createdRecord.roles.map(({ role }) => role.code)).toEqual([
      'customer_service',
    ]);
    expect(await verify(createdRecord.passwordHash, created.body.temporaryPassword)).toBe(
      true,
    );
    expect(createdRecord.passwordHash).not.toContain(created.body.temporaryPassword);

    await agent
      .post('/api/v1/users')
      .set('x-csrf-token', csrfToken)
      .send({ email, roleCode: 'customer_service' })
      .expect(409);

    const list = await agent
      .get(
        `/api/v1/users?page=1&pageSize=1&role=customer_service&status=ACTIVE&search=${encodeURIComponent(email.toUpperCase())}`,
      )
      .expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].email).toBe(email);
    expect(list.body.items[0].passwordHash).toBeUndefined();
    expect(list.body.items[0].temporaryPassword).toBeUndefined();
    expect(JSON.stringify(list.body)).not.toContain(created.body.temporaryPassword);

    const createAudit = await prisma.auditLog.findFirstOrThrow({
      where: { actorId: fixtureUsers[0].id, resourceId: created.body.id },
    });
    expect(createAudit.action).toBe('USER_CREATED');
    expect(createAudit.afterRedacted).toMatchObject({ email: '[REDACTED]' });
    expect(JSON.stringify(createAudit)).not.toContain(email);
    expect(JSON.stringify(createAudit)).not.toContain(created.body.temporaryPassword);
  });

  it('runs create, first login, role/status updates, and password reset with session revocation', async () => {
    if (!app || !prisma) throw new Error('E2E application is not initialized');
    const admin = await login('adminA');
    const email = `${userPrefix}lifecycle@example.test`;
    const created = await admin.agent
      .post('/api/v1/users')
      .set('x-csrf-token', admin.csrfToken)
      .send({ email, roleCode: 'customer_service' })
      .expect(201);
    const user = request.agent(app.getHttpServer());
    const firstLogin = await user
      .post('/api/v1/auth/login')
      .send({ email, password: created.body.temporaryPassword })
      .expect(201);
    const userCsrf = readCookie(firstLogin.headers['set-cookie'], 'instalink_csrf');
    expect(firstLogin.body.user.mustChangePassword).toBe(true);
    await user.get('/api/v1/registrations').expect(403).expect((response) => {
      expect(response.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
    });
    await user
      .post('/api/v1/auth/password/change')
      .set('x-csrf-token', userCsrf)
      .send({
        currentPassword: created.body.temporaryPassword,
        newPassword: 'new-synthetic-user-password-456',
      })
      .expect(201);
    await user.get('/api/v1/me').expect(200);

    await admin.agent
      .patch(`/api/v1/users/${created.body.id}/role`)
      .set('x-csrf-token', admin.csrfToken)
      .send({ roleCode: 'auditor_viewer' })
      .expect(200);
    await user.get('/api/v1/me').expect(401);

    const auditor = request.agent(app.getHttpServer());
    await auditor
      .post('/api/v1/auth/login')
      .send({ email, password: 'new-synthetic-user-password-456' })
      .expect(201);
    await admin.agent
      .patch(`/api/v1/users/${created.body.id}/status`)
      .set('x-csrf-token', admin.csrfToken)
      .send({ status: 'DISABLED' })
      .expect(200);
    await auditor.get('/api/v1/me').expect(401);

    await admin.agent
      .patch(`/api/v1/users/${created.body.id}/status`)
      .set('x-csrf-token', admin.csrfToken)
      .send({ status: 'ACTIVE' })
      .expect(200);
    const activeSession = request.agent(app.getHttpServer());
    await activeSession
      .post('/api/v1/auth/login')
      .send({ email, password: 'new-synthetic-user-password-456' })
      .expect(201);

    const reset = await admin.agent
      .post(`/api/v1/users/${created.body.id}/reset-password`)
      .set('x-csrf-token', admin.csrfToken)
      .expect(201);
    expect(typeof reset.body.temporaryPassword).toBe('string');
    expect(reset.body.temporaryPassword).not.toBe('new-synthetic-user-password-456');
    await activeSession.get('/api/v1/me').expect(401);
    const resetUser = await prisma.user.findUniqueOrThrow({
      where: { id: created.body.id },
    });
    expect(resetUser.mustChangePassword).toBe(true);
    expect(resetUser.passwordChangeExpiresAt).not.toBeNull();
    expect(
      new Date(resetUser.passwordChangeExpiresAt!).getTime() - Date.now(),
    ).toBeGreaterThan(23 * 60 * 60 * 1000);

    const resetLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: reset.body.temporaryPassword })
      .expect(201);
    expect(resetLogin.body.user.mustChangePassword).toBe(true);

    const passwordAudit = await prisma.auditLog.findFirstOrThrow({
      where: { action: 'USER_PASSWORD_RESET', resourceId: created.body.id },
    });
    expect(JSON.stringify(passwordAudit)).not.toContain(
      reset.body.temporaryPassword,
    );
    expect(JSON.stringify(passwordAudit)).not.toContain(
      'new-synthetic-user-password-456',
    );
  });

  it('prevents self changes and concurrent removal of the last active Super Admin', async () => {
    if (!app || !prisma) throw new Error('E2E application is not initialized');
    const adminA = await login('adminA');
    await adminA.agent
      .patch(`/api/v1/users/${fixtureUsers[0].id}/role`)
      .set('x-csrf-token', adminA.csrfToken)
      .send({ roleCode: 'auditor_viewer' })
      .expect(409);
    await adminA.agent
      .patch(`/api/v1/users/${fixtureUsers[0].id}/status`)
      .set('x-csrf-token', adminA.csrfToken)
      .send({ status: 'DISABLED' })
      .expect(409);

    const users = app.get(UsersService);
    const results = await Promise.allSettled([
      users.changeRole(
        fixtureUsers[1].id,
        { roleCode: 'auditor_viewer' },
        fixtureUsers[0].id,
      ),
      users.changeStatus(
        fixtureUsers[0].id,
        { status: 'DISABLED' },
        fixtureUsers[1].id,
      ),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(
      1,
    );
    const rejected = results.find(
      (result) => result.status === 'rejected',
    );
    expect(rejected?.status).toBe('rejected');
    if (rejected?.status !== 'rejected') {
      throw new Error('A concurrent Super Admin change should be rejected');
    }
    expect(rejected.reason).toBeInstanceOf(ConflictException);

    const activeSuperAdmins = await prisma.user.count({
      where: {
        status: 'ACTIVE',
        roles: { some: { role: { code: 'super_admin' } } },
      },
    });
    expect(activeSuperAdmins).toBeGreaterThanOrEqual(1);
  });

  it('preserves existing seed account state and only creates a missing seed admin', async () => {
    if (!prisma) throw new Error('User-management database is not initialized');
    const existing = fixtureUsers.find(
      ({ roleCode }) => roleCode === 'customer_service',
    );
    if (!existing) throw new Error('Customer Service seed fixture is missing');
    await prisma.user.update({
      where: { id: existing.id },
      data: { status: 'DISABLED' },
    });
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: existing.id },
      include: { roles: { include: { role: true } } },
    });

    await seedRolesAndAdmin(prisma, {
      SEED_ADMIN_EMAIL: ` ${fixtureEmail(existing.key).toUpperCase()} `,
      SEED_ADMIN_PASSWORD: 'replacement-must-not-be-used',
    });

    const after = await prisma.user.findUniqueOrThrow({
      where: { id: existing.id },
      include: { roles: { include: { role: true } } },
    });
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(after.status).toBe('DISABLED');
    expect(after.roles.map(({ role }) => role.code)).toEqual([
      'customer_service',
    ]);

    const newSeedEmail = `${userPrefix}seed-new@example.test`;
    await seedRolesAndAdmin(prisma, {
      SEED_ADMIN_EMAIL: newSeedEmail,
      SEED_ADMIN_PASSWORD: 'synthetic-new-seed-password',
    });
    const created = await prisma.user.findUniqueOrThrow({
      where: { email: newSeedEmail },
      include: { roles: { include: { role: true } } },
    });
    expect(created.status).toBe('ACTIVE');
    expect(created.roles.map(({ role }) => role.code)).toEqual(['super_admin']);
    expect(await verify(created.passwordHash, 'synthetic-new-seed-password')).toBe(
      true,
    );

    await prisma.user.update({
      where: { id: created.id },
      data: { status: 'DISABLED' },
    });
    await seedRolesAndAdmin(prisma, {
      SEED_ADMIN_EMAIL: newSeedEmail,
      SEED_ADMIN_PASSWORD: 'another-password-that-must-not-replace-it',
    });
    const rerun = await prisma.user.findUniqueOrThrow({
      where: { id: created.id },
      include: { roles: { include: { role: true } } },
    });
    expect(rerun.passwordHash).toBe(created.passwordHash);
    expect(rerun.status).toBe('DISABLED');
    expect(rerun.roles.map(({ role }) => role.code)).toEqual(['super_admin']);
  });
});
