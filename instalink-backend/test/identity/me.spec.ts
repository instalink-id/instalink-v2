import { describe, expect, it } from 'vitest';
import { MeController } from '../../src/modules/identity/identity.controller.js';

describe('current user endpoint response', () => {
  it('returns the public identity without exposing session or token hashes', () => {
    const controller = new MeController();
    const incomingRequest = {
      user: {
        session: {
          tokenHash: 'session-hash',
          csrfTokenHash: 'csrf-hash',
        },
        user: {
          id: 'staff-id',
          email: 'staff@example.com',
          roles: ['customer_service'],
          mustChangePassword: false,
        },
      },
    };
    const response = controller.me(incomingRequest);

    expect(response).toEqual({
      user: {
        id: 'staff-id',
        email: 'staff@example.com',
        roles: ['customer_service'],
        mustChangePassword: false,
      },
    });
  });
});
