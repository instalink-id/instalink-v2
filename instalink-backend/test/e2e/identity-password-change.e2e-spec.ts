import { ValidationPipe } from '@nestjs/common';
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
import { requireIsolatedTestDatabaseUrl } from '../helpers/test-database.js';

const userId = '00000000-0000-4000-8000-000000000101';
const userEmail = 'password-change-e2e@example.test';
const temporaryPassword = 'synthetic-temporary-password-123';
const newPassword = 'synthetic-new-password-123';

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

describe('first-login password change', () => {
  let app: INestApplication<App> | undefined;
  let prisma: PrismaClient | undefined;
  let previousDatabaseUrl: string | undefined;

  async function clearFixture() {
    if (!prisma) return;
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { actorId: userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.userRole.deleteMany({ where: { userId } }),
      prisma.user.deleteMany({ where: { id: userId } }),
    ]);
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
    if (!prisma) throw new Error('Password-change database is not initialized');
    await clearFixture();
    const role = await prisma.role.upsert({
      where: { code: 'customer_service' },
      create: { code: 'customer_service', name: 'Customer Service' },
      update: { name: 'Customer Service' },
    });
    await prisma.user.create({
      data: {
        id: userId,
        email: userEmail,
        passwordHash: await hash(temporaryPassword),
        status: 'ACTIVE',
        mustChangePassword: true,
        passwordChangeExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        roles: { create: { roleId: role.id } },
      },
    });
  });

  afterAll(async () => {
    if (app) await app.close();
    await clearFixture();
    if (prisma) await prisma.$disconnect();
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }, 30_000);

  it('requires password change and keeps only the current session after success', async () => {
    if (!app || !prisma) throw new Error('Password-change app is not initialized');
    const currentSession = request.agent(app.getHttpServer());
    const otherSession = request.agent(app.getHttpServer());
    const login = await currentSession
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: temporaryPassword })
      .expect(201);
    const csrfToken = readCookie(login.headers['set-cookie'], 'instalink_csrf');
    expect(login.body.user.mustChangePassword).toBe(true);

    await otherSession
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: temporaryPassword })
      .expect(201);
    await currentSession.get('/api/v1/me').expect(200).expect((response) => {
      expect(response.body.user.mustChangePassword).toBe(true);
    });
    await currentSession
      .get('/api/v1/registrations')
      .expect(403)
      .expect((response) => {
        expect(response.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
      });

    await currentSession
      .post('/api/v1/auth/password/change')
      .set('x-csrf-token', csrfToken)
      .send({ currentPassword: 'wrong-current-password', newPassword })
      .expect(401);
    await currentSession
      .post('/api/v1/auth/password/change')
      .set('x-csrf-token', csrfToken)
      .send({ currentPassword: temporaryPassword, newPassword: 'short' })
      .expect(400);

    await currentSession
      .post('/api/v1/auth/password/change')
      .set('x-csrf-token', csrfToken)
      .send({ currentPassword: temporaryPassword, newPassword })
      .expect(201)
      .expect({ status: 'ok' });

    await currentSession.get('/api/v1/me').expect(200).expect((response) => {
      expect(response.body.user.mustChangePassword).toBe(false);
    });
    await otherSession.get('/api/v1/me').expect(401);

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    expect(await verify(updatedUser.passwordHash, newPassword)).toBe(true);
    expect(await verify(updatedUser.passwordHash, temporaryPassword)).toBe(false);
    expect(updatedUser.passwordChangeExpiresAt).toBeNull();

    const passwordAudit = await prisma.auditLog.findFirst({
      where: { actorId: userId, action: 'USER_PASSWORD_CHANGED' },
    });
    expect(passwordAudit?.afterRedacted).toEqual({ passwordChanged: true });
    expect(JSON.stringify(passwordAudit)).not.toContain(newPassword);
  });

  it('rejects expired temporary credentials with a generic login response', async () => {
    if (!app || !prisma) throw new Error('Password-change app is not initialized');
    await prisma.user.update({
      where: { id: userId },
      data: { passwordChangeExpiresAt: new Date(Date.now() - 1_000) },
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: temporaryPassword })
      .expect(401);

    expect(response.body.message).toBe('Email atau password tidak valid');
    expect(JSON.stringify(response.body)).not.toContain('expired');
    expect(await prisma.session.count({ where: { userId } })).toBe(0);
  });

  it('blocks an expired forced-change session but still permits logout', async () => {
    if (!app || !prisma) throw new Error('Password-change app is not initialized');
    const session = request.agent(app.getHttpServer());
    const login = await session
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: temporaryPassword })
      .expect(201);
    const csrfToken = readCookie(login.headers['set-cookie'], 'instalink_csrf');

    await prisma.user.update({
      where: { id: userId },
      data: { passwordChangeExpiresAt: new Date(Date.now() - 1_000) },
    });

    await session.get('/api/v1/me').expect(403).expect((response) => {
      expect(response.body.code).toBe('TEMPORARY_PASSWORD_EXPIRED');
    });
    await session
      .post('/api/v1/auth/password/change')
      .set('x-csrf-token', csrfToken)
      .send({ currentPassword: temporaryPassword, newPassword })
      .expect(403);
    await session
      .post('/api/v1/auth/logout')
      .set('x-csrf-token', csrfToken)
      .expect(201);
    await session.get('/api/v1/me').expect(401);
  });
});
