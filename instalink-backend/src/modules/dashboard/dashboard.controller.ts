import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RequirePermissions } from '../access-control/permission.decorator.js';
import { MVP_PERMISSIONS } from '../access-control/permissions.js';
import { PermissionGuard } from '../access-control/permission.guard.js';
import { SessionGuard } from '../identity/guards/session.guard.js';
import { DashboardService } from './dashboard.service.js';
import { RegistrationSummaryDto } from './dto/registration-summary.dto.js';

class RegistrationSummaryQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  area?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @Transform(({ value }) =>
    value === undefined ? 10 : Math.min(50, Math.max(1, Number(value))),
  )
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}

@ApiTags('dashboard')
@ApiCookieAuth('instalink_session')
@Controller('dashboard/registrations')
@UseGuards(SessionGuard, PermissionGuard)
@RequirePermissions(MVP_PERMISSIONS.dashboardRead)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get registration status counts and latest registrations' })
  @ApiQuery({ name: 'area', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'limit', required: false, type: Number, maximum: 50 })
  @ApiOkResponse({ type: RegistrationSummaryDto })
  registrationSummary(@Query() query: RegistrationSummaryQueryDto) {
    return this.dashboard.registrationSummary(query);
  }
}
