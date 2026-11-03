import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma, UserStatus } from '@prisma/client';
import { hash } from 'argon2';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { createTemporaryPassword } from '../identity/password-policy.js';
import type { ChangeUserRoleDto } from './dto/change-user-role.dto.js';
import type { ChangeUserStatusDto } from './dto/change-user-status.dto.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UserListQueryDto } from './dto/user-list-query.dto.js';

const userSelect = {
  id: true,
  email: true,
  status: true,
  mustChangePassword: true,
  passwordChangeExpiresAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      role: { select: { code: true, name: true, id: true } },
    },
  },
} satisfies Prisma.UserSelect;

type UserRecord = Prisma.UserGetPayload<{ select: typeof userSelect }>;

function isPrismaError(
  error: unknown,
  code: string,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code
  );
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: UserListQueryDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.role
        ? { roles: { some: { role: { code: query.role } } } }
        : {}),
      ...(query.search
        ? {
            email: {
              contains: query.search,
              mode: 'insensitive',
            },
          }
        : {}),
    };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: userSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((user) => this.serializeUser(user)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async create(
    input: CreateUserDto,
    actorId: string,
    correlationId?: string,
  ) {
    const email = input.email.trim().toLowerCase();
    const now = new Date();
    const temporaryPassword = createTemporaryPassword(now);
    const passwordHash = await hash(temporaryPassword.password);

    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const role = await transaction.role.findUnique({
          where: { code: input.roleCode },
          select: { id: true, code: true, name: true },
        });
        if (!role) throw new NotFoundException('Role not found');

        const created = await transaction.user.create({
          data: {
            email,
            passwordHash,
            status: UserStatus.ACTIVE,
            mustChangePassword: true,
            passwordChangeExpiresAt: temporaryPassword.expiresAt,
            roles: {
              create: { role: { connect: { id: role.id } } },
            },
          },
          select: userSelect,
        });
        await this.audit.record(
          {
            actorId,
            action: AuditAction.USER_CREATED,
            resourceType: 'user',
            resourceId: created.id,
            correlationId,
            after: {
              email: created.email,
              status: created.status,
              role: { code: role.code },
            },
          },
          transaction,
        );
        return created;
      });

      return {
        ...this.serializeUser(user),
        temporaryPassword: temporaryPassword.password,
      };
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Email sudah terdaftar');
      }
      throw error;
    }
  }

  async changeRole(
    id: string,
    input: ChangeUserRoleDto,
    actorId: string,
    correlationId?: string,
  ) {
    return this.withSerializableTransaction(async (transaction) => {
      const current = await transaction.user.findUnique({
        where: { id },
        select: userSelect,
      });
      if (!current) throw new NotFoundException('User not found');
      if (id === actorId) {
        throw new ConflictException('Super Admin tidak dapat mengubah role sendiri');
      }

      const role = await transaction.role.findUnique({
        where: { code: input.roleCode },
        select: { id: true, code: true, name: true },
      });
      if (!role) throw new NotFoundException('Role not found');

      const currentRole = current.roles[0]?.role;
      if (
        current.status === UserStatus.ACTIVE &&
        currentRole?.code === 'super_admin' &&
        role.code !== 'super_admin'
      ) {
        await this.ensureAnotherActiveSuperAdmin(transaction);
      }
      if (currentRole?.code === role.code) return this.serializeUser(current);

      await transaction.userRole.upsert({
        where: { userId: id },
        create: { userId: id, roleId: role.id },
        update: { roleId: role.id },
      });
      await this.revokeSessions(transaction, id);
      await this.audit.record(
        {
          actorId,
          action: AuditAction.USER_ROLE_CHANGED,
          resourceType: 'user',
          resourceId: id,
          correlationId,
          before: {
            email: current.email,
            role: currentRole ? { code: currentRole.code } : null,
          },
          after: { email: current.email, role: { code: role.code } },
        },
        transaction,
      );
      const updated = await transaction.user.findUniqueOrThrow({
        where: { id },
        select: userSelect,
      });
      return this.serializeUser(updated);
    });
  }

  async changeStatus(
    id: string,
    input: ChangeUserStatusDto,
    actorId: string,
    correlationId?: string,
  ) {
    return this.withSerializableTransaction(async (transaction) => {
      const current = await transaction.user.findUnique({
        where: { id },
        select: userSelect,
      });
      if (!current) throw new NotFoundException('User not found');
      if (id === actorId) {
        throw new ConflictException('Super Admin tidak dapat menonaktifkan akun sendiri');
      }
      if (current.status === input.status) return this.serializeUser(current);

      const currentRole = current.roles[0]?.role;
      if (
        current.status === UserStatus.ACTIVE &&
        input.status === UserStatus.DISABLED &&
        currentRole?.code === 'super_admin'
      ) {
        await this.ensureAnotherActiveSuperAdmin(transaction);
      }

      const updated = await transaction.user.update({
        where: { id },
        data: { status: input.status },
        select: userSelect,
      });
      await this.revokeSessions(transaction, id);
      await this.audit.record(
        {
          actorId,
          action: AuditAction.USER_STATUS_CHANGED,
          resourceType: 'user',
          resourceId: id,
          correlationId,
          before: { email: current.email, status: current.status },
          after: { email: updated.email, status: updated.status },
        },
        transaction,
      );
      return this.serializeUser(updated);
    });
  }

  async resetPassword(id: string, actorId: string, correlationId?: string) {
    const now = new Date();
    const temporaryPassword = createTemporaryPassword(now);
    const passwordHash = await hash(temporaryPassword.password);

    const user = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.user.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!current) throw new NotFoundException('User not found');

      const updated = await transaction.user.update({
        where: { id },
        data: {
          passwordHash,
          mustChangePassword: true,
          passwordChangeExpiresAt: temporaryPassword.expiresAt,
        },
        select: userSelect,
      });
      await this.revokeSessions(transaction, id, now);
      await this.audit.record(
        {
          actorId,
          action: AuditAction.USER_PASSWORD_RESET,
          resourceType: 'user',
          resourceId: id,
          correlationId,
          after: {
            temporaryPasswordIssued: true,
            passwordChangeExpiresAt: temporaryPassword.expiresAt,
          },
        },
        transaction,
      );
      return updated;
    });

    return {
      ...this.serializeUser(user),
      temporaryPassword: temporaryPassword.password,
    };
  }

  private async ensureAnotherActiveSuperAdmin(
    transaction: Prisma.TransactionClient,
  ) {
    const activeCount = await transaction.user.count({
      where: {
        status: UserStatus.ACTIVE,
        roles: { some: { role: { code: 'super_admin' } } },
      },
    });
    if (activeCount <= 1) {
      throw new ConflictException(
        'Minimal satu Super Admin aktif harus dipertahankan',
      );
    }
  }

  private revokeSessions(
    transaction: Prisma.TransactionClient,
    userId: string,
    revokedAt = new Date(),
  ) {
    return transaction.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt },
    });
  }

  private async withSerializableTransaction<T>(
    work: (transaction: Prisma.TransactionClient) => Promise<T>,
  ) {
    try {
      return await this.prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (isPrismaError(error, 'P2034')) {
        throw new ConflictException(
          'Perubahan bertabrakan dengan perubahan lain; silakan coba kembali',
        );
      }
      throw error;
    }
  }

  private serializeUser(user: UserRecord) {
    const role = user.roles[0]?.role;
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      role: role ? { code: role.code, name: role.name } : null,
      mustChangePassword: user.mustChangePassword,
      passwordChangeExpiresAt: user.passwordChangeExpiresAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
