import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CSRF_COOKIE_NAME,
  hasValidCsrfToken,
} from '../session-cookie.js';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const headerToken = request.header('x-csrf-token');
    const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];
    if (!hasValidCsrfToken(headerToken, cookieToken)) {
      throw new ForbiddenException({
        code: 'CSRF_INVALID',
        message: 'CSRF token tidak valid',
      });
    }
    return true;
  }
}
