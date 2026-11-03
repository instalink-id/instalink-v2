import { hash } from 'argon2';
import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { ROLE_CATALOG } from '../src/modules/access-control/permissions.js';

type SeedEnvironment = Pick<
  NodeJS.ProcessEnv,
  'SEED_ADMIN_EMAIL' | 'SEED_ADMIN_PASSWORD'
>;

export async function seedRolesAndAdmin(
  prisma: Pick<PrismaClient, 'role' | 'user'>,
  env: SeedEnvironment = process.env,
) {
  const email = env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required for the development seed',
    );
  }

  const roles = await Promise.all(
    ROLE_CATALOG.map(({ code, name }) =>
      prisma.role.upsert({
        where: { code },
        update: { name },
        create: { code, name },
      }),
    ),
  );
  const superAdmin = roles.find(({ code }) => code === 'super_admin');
  if (!superAdmin) throw new Error('Super Admin role is missing from the catalog');

  await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: {},
    create: {
      email,
      passwordHash: await hash(password),
      status: 'ACTIVE',
      mustChangePassword: false,
      passwordChangeExpiresAt: null,
      roles: { create: { role: { connect: { id: superAdmin.id } } } },
    },
  });
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedRolesAndAdmin(prisma, process.env);
  } finally {
    await prisma.$disconnect();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
