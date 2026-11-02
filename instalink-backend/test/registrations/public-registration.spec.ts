import { describe, expect, it } from 'vitest';
import {
  normalizeRegistrationInput,
  validateCoordinates,
} from '../../src/modules/registrations/registration-normalizer.js';

describe('public registration normalization', () => {
  it('normalizes contact fields and preserves optional values', () => {
    expect(
      normalizeRegistrationInput({
        fullName: '  Siti Aminah ',
        whatsapp: '0812 3456 7890',
        email: '  SITI@example.com ',
        installationAddress: '  Jl. Merdeka 1 ',
        source: 'website',
        communicationConsent: true,
      }),
    ).toMatchObject({
      fullName: 'Siti Aminah',
      whatsapp: '+6281234567890',
      email: 'siti@example.com',
      installationAddress: 'Jl. Merdeka 1',
    });
  });

  it('rejects coordinates unless consent is provided and values are valid', () => {
    expect(() => validateCoordinates( -6.9, 107.6, false)).toThrow(
      'Coordinates require consent',
    );
    expect(() => validateCoordinates( -91, 107.6, true)).toThrow(
      'Latitude is invalid',
    );
    expect(validateCoordinates(-6.9, 107.6, true)).toEqual({
      latitude: -6.9,
      longitude: 107.6,
    });
  });
});
