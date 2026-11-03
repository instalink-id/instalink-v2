import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateUserDto } from '../../src/modules/users/dto/create-user.dto.js';
import { UserListQueryDto } from '../../src/modules/users/dto/user-list-query.dto.js';
import { ChangeUserRoleDto } from '../../src/modules/users/dto/change-user-role.dto.js';
import { ChangeUserStatusDto } from '../../src/modules/users/dto/change-user-status.dto.js';

describe('admin user API input contracts', () => {
  it('accepts a normalized email and an explicitly selected role', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'new-staff@example.test',
      roleCode: 'customer_service',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects invalid email addresses and unknown role codes', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'not-an-email',
      roleCode: 'super_admin_by_default',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('validates role and status changes against supported values', async () => {
    const invalidRole = plainToInstance(ChangeUserRoleDto, {
      roleCode: 'unknown_role',
    });
    const invalidStatus = plainToInstance(ChangeUserStatusDto, {
      status: 'DELETED',
    });

    expect(await validate(invalidRole)).not.toHaveLength(0);
    expect(await validate(invalidStatus)).not.toHaveLength(0);
  });

  it('defaults pagination and accepts role, status, and email search filters', async () => {
    const dto = plainToInstance(UserListQueryDto, {
      role: 'customer_service',
      status: 'ACTIVE',
      search: 'staff@example.test',
    });

    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects malformed pagination and unknown filters', async () => {
    const dto = plainToInstance(UserListQueryDto, {
      page: 'not-a-number',
      role: 'unknown_role',
      status: 'DELETED',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
