import { ApiProperty } from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';

export class RegistrationSummaryCountsDto {
  @ApiProperty()
  BARU!: number;

  @ApiProperty()
  DITINDAKLANJUTI!: number;

  @ApiProperty()
  MENUNGGU_KONFIRMASI_COVERAGE!: number;

  @ApiProperty()
  PERLU_SURVEI!: number;

  @ApiProperty()
  DISETUJUI!: number;

  @ApiProperty()
  DITOLAK!: number;

  @ApiProperty()
  SELESAI!: number;
}

export class LatestRegistrationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ nullable: true })
  area!: string | null;

  @ApiProperty({ enum: RegistrationStatus })
  status!: RegistrationStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  submittedAt!: Date;
}

export class RegistrationSummaryDto {
  @ApiProperty({ type: RegistrationSummaryCountsDto })
  counts!: RegistrationSummaryCountsDto;

  @ApiProperty({ type: [LatestRegistrationDto] })
  latest!: LatestRegistrationDto[];
}
