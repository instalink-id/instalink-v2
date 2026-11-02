import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { HttpErrorFilter } from './http-error.filter.js';

type AppConfigurationOptions = {
  setGlobalPrefix?: boolean;
};

function getAllowedOrigins() {
  return (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function configureApp(
  app: INestApplication,
  options: AppConfigurationOptions = {},
) {
  if (options.setGlobalPrefix !== false) {
    app.setGlobalPrefix('api/v1');
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || getAllowedOrigins().includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  });
  app.useGlobalFilters(new HttpErrorFilter());

  app.use((request: { headers: Record<string, string | undefined> }, response: {
    setHeader: (name: string, value: string) => void;
  }, next: () => void) => {
    response.setHeader(
      'X-Request-Id',
      request.headers['x-request-id']?.trim() || randomUUID(),
    );
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader(
      'Referrer-Policy',
      'strict-origin-when-cross-origin',
    );
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    next();
  });
}
