const runtimeModes = new Set(['development', 'test', 'production']);

function isPostgreSqlUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      ['postgres:', 'postgresql:'].includes(url.protocol) &&
      url.hostname.length > 0 &&
      url.pathname.length > 1
    );
  } catch {
    return false;
  }
}

function parseFrontendOrigins(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      'Invalid environment configuration: frontend origins are invalid',
    );
  }

  const origins = value.split(',').map((origin) => origin.trim());
  const valid = origins.every((origin) => {
    try {
      const url = new URL(origin);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        url.origin === origin
      );
    } catch {
      return false;
    }
  });

  if (!valid) {
    throw new Error(
      'Invalid environment configuration: frontend origins must be absolute HTTP origins',
    );
  }

  return origins.join(',');
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnv = config.NODE_ENV === undefined ? 'development' : config.NODE_ENV;
  if (typeof nodeEnv !== 'string' || !runtimeModes.has(nodeEnv)) {
    throw new Error(
      'Invalid environment configuration: runtime mode is unsupported',
    );
  }

  const portValue = config.PORT === undefined ? '3001' : config.PORT;
  if (
    (typeof portValue !== 'string' && typeof portValue !== 'number') ||
    (typeof portValue === 'string' && !/^\d+$/.test(portValue))
  ) {
    throw new Error(
      'Invalid environment configuration: PORT must be an integer from 1 to 65535',
    );
  }
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      'Invalid environment configuration: PORT must be an integer from 1 to 65535',
    );
  }

  const databaseUrl = config.DATABASE_URL;
  if (databaseUrl === undefined && nodeEnv !== 'test') {
    throw new Error(
      'Invalid environment configuration: a database URL is required',
    );
  }
  if (
    databaseUrl !== undefined &&
    (typeof databaseUrl !== 'string' || !isPostgreSqlUrl(databaseUrl))
  ) {
    throw new Error(
      'Invalid environment configuration: database URL must be a PostgreSQL URL',
    );
  }

  const frontendOrigin =
    config.FRONTEND_ORIGIN === undefined
      ? 'http://localhost:3000'
      : config.FRONTEND_ORIGIN;

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: String(port),
    FRONTEND_ORIGIN: parseFrontendOrigins(frontendOrigin),
  };
}
