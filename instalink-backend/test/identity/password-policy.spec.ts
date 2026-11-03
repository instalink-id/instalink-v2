import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ChangePasswordDto } from '../../src/modules/identity/dto/change-password.dto.js';
import {
  createTemporaryPassword,
  isTemporaryPasswordExpired,
  TEMPORARY_PASSWORD_LIFETIME_MS,
} from '../../src/modules/identity/password-policy.js';

describe('temporary password policy', () => {
  it('creates distinct URL-safe temporary passwords with sufficient entropy', () => {
    const first = createTemporaryPassword();
    const second = createTemporaryPassword();

    expect(first.password).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(first.password.length).toBeGreaterThanOrEqual(32);
    expect(second.password).not.toBe(first.password);
  });

  it('expires temporary credentials exactly 24 hours after creation', () => {
    const createdAt = new Date('2026-11-03T08:00:00.000Z');
    const temporaryPassword = createTemporaryPassword(createdAt);

    expect(TEMPORARY_PASSWORD_LIFETIME_MS).toBe(24 * 60 * 60 * 1000);
    expect(temporaryPassword.expiresAt).toEqual(
      new Date('2026-11-04T08:00:00.000Z'),
    );
  });

  it('treats the expiry boundary and missing expiry as expired', () => {
    const expiresAt = new Date('2026-11-04T08:00:00.000Z');

    expect(
      isTemporaryPasswordExpired(
        expiresAt,
        new Date('2026-11-04T07:59:59.999Z'),
      ),
    ).toBe(false);
    expect(isTemporaryPasswordExpired(expiresAt, expiresAt)).toBe(true);
    expect(isTemporaryPasswordExpired(null, expiresAt)).toBe(true);
  });

  it.each([11, 129])(
    'rejects a new password with length %i',
    async (length) => {
      const errors = await validate(
        Object.assign(new ChangePasswordDto(), {
          currentPassword: 'current-password',
          newPassword: 'x'.repeat(length),
        }),
      );

      expect(errors.map((error) => error.property)).toContain('newPassword');
    },
  );
});
