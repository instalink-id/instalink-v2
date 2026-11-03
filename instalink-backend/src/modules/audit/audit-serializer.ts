const redactedFields = new Set([
  'fullName',
  'whatsapp',
  'email',
  'installationAddress',
  'latitude',
  'longitude',
  'notes',
  'approvalReason',
  'note',
  'password',
  'passwordHash',
  'temporaryPassword',
  'sessionToken',
  'csrfToken',
  'token',
  'tokenHash',
]);

function redactValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      redactedFields.has(key) ? '[REDACTED]' : redactValue(nestedValue),
    ]),
  );
}

export function redactAuditSnapshot(snapshot: unknown) {
  if (!snapshot) return null;
  return redactValue(snapshot);
}
