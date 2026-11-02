export function requireIsolatedTestDatabaseUrl(
  env: Pick<NodeJS.ProcessEnv, 'DATABASE_URL' | 'TEST_DATABASE_URL'>,
) {
  const testDatabaseUrl = env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error('An explicit local test database URL is required');
  }

  let parsedUrl: URL;
  let databaseName: string;
  try {
    parsedUrl = new URL(testDatabaseUrl);
    databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));
  } catch {
    throw new Error('The local test database URL is invalid');
  }

  const isPostgres =
    parsedUrl.protocol === 'postgres:' ||
    parsedUrl.protocol === 'postgresql:';
  const isLoopback = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(
    parsedUrl.hostname.toLowerCase(),
  );
  if (!isPostgres || !isLoopback || !databaseName.endsWith('_test')) {
    throw new Error(
      'The test database must be a loopback PostgreSQL database ending in _test',
    );
  }

  if (env.DATABASE_URL && env.DATABASE_URL !== testDatabaseUrl) {
    throw new Error('The active database URL must match the test database URL');
  }

  return testDatabaseUrl;
}
