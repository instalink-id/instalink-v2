import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { IdentityService } from '../identity.service.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly identity: IdentityService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    try {
      request.user = await this.identity.authenticate(request);
      return true;
    } catch {
      throw new UnauthorizedException('Authentication required');
    }
  }
}
