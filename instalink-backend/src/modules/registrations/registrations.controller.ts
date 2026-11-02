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
import type { Request } from 'express';
import { RequirePermissions } from '../access-control/permission.decorator.js';
import { MVP_PERMISSIONS } from '../access-control/permissions.js';
import { PermissionGuard } from '../access-control/permission.guard.js';
import { SessionGuard } from '../identity/guards/session.guard.js';
import { CreateRegistrationDto } from './dto/create-registration.dto.js';
import { ChangeRegistrationStatusDto } from './dto/change-registration-status.dto.js';
import { CreateFollowUpDto } from './dto/create-follow-up.dto.js';
import { RegistrationListQueryDto } from './dto/registration-list-query.dto.js';
import { serializeRegistrationForRoles } from './registration-serializer.js';
import { RegistrationsService } from './registrations.service.js';

type StaffRequest = Request & {
  user?: { user?: { id?: string; roles?: string[] } };
};

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
  async list(
    @Query() query: RegistrationListQueryDto,
    @Req() request: StaffRequest,
  ) {
    const result = await this.registrations.list({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      area: query.area,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
    const roles = request.user?.user?.roles ?? [];
    return {
      ...result,
      items: result.items.map((item) =>
        serializeRegistrationForRoles(item, roles),
      ),
    };
  }

  @Get('registrations/:id')
  @UseGuards(SessionGuard, PermissionGuard)
  @RequirePermissions(MVP_PERMISSIONS.registrationRead)
  async findOne(@Param('id') id: string, @Req() request: StaffRequest) {
    const registration = await this.registrations.findOne(id);
    return serializeRegistrationForRoles(
      registration,
      request.user?.user?.roles ?? [],
    );
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
