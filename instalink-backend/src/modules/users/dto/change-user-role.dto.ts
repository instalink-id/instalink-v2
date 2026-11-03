import { IsIn } from 'class-validator';
import { MVP_ROLE_CODES, type MvpRole } from '../../access-control/permissions.js';

export class ChangeUserRoleDto {
  @IsIn([...MVP_ROLE_CODES])
  roleCode!: MvpRole;
}
