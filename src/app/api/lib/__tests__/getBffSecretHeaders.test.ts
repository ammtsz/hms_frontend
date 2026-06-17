import { BFF_SECRET_HEADER } from '../getBffSecretHeaders';

describe('getBffSecretHeaders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.BFF_INTERNAL_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns the secret header when BFF_INTERNAL_SECRET is set', async () => {
    process.env.BFF_INTERNAL_SECRET = 'test-secret';
    process.env.NODE_ENV = 'development';
    const { getBffSecretHeaders } = await import('../getBffSecretHeaders');
    expect(getBffSecretHeaders()).toEqual({
      [BFF_SECRET_HEADER]: 'test-secret',
    });
  });

  it('returns empty object in development when secret is absent', async () => {
    process.env.NODE_ENV = 'development';
    const { getBffSecretHeaders } = await import('../getBffSecretHeaders');
    expect(getBffSecretHeaders()).toEqual({});
  });

  it('throws in production when secret is absent', async () => {
    process.env.NODE_ENV = 'production';
    const { getBffSecretHeaders } = await import('../getBffSecretHeaders');
    expect(() => getBffSecretHeaders()).toThrow(
      'BFF_INTERNAL_SECRET environment variable must be set in production',
    );
  });
});
