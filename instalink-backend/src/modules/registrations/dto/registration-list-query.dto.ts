import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RegistrationStatus } from '@prisma/client';

export class RegistrationListQueryDto {
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;

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
    value === undefined ? 1 : Math.max(1, Number(value)),
  )
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) =>
    value === undefined ? 20 : Math.min(100, Math.max(1, Number(value))),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}
