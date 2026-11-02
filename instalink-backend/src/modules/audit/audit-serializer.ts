const redactedFields = new Set(['fullName', 'whatsapp', 'email', 'notes']);

export function redactAuditSnapshot(snapshot: Record<string, unknown> | null) {
  if (!snapshot) return null;
  return Object.fromEntries(
    Object.entries(snapshot).map(([key, value]) => [
      key,
      redactedFields.has(key) ? '[REDACTED]' : value,
    ]),
  );
}
