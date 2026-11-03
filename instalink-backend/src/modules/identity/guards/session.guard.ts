import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IdentityService } from '../identity.service.js';
import {
  FORCED_PASSWORD_CHANGE_ACCESS,
  type ForcedPasswordChangeAccess,
} from '../decorators/forced-password-change.decorator.js';
import { isTemporaryPasswordExpired } from '../password-policy.js';

type AuthenticatedIdentity = Awaited<
  ReturnType<IdentityService['authenticate']>
>;
type AuthenticatedRequest = Request & { user?: AuthenticatedIdentity };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly identity: IdentityService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    let identity: AuthenticatedIdentity;
    try {
      identity = await this.identity.authenticate(request);
    } catch {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = identity;
    const user = identity.session.user;
    if (!user.mustChangePassword) return true;

    const access = this.reflector.get<ForcedPasswordChangeAccess>(
      FORCED_PASSWORD_CHANGE_ACCESS,
      context.getHandler(),
    );
    if (access === 'logout') return true;
    if (
      isTemporaryPasswordExpired(
        user.passwordChangeExpiresAt,
        new Date(),
      )
    ) {
      throw new ForbiddenException({
        code: 'TEMPORARY_PASSWORD_EXPIRED',
        message:
          'Kata sandi sementara kedaluwarsa; minta administrator melakukan reset',
      });
    }

    if (access === 'read' || access === 'change') return true;
    throw new ForbiddenException({
      code: 'PASSWORD_CHANGE_REQUIRED',
      message: 'Ganti kata sandi sementara sebelum melanjutkan',
    });
  }
}
