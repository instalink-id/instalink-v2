import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RegistrationStatus } from '@prisma/client';

export class ChangeRegistrationStatusDto {
  @IsEnum(RegistrationStatus)
  status!: RegistrationStatus;

  @IsOptional()
  @IsBoolean()
  coverageConfirmed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
