import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { hasPermissions, permissionsForRoles, type Permission } from './permissions.js';
import { REQUIRED_PERMISSIONS } from './permission.decorator.js';

type AuthenticatedRequest = Request & {
  user?: { user?: { roles?: string[] } };
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    ) ?? [];
    if (required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const roles = request.user?.user?.roles ?? [];
    if (!hasPermissions(permissionsForRoles(roles), required)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki izin untuk tindakan ini',
      });
    }
    return true;
  }
}
