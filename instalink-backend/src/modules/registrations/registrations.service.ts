import {
  BadRequestException,
  ConflictException,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { RegistrationStatus } from '@prisma/client';
import { AuditAction } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { normalizeRegistrationInput, type RegistrationInput } from './registration-normalizer.js';
import { RegistrationStatusPolicy } from './registration-status.js';
import { AuditService } from '../audit/audit.service.js';

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 10;

@Injectable()
export class RegistrationsService {
  private readonly attempts = new Map<string, { startedAt: number; count: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createPublic(input: RegistrationInput, request: Request, idempotencyKey?: string) {
    const key = request.ip || 'unknown';
    const now = Date.now();
    const current = this.attempts.get(key);
    if (!current || now - current.startedAt >= WINDOW_MS) {
      this.attempts.set(key, { startedAt: now, count: 1 });
    } else {
      current.count += 1;
      if (current.count > MAX_PER_WINDOW) {
        throw new HttpException('Terlalu banyak pengajuan', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    const normalized = normalizeRegistrationInput(input);
    if (!normalized.communicationConsent) {
      throw new ConflictException('Consent komunikasi wajib diberikan');
    }
    const existing = idempotencyKey
      ? await this.prisma.registration.findUnique({
          where: { idempotencyKey },
          select: { id: true, status: true, submittedAt: true },
        })
      : null;
    if (existing) return existing;

    return this.prisma.$transaction(async (transaction) => {
      const registration = await transaction.registration.create({
        data: {
          ...normalized,
          idempotencyKey,
        },
      });
      await this.audit.record(
        {
          action: AuditAction.REGISTRATION_CREATED,
          resourceType: 'registration',
          resourceId: registration.id,
          after: registration,
        },
        transaction,
      );
      return {
        id: registration.id,
        status: registration.status,
        submittedAt: registration.submittedAt,
      };
    });
  }

  async list(input: {
    page: number;
    pageSize: number;
    status?: RegistrationStatus;
    area?: string;
    from?: Date;
    to?: Date;
  }) {
    if (input.from && input.to && input.from > input.to) {
      throw new BadRequestException(
        'Tanggal awal tidak boleh melewati tanggal akhir',
      );
    }
    const where = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.area ? { area: { contains: input.area, mode: 'insensitive' as const } } : {}),
      ...(input.from || input.to
        ? { submittedAt: { ...(input.from ? { gte: input.from } : {}), ...(input.to ? { lte: input.to } : {}) } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.registration.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: {
          id: true,
          fullName: true,
          whatsapp: true,
          area: true,
          status: true,
          submittedAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.registration.count({ where }),
    ]);
    return { items, page: input.page, pageSize: input.pageSize, total };
  }

  findOne(id: string) {
    return this.prisma.registration.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        fullName: true,
        whatsapp: true,
        email: true,
        installationAddress: true,
        area: true,
        latitude: true,
        longitude: true,
        coordinatesConsent: true,
        requestedPlan: true,
        notes: true,
        source: true,
        communicationConsent: true,
        status: true,
        coverageConfirmedAt: true,
        approvalReason: true,
        submittedAt: true,
        updatedAt: true,
        followUps: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, note: true, createdAt: true, actorId: true },
        },
      },
    });
  }

  async changeStatus(
    id: string,
    status: RegistrationStatus,
    actorId: string,
    context: { coverageConfirmed?: boolean; reason?: string; correlationId?: string },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.registration.findUniqueOrThrow({ where: { id } });
      const decision = RegistrationStatusPolicy.canTransition(current.status, status, context);
      if (!decision.allowed) throw new ConflictException(decision.reason);
      const updated = await transaction.registration.update({
        where: { id },
        data: {
          status,
          ...(status === 'DISETUJUI'
            ? {
                coverageConfirmedAt: context.coverageConfirmed ? new Date() : undefined,
                coverageConfirmedById: context.coverageConfirmed ? actorId : undefined,
                approvalReason: context.reason?.trim(),
              }
            : {}),
        },
      });
      await this.audit.record(
        {
          actorId,
          action: AuditAction.REGISTRATION_STATUS_CHANGED,
          resourceType: 'registration',
          resourceId: id,
          correlationId: context.correlationId,
          before: current,
          after: updated,
        },
        transaction,
      );
      return { id: updated.id, status: updated.status, updatedAt: updated.updatedAt };
    });
  }

  async addFollowUp(
    registrationId: string,
    actorId: string,
    note: string,
    correlationId?: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.registration.findUniqueOrThrow({ where: { id: registrationId } });
      const followUp = await transaction.registrationFollowUp.create({
        data: { registrationId, actorId, note: note.trim() },
        select: { id: true, registrationId: true, note: true, createdAt: true },
      });
      await this.audit.record(
        {
          actorId,
          action: AuditAction.FOLLOW_UP_CREATED,
          resourceType: 'registration_follow_up',
          resourceId: followUp.id,
          correlationId,
          after: followUp,
        },
        transaction,
      );
      return followUp;
    });
  }
}
