import { createHash, randomBytes } from 'node:crypto';

export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_ABSOLUTE_MS = 8 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = 'instalink_session';
export const CSRF_COOKIE_NAME = 'instalink_csrf';

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createToken() {
  return randomBytes(32).toString('base64url');
}

export function isSessionExpired(input: {
  now: Date;
  idleExpiresAt: Date;
  expiresAt: Date;
}) {
  return input.now >= input.idleExpiresAt || input.now >= input.expiresAt;
}

export function createSessionCookieOptions(nodeEnv = process.env.NODE_ENV) {
  return {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function hasValidCsrfToken(headerToken?: string, cookieToken?: string) {
  return Boolean(headerToken && cookieToken && headerToken === cookieToken);
}
