import { Module } from '@nestjs/common';
import { IdentityController, MeController } from './identity.controller.js';
import { IdentityService } from './identity.service.js';
import { SessionGuard } from './guards/session.guard.js';
import { CsrfGuard } from './guards/csrf.guard.js';

@Module({
  controllers: [IdentityController, MeController],
  providers: [IdentityService, SessionGuard, CsrfGuard],
  exports: [IdentityService, SessionGuard, CsrfGuard],
})
export class IdentityModule {}
