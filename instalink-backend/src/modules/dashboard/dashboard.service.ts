import { BadRequestException, Injectable } from '@nestjs/common';
import { RegistrationStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { RegistrationSummaryDto } from './dto/registration-summary.dto.js';

export type RegistrationSummaryFilters = {
  area?: string;
  from?: string;
  to?: string;
  limit: number;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async registrationSummary(
    filters: RegistrationSummaryFilters,
  ): Promise<RegistrationSummaryDto> {
    const from = filters.from ? new Date(filters.from) : undefined;
    const to = filters.to ? new Date(filters.to) : undefined;
    if (from && to && from > to) {
      throw new BadRequestException('Tanggal awal tidak boleh melewati tanggal akhir');
    }

    const where: Prisma.RegistrationWhereInput = {
      ...(filters.area?.trim()
        ? {
            area: {
              contains: filters.area.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(from || to
        ? {
            submittedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [groups, latest] = await this.prisma.$transaction([
      this.prisma.registration.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.registration.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        take: filters.limit,
        select: {
          id: true,
          fullName: true,
          area: true,
          status: true,
          submittedAt: true,
        },
      }),
    ]);

    const counts: RegistrationSummaryDto['counts'] = {
      [RegistrationStatus.BARU]: 0,
      [RegistrationStatus.DITINDAKLANJUTI]: 0,
      [RegistrationStatus.MENUNGGU_KONFIRMASI_COVERAGE]: 0,
      [RegistrationStatus.PERLU_SURVEI]: 0,
      [RegistrationStatus.DISETUJUI]: 0,
      [RegistrationStatus.DITOLAK]: 0,
      [RegistrationStatus.SELESAI]: 0,
    };
    for (const group of groups) {
      counts[group.status] = group._count._all;
    }

    return { counts, latest };
  }
}
