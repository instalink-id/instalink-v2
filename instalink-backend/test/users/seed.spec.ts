import { beforeEach, describe, expect, it, vi } from 'vitest';

const seedMocks = vi.hoisted(() => ({
  globalRoleUpsert: vi.fn().mockImplementation(async ({ where, create }) => ({
    id: `${where.code}-seed-id`,
    ...create,
  })),
  globalUserUpsert: vi.fn().mockResolvedValue({ id: 'global-seed-user' }),
  globalUserRoleUpsert: vi.fn().mockResolvedValue({}),
  globalDisconnect: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    role = { upsert: seedMocks.globalRoleUpsert };
    user = { upsert: seedMocks.globalUserUpsert };
    userRole = { upsert: seedMocks.globalUserRoleUpsert };

    $disconnect = seedMocks.globalDisconnect;
  },
}));

vi.mock('argon2', () => ({
  hash: vi.fn(async () => 'argon2id-test-hash'),
}));

describe('admin role and seed catalog', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('SEED_ADMIN_EMAIL', ' Seed-Admin@Example.Test ');
    vi.stubEnv('SEED_ADMIN_PASSWORD', 'synthetic-seed-password');
  });

  it('creates a seed Super Admin only when absent and leaves existing credentials, status, and roles unchanged', async () => {
    const seedModule = await import('../../prisma/seed.js');
    expect(seedMocks.globalDisconnect).not.toHaveBeenCalled();
    vi.clearAllMocks();

    const existing = {
      id: 'existing-seed-user',
      email: 'seed-admin@example.test',
      passwordHash: 'existing-hash',
      status: 'DISABLED',
      roleCode: 'customer_service',
    };
    const users = new Map([[existing.email, { ...existing }]]);
    const roles = new Map<string, { id: string; code: string; name: string }>();
    let createdUser: Record<string, unknown> | undefined;
    const fakePrisma = {
      role: {
        upsert: vi.fn(async ({ where, create, update }) => {
          const current = roles.get(where.code);
          if (current) {
            Object.assign(current, update);
            return current;
          }
          const role = { id: `${where.code}-id`, ...create };
          roles.set(where.code, role);
          return role;
        }),
      },
      user: {
        upsert: vi.fn(async ({ where, create, update }) => {
          const current = users.get(where.email);
          if (current) {
            Object.assign(current, update);
            return current;
          }
          createdUser = { id: 'new-seed-user', ...create };
          users.set(where.email, createdUser as typeof existing);
          return createdUser;
        }),
      },
    };
    const seedRolesAndAdmin = seedModule.seedRolesAndAdmin as (
      prisma: typeof fakePrisma,
      env: {
        SEED_ADMIN_EMAIL?: string;
        SEED_ADMIN_PASSWORD?: string;
      },
    ) => Promise<void>;

    await seedRolesAndAdmin(fakePrisma, {
      SEED_ADMIN_EMAIL: ' Seed-Admin@Example.Test ',
      SEED_ADMIN_PASSWORD: 'replacement-must-not-be-used',
    });

    expect(roles.size).toBe(7);
    expect(users.get(existing.email)).toEqual(existing);
    expect(fakePrisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: existing.email },
        update: {},
      }),
    );

    const newSeedUser = new Map<string, typeof existing>();
    const newSeedPrisma = {
      role: fakePrisma.role,
      user: {
        upsert: vi.fn(async ({ where, create }) => {
          createdUser = { id: 'new-seed-user', ...create };
          newSeedUser.set(where.email, createdUser as typeof existing);
          return createdUser;
        }),
      },
    };
    await seedRolesAndAdmin(newSeedPrisma, {
      SEED_ADMIN_EMAIL: 'new-seed@example.test',
      SEED_ADMIN_PASSWORD: 'synthetic-new-seed-password',
    });

    const created = newSeedUser.get('new-seed@example.test');
    expect(created?.passwordHash).toBe('argon2id-test-hash');
    expect(created?.status).toBe('ACTIVE');
    expect(created?.roles).toEqual({
      create: { role: { connect: { id: 'super_admin-id' } } },
    });
    expect(JSON.stringify(created)).not.toContain('synthetic-new-seed-password');
  });
});
