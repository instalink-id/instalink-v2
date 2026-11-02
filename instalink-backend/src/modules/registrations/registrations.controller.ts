import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Patch,
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
import { ChangeRegistrationStatusDto } from './dto/change-registration-status.dto.js';
import { CreateFollowUpDto } from './dto/create-follow-up.dto.js';
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

  @Patch('registrations/:id/status')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermissions(MVP_PERMISSIONS.registrationWrite)
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeRegistrationStatusDto,
    @Req() request: Request & { user?: { user: { id: string } } },
    @Headers('x-request-id') correlationId?: string,
  ) {
    return this.registrations.changeStatus(id, dto.status, request.user!.user.id, {
      coverageConfirmed: dto.coverageConfirmed,
      reason: dto.reason,
      correlationId,
    });
  }

  @Post('registrations/:id/follow-ups')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermissions(MVP_PERMISSIONS.registrationWrite)
  addFollowUp(
    @Param('id') id: string,
    @Body() dto: CreateFollowUpDto,
    @Req() request: Request & { user?: { user: { id: string } } },
    @Headers('x-request-id') correlationId?: string,
  ) {
    return this.registrations.addFollowUp(
      id,
      request.user!.user.id,
      dto.note,
      correlationId,
    );
  }
}
