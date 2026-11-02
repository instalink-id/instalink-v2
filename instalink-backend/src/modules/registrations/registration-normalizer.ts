export type RegistrationInput = {
  fullName: string;
  whatsapp: string;
  email?: string;
  installationAddress: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  coordinatesConsent?: boolean;
  requestedPlan?: string;
  notes?: string;
  source: string;
  communicationConsent: boolean;
};

function clean(value?: string) {
  const result = value?.trim();
  return result || undefined;
}

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/[^\d+]/g, '');
  if (digits.startsWith('+62')) return digits;
  if (digits.startsWith('62')) return `+${digits}`;
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
  return digits;
}

export function validateCoordinates(
  latitude?: number,
  longitude?: number,
  consent = false,
) {
  if (latitude === undefined && longitude === undefined) return undefined;
  if (!consent) throw new Error('Coordinates require consent');
  if (
    latitude === undefined ||
    latitude < -90 ||
    latitude > 90 ||
    longitude === undefined ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      latitude === undefined || latitude < -90 || latitude > 90
        ? 'Latitude is invalid'
        : 'Longitude is invalid',
    );
  }
  return { latitude, longitude };
}

export function normalizeRegistrationInput(input: RegistrationInput) {
  const coordinates = validateCoordinates(
    input.latitude,
    input.longitude,
    input.coordinatesConsent,
  );
  return {
    fullName: input.fullName.trim(),
    whatsapp: normalizeWhatsapp(input.whatsapp),
    email: clean(input.email)?.toLowerCase(),
    installationAddress: input.installationAddress.trim(),
    area: clean(input.area),
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    coordinatesConsent: Boolean(input.coordinatesConsent && coordinates),
    requestedPlan: clean(input.requestedPlan),
    notes: clean(input.notes),
    source: input.source.trim(),
    communicationConsent: input.communicationConsent,
  };
}
