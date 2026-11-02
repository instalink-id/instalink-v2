import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../access-control/permission.decorator.js';
import { MVP_PERMISSIONS } from '../access-control/permissions.js';
import { PermissionGuard } from '../access-control/permission.guard.js';
import { SessionGuard } from '../identity/guards/session.guard.js';
import { AuditService } from './audit.service.js';

@Controller('audit-logs')
@UseGuards(SessionGuard, PermissionGuard)
@RequirePermissions(MVP_PERMISSIONS.auditRead)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
    return this.audit.list(safePage, safePageSize);
  }
}
