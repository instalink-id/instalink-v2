import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { RegistrationStatus } from '@prisma/client';
import type { Request } from 'express';
import { RequirePermissions } from '../access-control/permission.decorator.js';
import { MVP_PERMISSIONS } from '../access-control/permissions.js';
import { PermissionGuard } from '../access-control/permission.guard.js';
import { SessionGuard } from '../identity/guards/session.guard.js';
import { CreateRegistrationDto } from './dto/create-registration.dto.js';
import { RegistrationsService } from './registrations.service.js';

@ApiTags('registrations')
@Controller()
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Post('public/registrations')
  createPublic(
    @Body() dto: CreateRegistrationDto,
    @Req() request: Request,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.registrations.createPublic(dto, request, idempotencyKey);
  }

  @Get('registrations')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermissions(MVP_PERMISSIONS.registrationRead)
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('status') status?: RegistrationStatus,
    @Query('area') area?: string,
  ) {
    return this.registrations.list({
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(100, Math.max(1, Number(pageSize) || 20)),
      status,
      area,
    });
  }

  @Get('registrations/:id')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermissions(MVP_PERMISSIONS.registrationRead)
  findOne(@Param('id') id: string) {
    return this.registrations.findOne(id);
  }
}
