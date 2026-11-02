import { describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Prisma foundation', () => {
  it('exposes a Prisma client service with explicit lifecycle methods', () => {
    const service = Object.create(PrismaService.prototype) as PrismaService;

    expect(service).toBeInstanceOf(PrismaService);
    expect(typeof service.$connect).toBe('function');
    expect(typeof service.$disconnect).toBe('function');
  });
});
