import { Injectable } from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { redactAuditSnapshot } from './audit-serializer.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(
    event: {
      actorId?: string;
      action: AuditAction;
      resourceType: string;
      resourceId?: string;
      correlationId?: string;
      before?: Record<string, unknown> | null;
      after?: Record<string, unknown> | null;
    },
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    return client.auditLog.create({
      data: {
        actorId: event.actorId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        correlationId: event.correlationId,
        beforeRedacted: redactAuditSnapshot(event.before ?? null) as Prisma.InputJsonValue,
        afterRedacted: redactAuditSnapshot(event.after ?? null) as Prisma.InputJsonValue,
      },
    });
  }

  async list(page: number, pageSize: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          correlationId: true,
          beforeRedacted: true,
          afterRedacted: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count(),
    ]);
    return {
      items: items.map((item) => ({
        ...item,
        beforeRedacted: redactAuditSnapshot(item.beforeRedacted),
        afterRedacted: redactAuditSnapshot(item.afterRedacted),
      })),
      page,
      pageSize,
      total,
    };
  }
}
