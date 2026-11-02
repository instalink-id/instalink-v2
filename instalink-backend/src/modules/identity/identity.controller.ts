import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { IdentityService } from './identity.service.js';
import { LoginDto } from './dto/login.dto.js';
import {
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createSessionCookieOptions,
} from './session-cookie.js';
import { SessionGuard } from './guards/session.guard.js';
import { CsrfGuard } from './guards/csrf.guard.js';

@ApiTags('identity')
@Controller('auth')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.identity.login(dto.email, dto.password);
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
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.identity.revoke(request);
    response.clearCookie(SESSION_COOKIE_NAME, createSessionCookieOptions());
    response.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
    return { status: 'ok' };
  }

}

@Controller()
export class MeController {
  @Get('me')
  @UseGuards(SessionGuard)
  me(@Req() request: { user: { user: { id: string; email: string; roles: string[] } } }) {
    return { user: request.user.user };
  }
}
