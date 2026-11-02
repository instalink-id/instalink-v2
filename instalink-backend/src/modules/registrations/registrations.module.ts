import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { RegistrationsController } from './registrations.controller.js';
import { RegistrationsService } from './registrations.service.js';

@Module({
  imports: [IdentityModule, AccessControlModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
