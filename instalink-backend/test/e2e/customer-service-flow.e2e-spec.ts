import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.config.js';
import { requireIsolatedTestDatabaseUrl } from '../helpers/test-database.js';

const staffPassword = 'synthetic-e2e-password';
const staffEmail = 'customer-service-e2e@example.test';
const auditorEmail = 'auditor-e2e@example.test';
const sensitiveValues = [
  'E2E Synthetic Customer',
  '+628123450000',
  'customer-e2e@example.test',
  'Synthetic E2E installation address',
  'Synthetic E2E approval reason',
  'Synthetic E2E follow-up note',
];
const sensitiveAuditValues = [...sensitiveValues, staffEmail, auditorEmail];

function readCookie(
  header: string[] | string | undefined,
  name: string,
): string {
  const cookies = Array.isArray(header) ? header : header ? [header] : [];
  const cookie = cookies
    .map((value) => value.split(';', 1)[0])
    .find((value) => value.startsWith(`${name}=`));

  if (!cookie) {
    throw new Error(`Expected ${name} cookie`);
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}

describe('customer service registration flow', () => {
  let app: INestApplication<App> | undefined;
  let prisma: PrismaClient | undefined;
  let customerServiceId: string;
  let previousDatabaseUrl: string | undefined;

  beforeAll(async () => {
    const databaseUrl = requireIsolatedTestDatabaseUrl(process.env);
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = databaseUrl;
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();

    await prisma.$transaction([
      prisma.auditLog.deleteMany(),
      prisma.registrationFollowUp.deleteMany(),
      prisma.registration.deleteMany(),
      prisma.session.deleteMany(),
      prisma.userRole.deleteMany(),
      prisma.user.deleteMany(),
      prisma.role.deleteMany(),
    ]);

    const [customerServiceRole, auditorRole] = await Promise.all([
      prisma.role.create({
        data: { code: 'customer_service', name: 'Customer Service' },
      }),
      prisma.role.create({
        data: { code: 'auditor_viewer', name: 'Auditor Viewer' },
      }),
    ]);
    const passwordHash = await hash(staffPassword);
    const [customerService, auditor] = await Promise.all([
      prisma.user.create({
        data: {
          email: staffEmail,
          passwordHash,
          status: 'ACTIVE',
        },
      }),
      prisma.user.create({
        data: {
          email: auditorEmail,
          passwordHash,
          status: 'ACTIVE',
        },
      }),
    ]);
    customerServiceId = customerService.id;
    await prisma.userRole.createMany({
      data: [
        { userId: customerService.id, roleId: customerServiceRole.id },
        { userId: auditor.id, roleId: auditorRole.id },
      ],
    });

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

  afterAll(async () => {
    if (app) await app.close();
    if (prisma) {
      await prisma.$transaction([
        prisma.auditLog.deleteMany(),
        prisma.registrationFollowUp.deleteMany(),
        prisma.registration.deleteMany(),
        prisma.session.deleteMany(),
        prisma.userRole.deleteMany(),
        prisma.user.deleteMany(),
        prisma.role.deleteMany(),
      ]);
      await prisma.$disconnect();
    }

    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }, 30_000);

  it('secures and audits the registration lifecycle across staff roles', async () => {
    if (!app || !prisma) throw new Error('E2E application is not initialized');

    const registration = await request(app.getHttpServer())
      .post('/api/v1/public/registrations')
      .set('Idempotency-Key', 'customer-service-e2e-registration')
      .send({
        fullName: sensitiveValues[0],
        whatsapp: sensitiveValues[1],
        email: sensitiveValues[2],
        installationAddress: sensitiveValues[3],
        area: 'Sumedang',
        source: 'customer-service-e2e',
        communicationConsent: true,
      })
      .expect(201);

    expect(registration.headers['x-request-id']).toMatch(
      /^[0-9a-f-]{36}$/i,
    );
    expect(registration.body).toMatchObject({ status: 'BARU' });
    expect(registration.body).not.toHaveProperty('data');
    const registrationId = registration.body.id as string;
    const duplicateRegistration = await request(app.getHttpServer())
      .post('/api/v1/public/registrations')
      .set('Idempotency-Key', 'customer-service-e2e-registration')
      .send({
        fullName: sensitiveValues[0],
        whatsapp: sensitiveValues[1],
        email: sensitiveValues[2],
        installationAddress: sensitiveValues[3],
        area: 'Sumedang',
        source: 'customer-service-e2e',
        communicationConsent: true,
      })
      .expect(201);
    expect(duplicateRegistration.body.id).toBe(registrationId);
    expect(await prisma.registration.count()).toBe(1);
    expect(
      await prisma.auditLog.count({ where: { action: 'REGISTRATION_CREATED' } }),
    ).toBe(1);

    const invalidLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: staffEmail, password: 'invalid-synthetic-password' })
      .expect(401);
    expect(invalidLogin.body).toMatchObject({
      code: 'UNAUTHORIZED',
      requestId: invalidLogin.headers['x-request-id'],
    });

    const customerService = request.agent(app.getHttpServer());
    const customerServiceLogin = await customerService
      .post('/api/v1/auth/login')
      .set('x-request-id', 'r'.repeat(129))
      .send({ email: staffEmail, password: staffPassword })
      .expect(201);
    expect(customerServiceLogin.headers['x-request-id']).toMatch(
      /^[0-9a-f-]{36}$/i,
    );
    const customerServiceCsrf = readCookie(
      customerServiceLogin.headers['set-cookie'],
      'instalink_csrf',
    );
    const customerServiceCookies = customerServiceLogin.headers[
      'set-cookie'
    ] as string[];

    expect(customerServiceLogin.body.user).toMatchObject({
      id: customerServiceId,
      email: staffEmail,
      roles: ['customer_service'],
    });
    const loginAudit = await prisma.auditLog.findFirst({
      where: {
        action: 'LOGIN_SUCCEEDED',
        actorId: customerServiceId,
      },
    });
    expect(loginAudit?.correlationId).toBe(
      customerServiceLogin.headers['x-request-id'],
    );
    expect(customerServiceLogin.body).not.toHaveProperty('session');
    expect(
      customerServiceCookies.find((cookie) =>
        cookie.startsWith('instalink_session='),
      ),
    ).toContain('HttpOnly');
    expect(
      customerServiceCookies.find((cookie) =>
        cookie.startsWith('instalink_csrf='),
      ),
    ).not.toContain('HttpOnly');

    const me = await customerService.get('/api/v1/me').expect(200);
    expect(me.body.user).toEqual({
      id: customerServiceId,
      email: staffEmail,
      roles: ['customer_service'],
    });

    const list = await customerService
      .get('/api/v1/registrations')
      .query({ status: 'BARU', area: 'sumedang', page: 1, pageSize: 10 })
      .expect(200);
    expect(list.body.items.map((item: { id: string }) => item.id)).toContain(
      registrationId,
    );

    const detail = await customerService
      .get(`/api/v1/registrations/${registrationId}`)
      .expect(200);
    expect(detail.body.fullName).toBe(sensitiveValues[0]);

    const csrfRejected = await customerService
      .patch(`/api/v1/registrations/${registrationId}/status`)
      .send({ status: 'DITINDAKLANJUTI' })
      .expect(403);
    expect(csrfRejected.body).toMatchObject({
      code: 'FORBIDDEN',
      requestId: csrfRejected.headers['x-request-id'],
    });
    const unchanged = await customerService
      .get(`/api/v1/registrations/${registrationId}`)
      .expect(200);
    expect(unchanged.body.status).toBe('BARU');

    await customerService
      .patch(`/api/v1/registrations/${registrationId}/status`)
      .set('x-csrf-token', customerServiceCsrf)
      .send({ status: 'DITINDAKLANJUTI' })
      .expect(200);
    await customerService
      .patch(`/api/v1/registrations/${registrationId}/status`)
      .set('x-csrf-token', customerServiceCsrf)
      .send({ status: 'MENUNGGU_KONFIRMASI_COVERAGE' })
      .expect(200);

    const auditCountBeforeInvalidApproval = await prisma.auditLog.count();
    const invalidApproval = await customerService
      .patch(`/api/v1/registrations/${registrationId}/status`)
      .set('x-csrf-token', customerServiceCsrf)
      .send({
        status: 'DISETUJUI',
        coverageConfirmed: false,
        reason: '',
      })
      .expect(409);
    expect(invalidApproval.body).toMatchObject({
      code: 'CONFLICT',
      requestId: invalidApproval.headers['x-request-id'],
    });
    expect(await prisma.auditLog.count()).toBe(auditCountBeforeInvalidApproval);

    await customerService
      .patch(`/api/v1/registrations/${registrationId}/status`)
      .set('x-csrf-token', customerServiceCsrf)
      .send({
        status: 'DISETUJUI',
        coverageConfirmed: true,
        reason: sensitiveValues[4],
      })
      .expect(200);
    await customerService
      .post(`/api/v1/registrations/${registrationId}/follow-ups`)
      .set('x-csrf-token', customerServiceCsrf)
      .send({ note: sensitiveValues[5] })
      .expect(201);
    await customerService
      .post('/api/v1/auth/logout')
      .set('x-csrf-token', customerServiceCsrf)
      .expect(201);
    await customerService.get('/api/v1/me').expect(401);

    const auditor = request.agent(app.getHttpServer());
    const auditorLogin = await auditor
      .post('/api/v1/auth/login')
      .send({ email: auditorEmail, password: staffPassword })
      .expect(201);
    const auditorCsrf = readCookie(
      auditorLogin.headers['set-cookie'],
      'instalink_csrf',
    );

    const auditorDetail = await auditor
      .get(`/api/v1/registrations/${registrationId}`)
      .expect(200);
    expect(auditorDetail.body.fullName).toBe('[REDACTED]');
    expect(auditorDetail.body.followUps[0].note).toBe('[REDACTED]');

    const roleDenied = await auditor
      .patch(`/api/v1/registrations/${registrationId}/status`)
      .set('x-csrf-token', auditorCsrf)
      .send({ status: 'SELESAI' })
      .expect(403);
    expect(roleDenied.body).toMatchObject({
      code: 'FORBIDDEN',
      requestId: roleDenied.headers['x-request-id'],
    });

    const audit = await auditor.get('/api/v1/audit-logs').expect(200);
    expect(audit.body.items.map((item: { action: string }) => item.action)).toEqual(
      expect.arrayContaining([
        'REGISTRATION_STATUS_CHANGED',
        'FOLLOW_UP_CREATED',
        'REGISTRATION_CREATED',
        'LOGIN_SUCCEEDED',
        'LOGIN_FAILED',
        'LOGOUT',
      ]),
    );
    const serializedAudit = JSON.stringify(audit.body);
    for (const value of sensitiveAuditValues) {
      expect(serializedAudit).not.toContain(value);
    }
  }, 30_000);
});
