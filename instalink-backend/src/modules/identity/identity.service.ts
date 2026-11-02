import { Injectable, UnauthorizedException } from '@nestjs/common';
import { verify } from 'argon2';
import type { Request } from 'express';
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
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { roles: { include: { role: true } } },
    });
    if (!user || user.status !== 'ACTIVE') throw invalidCredentials();

    let valid = false;
    try {
      valid = await verify(user.passwordHash, password);
    } catch {
      valid = false;
    }
    if (!valid) throw invalidCredentials();

    const now = new Date();
    const sessionToken = createToken();
    const csrfToken = createToken();
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(sessionToken),
        csrfTokenHash: hashToken(csrfToken),
        expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_MS),
        idleExpiresAt: new Date(now.getTime() + SESSION_IDLE_MS),
      },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
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

  async revoke(request: Request) {
    const token = request.cookies?.instalink_session;
    if (!token) return;
    await this.prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
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
