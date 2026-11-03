import { Transform } from 'class-transformer';
import { IsEmail, IsIn, MaxLength } from 'class-validator';
import { MVP_ROLE_CODES, type MvpRole } from '../../access-control/permissions.js';

export class CreateUserDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsIn([...MVP_ROLE_CODES])
  roleCode!: MvpRole;
}
