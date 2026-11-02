import { describe, expect, it } from 'vitest';
import { requireIsolatedTestDatabaseUrl } from './test-database.js';

describe('isolated test database URL', () => {
  it('requires an explicit test database URL', () => {
    expect(() => requireIsolatedTestDatabaseUrl({})).toThrow();
  });

  it('accepts a loopback PostgreSQL database with a test-only name', () => {
    const url = 'postgresql://localhost:5432/instalink_test?schema=public';

    expect(
      requireIsolatedTestDatabaseUrl({ TEST_DATABASE_URL: url }),
    ).toBe(url);
  });

  it('rejects a remote test database', () => {
    expect(() =>
      requireIsolatedTestDatabaseUrl({
        TEST_DATABASE_URL: 'postgresql://db.example.com/instalink_test',
      }),
    ).toThrow();
  });

  it('rejects a database without a test-only name', () => {
    expect(() =>
      requireIsolatedTestDatabaseUrl({
        TEST_DATABASE_URL: 'postgresql://localhost:5432/instalink',
      }),
    ).toThrow();
  });

  it('rejects a test URL that differs from the active database URL', () => {
    expect(() =>
      requireIsolatedTestDatabaseUrl({
        DATABASE_URL: 'postgresql://localhost:5432/instalink',
        TEST_DATABASE_URL: 'postgresql://localhost:5432/instalink_test',
      }),
    ).toThrow();
  });
});
