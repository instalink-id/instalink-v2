import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  whatsapp!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(5000)
  installationAddress!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  area?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  coordinatesConsent?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  requestedPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsString()
  @MaxLength(80)
  source!: string;

  @IsBoolean()
  communicationConsent!: boolean;
}
