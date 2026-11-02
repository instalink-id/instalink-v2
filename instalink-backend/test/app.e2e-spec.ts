import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.config.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, { setGlobalPrefix: false });
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((response) => {
        expect(response.headers['x-request-id']).toMatch(
          /^[0-9a-f-]{36}$/i,
        );
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['referrer-policy']).toBe(
          'strict-origin-when-cross-origin',
        );
      })
      .expect({
        name: 'Instalink ISP API',
        status: 'ok',
      });
  });

  it('returns a not-ready response while required services are unconfigured', () => {
    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(503)
      .expect({
        status: 'not_ready',
        checks: {
          configuration: 'ok',
          database: 'not-configured',
          externalIntegrations: 'not-configured',
        },
      });
  });

  it('allows the configured frontend origin and rejects other origins', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200)
      .expect((response) => {
        expect(response.headers['access-control-allow-origin']).toBe(
          'http://localhost:3000',
        );
      });

    await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://malicious.example')
      .expect(200)
      .expect((response) => {
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
      });
  });

  it('returns the documented error envelope for unknown routes', () => {
    return request(app.getHttpServer())
      .get('/missing-route')
      .expect(404)
      .expect((response) => {
        expect(response.body).toEqual({
          code: 'NOT_FOUND',
          message: 'Cannot GET /missing-route',
          requestId: response.headers['x-request-id'],
        });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
