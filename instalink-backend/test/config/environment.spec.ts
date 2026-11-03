import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../../src/config/environment.js';

const validEnvironment = {
  NODE_ENV: 'development',
  PORT: '3001',
  DATABASE_URL:
    'postgresql://instalink:synthetic-secret@localhost:5432/instalink?schema=public',
  FRONTEND_ORIGIN: 'http://localhost:3000,https://admin.example.test',
};

function failureMessage(environment: Record<string, unknown>) {
  try {
    validateEnvironment(environment);
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }

    throw error;
  }

  throw new Error('Expected environment validation to fail');
}

describe('runtime environment validation', () => {
  it('accepts PostgreSQL configuration and multiple absolute frontend origins', () => {
    expect(validateEnvironment(validEnvironment)).toEqual(validEnvironment);
  });

  it('requires a database URL outside test mode', () => {
    const message = failureMessage({
      NODE_ENV: 'development',
      PORT: '3001',
      FRONTEND_ORIGIN: 'http://localhost:3000',
    });

    expect(message).not.toContain('DATABASE_URL');
  });

  it('rejects a malformed PostgreSQL database URL', () => {
    const message = failureMessage({
      ...validEnvironment,
      DATABASE_URL: 'postgresql://',
    });

    expect(message).not.toContain('postgresql://');
  });

  it('rejects non-PostgreSQL database URLs without exposing credentials', () => {
    const databaseUrl = 'mysql://admin:synthetic-secret@localhost/instalink';
    const message = failureMessage({
      ...validEnvironment,
      DATABASE_URL: databaseUrl,
    });

    expect(message).not.toContain(databaseUrl);
    expect(message).not.toContain('synthetic-secret');
  });

  it('rejects malformed frontend origins', () => {
    const message = failureMessage({
      ...validEnvironment,
      FRONTEND_ORIGIN: 'https://admin.example.test/dashboard',
    });

    expect(message).not.toContain('admin.example.test');
  });

  it.each(['not-a-port', '0', '65536', '3000.5'])(
    'rejects invalid port %s',
    (port) => {
      expect(() =>
        validateEnvironment({ ...validEnvironment, PORT: port }),
      ).toThrow();
    },
  );

  it.each(['1', '65535'])('accepts port boundary %s', (port) => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, PORT: port }),
    ).not.toThrow();
  });

  it('rejects unsupported runtime modes', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, NODE_ENV: 'staging' }),
    ).toThrow();
  });

  it('allows test mode without a database URL', () => {
    const environment = {
      NODE_ENV: 'test',
      PORT: '3001',
      FRONTEND_ORIGIN: 'http://localhost:3000',
    };

    expect(validateEnvironment(environment)).toEqual(environment);
  });
});
