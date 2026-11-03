import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequirePermissions } from '../access-control/permission.decorator.js';
import { PermissionGuard } from '../access-control/permission.guard.js';
import { MVP_PERMISSIONS } from '../access-control/permissions.js';
import { CsrfGuard } from '../identity/guards/csrf.guard.js';
import { SessionGuard } from '../identity/guards/session.guard.js';
import { ChangeUserRoleDto } from './dto/change-user-role.dto.js';
import { ChangeUserStatusDto } from './dto/change-user-status.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserListQueryDto } from './dto/user-list-query.dto.js';
import { UsersService } from './users.service.js';

type StaffRequest = Request & { user: { user: { id: string } } };

@ApiTags('users')
@Controller('users')
@UseGuards(SessionGuard, PermissionGuard)
@RequirePermissions(MVP_PERMISSIONS.userRead)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: UserListQueryDto) {
    return this.users.list(query);
  }

  @Post()
  @UseGuards(CsrfGuard)
  @RequirePermissions(MVP_PERMISSIONS.userWrite)
  create(
    @Body() dto: CreateUserDto,
    @Req() request: StaffRequest,
    @Headers('x-request-id') correlationId?: string,
  ) {
    return this.users.create(dto, request.user.user.id, correlationId);
  }

  @Patch(':id/role')
  @UseGuards(CsrfGuard)
  @RequirePermissions(MVP_PERMISSIONS.userWrite)
  changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeUserRoleDto,
    @Req() request: StaffRequest,
    @Headers('x-request-id') correlationId?: string,
  ) {
    return this.users.changeRole(
      id,
      dto,
      request.user.user.id,
      correlationId,
    );
  }

  @Patch(':id/status')
  @UseGuards(CsrfGuard)
  @RequirePermissions(MVP_PERMISSIONS.userWrite)
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeUserStatusDto,
    @Req() request: StaffRequest,
    @Headers('x-request-id') correlationId?: string,
  ) {
    return this.users.changeStatus(
      id,
      dto,
      request.user.user.id,
      correlationId,
    );
  }

  @Post(':id/reset-password')
  @UseGuards(CsrfGuard)
  @RequirePermissions(MVP_PERMISSIONS.userWrite)
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: StaffRequest,
    @Headers('x-request-id') correlationId?: string,
  ) {
    return this.users.resetPassword(
      id,
      request.user.user.id,
      correlationId,
    );
  }
}
