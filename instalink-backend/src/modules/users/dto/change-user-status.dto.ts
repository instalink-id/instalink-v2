import { IsIn } from 'class-validator';

export class ChangeUserStatusDto {
  @IsIn(['ACTIVE', 'DISABLED'])
  status!: 'ACTIVE' | 'DISABLED';
}
