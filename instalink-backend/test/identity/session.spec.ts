import { describe, expect, it } from 'vitest';
import {
  SESSION_ABSOLUTE_MS,
  SESSION_IDLE_MS,
  createSessionCookieOptions,
  hasValidCsrfToken,
  isSessionExpired,
} from '../../src/modules/identity/session-cookie.js';

describe('session policy', () => {
  it('uses the agreed idle and absolute lifetimes', () => {
    expect(SESSION_IDLE_MS).toBe(30 * 60 * 1000);
    expect(SESSION_ABSOLUTE_MS).toBe(8 * 60 * 60 * 1000);
  });

  it('detects idle or absolute expiry', () => {
    const now = new Date('2026-11-02T00:00:00.000Z');

    expect(
      isSessionExpired({
        now,
        idleExpiresAt: new Date('2026-11-02T00:20:00.000Z'),
        expiresAt: new Date('2026-11-02T08:00:00.000Z'),
      }),
    ).toBe(false);
    expect(
      isSessionExpired({
        now,
        idleExpiresAt: new Date('2026-11-02T00:20:00.000Z'),
        expiresAt: new Date('2026-11-01T23:59:00.000Z'),
      }),
    ).toBe(true);
  });

  it('marks the session cookie as httpOnly and secure outside development', () => {
    expect(createSessionCookieOptions('production')).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('requires the csrf header to match the readable csrf cookie', () => {
    expect(hasValidCsrfToken('csrf-value', 'csrf-value')).toBe(true);
    expect(hasValidCsrfToken('csrf-value', 'other')).toBe(false);
    expect(hasValidCsrfToken(undefined, 'csrf-value')).toBe(false);
  });
});
