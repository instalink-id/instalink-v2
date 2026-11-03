import { SetMetadata } from '@nestjs/common';

export type ForcedPasswordChangeAccess = 'read' | 'change' | 'logout';
export const FORCED_PASSWORD_CHANGE_ACCESS = 'forcedPasswordChangeAccess';

export function AllowForcedPasswordChange(
  access: ForcedPasswordChangeAccess,
) {
  return SetMetadata(FORCED_PASSWORD_CHANGE_ACCESS, access);
}
