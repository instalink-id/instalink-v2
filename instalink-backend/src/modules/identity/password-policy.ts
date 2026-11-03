import { randomBytes } from 'node:crypto';

export const TEMPORARY_PASSWORD_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function createTemporaryPassword(createdAt = new Date()) {
  return {
    password: randomBytes(32).toString('base64url'),
    expiresAt: new Date(createdAt.getTime() + TEMPORARY_PASSWORD_LIFETIME_MS),
  };
}

export function isTemporaryPasswordExpired(
  expiresAt: Date | null,
  now = new Date(),
) {
  return !expiresAt || now >= expiresAt;
}
