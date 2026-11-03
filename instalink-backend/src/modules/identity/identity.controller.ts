import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  IdentityService,
  type PasswordChangePrincipal,
} from './identity.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import {
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createSessionCookieOptions,
} from './session-cookie.js';
import { SessionGuard } from './guards/session.guard.js';
import { CsrfGuard } from './guards/csrf.guard.js';
import { AllowForcedPasswordChange } from './decorators/forced-password-change.decorator.js';

type AuthenticatedRequest = Request & { user?: PasswordChangePrincipal };

@ApiTags('identity')
@Controller('auth')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Headers('x-request-id') correlationId?: string,
  ) {
    const result = await this.identity.login(
      dto.email,
      dto.password,
      correlationId,
    );
    const options = createSessionCookieOptions();
    response.cookie(SESSION_COOKIE_NAME, result.sessionToken, options);
    response.cookie(CSRF_COOKIE_NAME, result.csrfToken, {
      ...options,
      httpOnly: false,
    });
    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(SessionGuard, CsrfGuard)
  @AllowForcedPasswordChange('logout')
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
    @Headers('x-request-id') correlationId?: string,
  ) {
    await this.identity.revoke(request, correlationId);
    response.clearCookie(SESSION_COOKIE_NAME, createSessionCookieOptions());
    response.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
    return { status: 'ok' };
  }

  @Post('password/change')
  @UseGuards(SessionGuard, CsrfGuard)
  @AllowForcedPasswordChange('change')
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: AuthenticatedRequest,
    @Headers('x-request-id') correlationId?: string,
  ) {
    return this.identity.changePassword(
      request.user!,
      dto.currentPassword,
      dto.newPassword,
      correlationId,
    );
  }
}

@Controller()
export class MeController {
  @Get('me')
  @UseGuards(SessionGuard)
  @AllowForcedPasswordChange('read')
  me(@Req() request: {
    user: {
      user: {
        id: string;
        email: string;
        roles: string[];
        mustChangePassword: boolean;
      };
    };
  }) {
    return { user: request.user.user };
  }
}
