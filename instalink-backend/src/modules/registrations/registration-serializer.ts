type RegistrationPiiPayload = {
  fullName: string;
  whatsapp?: string;
  email?: string | null;
  installationAddress?: string;
  latitude?: unknown;
  longitude?: unknown;
  notes?: string | null;
  approvalReason?: string | null;
  followUps?: Array<{ note: string; [key: string]: unknown }>;
};

const FULL_REGISTRATION_ACCESS = new Set(['super_admin', 'customer_service']);

export function serializeRegistrationForRoles<T extends RegistrationPiiPayload>(
  registration: T,
  roles: readonly string[],
) {
  if (roles.some((role) => FULL_REGISTRATION_ACCESS.has(role))) {
    return registration;
  }

  const {
    fullName: _fullName,
    whatsapp,
    email,
    installationAddress,
    latitude,
    longitude,
    notes,
    approvalReason,
    followUps,
    ...operationalFields
  } = registration;

  return {
    ...operationalFields,
    fullName: '[REDACTED]',
    ...(whatsapp !== undefined ? { whatsapp: '[REDACTED]' } : {}),
    ...(email !== undefined
      ? { email: email === null ? null : '[REDACTED]' }
      : {}),
    ...(installationAddress !== undefined
      ? { installationAddress: '[REDACTED]' }
      : {}),
    ...(latitude !== undefined ? { latitude: null } : {}),
    ...(longitude !== undefined ? { longitude: null } : {}),
    ...(notes !== undefined ? { notes: notes === null ? null : '[REDACTED]' } : {}),
    ...(approvalReason !== undefined
      ? {
          approvalReason:
            approvalReason === null ? null : '[REDACTED]',
        }
      : {}),
    ...(followUps !== undefined
      ? {
          followUps: followUps.map(({ note: _note, ...fields }) => ({
            ...fields,
            note: '[REDACTED]',
          })),
        }
      : {}),
  };
}
