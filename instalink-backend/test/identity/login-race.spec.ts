import { hash } from 'argon2';
import { describe, expect, it, vi } from 'vitest';
import { AuditService } from '../../src/modules/audit/audit.service.js';
import { IdentityService } from '../../src/modules/identity/identity.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('identity login concurrency', () => {
  it('does not create a session when the verified password changed concurrently', async () => {
    const user = {
      id: 'user-id',
      email: 'admin@example.test',
      passwordHash: await hash('old-password'),
      status: 'ACTIVE',
      mustChangePassword: false,
      passwordChangeExpiresAt: null,
      roles: [{ role: { code: 'super_admin' } }],
    };
    const transaction = {
      user: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        update: vi.fn().mockResolvedValue(undefined),
      },
      session: {
        create: vi.fn().mockResolvedValue({ id: 'session-id' }),
      },
    };
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(user) },
      $transaction: vi.fn(
        async (work: (tx: typeof transaction) => Promise<unknown>) =>
          work(transaction),
      ),
    };
    const audit = { record: vi.fn().mockResolvedValue(undefined) };
    const identity = new IdentityService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );

    await expect(
      identity.login('admin@example.test', 'old-password'),
    ).rejects.toMatchObject({ status: 401 });
    expect(transaction.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'user-id',
        passwordHash: user.passwordHash,
        status: 'ACTIVE',
      },
      data: { lastLoginAt: expect.any(Date) },
    });
    expect(transaction.session.create).not.toHaveBeenCalled();
  });
});
