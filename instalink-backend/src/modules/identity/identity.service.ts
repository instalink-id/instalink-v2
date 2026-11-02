import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { verify } from 'argon2';
import type { Request } from 'express';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  SESSION_ABSOLUTE_MS,
  SESSION_IDLE_MS,
  createToken,
  hashToken,
  isSessionExpired,
} from './session-cookie.js';

const invalidCredentials = () =>
  new UnauthorizedException({
    code: 'INVALID_CREDENTIALS',
    message: 'Email atau password tidak valid',
  });

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, correlationId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { roles: { include: { role: true } } },
    });
    if (!user || user.status !== 'ACTIVE') {
      await this.audit.record({
        actorId: user?.id,
        action: AuditAction.LOGIN_FAILED,
        resourceType: 'identity',
        resourceId: user?.id,
        correlationId,
        after: { outcome: 'failed' },
      });
      throw invalidCredentials();
    }

    let valid = false;
    try {
      valid = await verify(user.passwordHash, password);
    } catch {
      valid = false;
    }
    if (!valid) {
      await this.audit.record({
        actorId: user.id,
        action: AuditAction.LOGIN_FAILED,
        resourceType: 'identity',
        resourceId: user.id,
        correlationId,
        after: { outcome: 'failed' },
      });
      throw invalidCredentials();
    }

    const now = new Date();
    const sessionToken = createToken();
    const csrfToken = createToken();
    const session = await this.prisma.$transaction(async (transaction) => {
      const createdSession = await transaction.session.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(sessionToken),
          csrfTokenHash: hashToken(csrfToken),
          expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_MS),
          idleExpiresAt: new Date(now.getTime() + SESSION_IDLE_MS),
        },
      });
      await transaction.user.update({
        where: { id: user.id },
        data: { lastLoginAt: now },
      });
      await this.audit.record(
        {
          actorId: user.id,
          action: AuditAction.LOGIN_SUCCEEDED,
          resourceType: 'session',
          resourceId: createdSession.id,
          correlationId,
          after: { outcome: 'succeeded' },
        },
        transaction,
      );
      return createdSession;
    });
    return {
      session,
      sessionToken,
      csrfToken,
      user: this.serializeUser(user),
    };
  }

  async authenticate(request: Request) {
    const token = request.cookies?.instalink_session;
    if (!token) throw new UnauthorizedException('Authentication required');
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });
    if (
      !session ||
      session.revokedAt ||
      isSessionExpired({
        now: new Date(),
        idleExpiresAt: session.idleExpiresAt,
        expiresAt: session.expiresAt,
      }) ||
      session.user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException('Authentication required');
    }
    return {
      session,
      user: this.serializeUser(session.user),
    };
  }

  async revoke(
    request: Request & {
      user?: { session?: { id: string }; user?: { id: string } };
    },
    correlationId?: string,
  ) {
    const token = request.cookies?.instalink_session;
    if (!token) return;
    const actorId = request.user?.user?.id;
    const sessionId = request.user?.session?.id;
    await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.session.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (result.count > 0 && actorId && sessionId) {
        await this.audit.record(
          {
            actorId,
            action: AuditAction.LOGOUT,
            resourceType: 'session',
            resourceId: sessionId,
            correlationId,
            after: { outcome: 'revoked' },
          },
          transaction,
        );
      }
    });
  }

  private serializeUser(user: {
    id: string;
    email: string;
    roles: Array<{ role: { code: string } }>;
  }) {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles.map(({ role }) => role.code),
    };
  }
}
