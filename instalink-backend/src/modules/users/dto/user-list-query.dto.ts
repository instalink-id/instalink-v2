import { Transform } from 'class-transformer';
import { UserStatus } from '@prisma/client';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MVP_ROLE_CODES, type MvpRole } from '../../access-control/permissions.js';

export class UserListQueryDto {
  @IsOptional()
  @IsIn([...MVP_ROLE_CODES])
  role?: MvpRole;

  @IsOptional()
  @IsIn(Object.values(UserStatus))
  status?: UserStatus;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(320)
  search?: string;

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
