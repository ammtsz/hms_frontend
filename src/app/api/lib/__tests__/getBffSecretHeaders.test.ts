import { BFF_SECRET_HEADER } from '../getBffSecretHeaders';

describe('getBffSecretHeaders', () => {
  const originalEnv = process.env;
  let restoreNodeEnv: (() => void) | undefined;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.BFF_INTERNAL_SECRET;
  });

  afterEach(() => {
    restoreNodeEnv?.();
    restoreNodeEnv = undefined;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function setNodeEnv(value: 'development' | 'production' | 'test'): void {
    restoreNodeEnv?.();
    restoreNodeEnv = jest.replaceProperty(process.env, 'NODE_ENV', value).restore;
  }

  it('returns the secret header when BFF_INTERNAL_SECRET is set', async () => {
    process.env.BFF_INTERNAL_SECRET = 'test-secret';
    setNodeEnv('development');
    const { getBffSecretHeaders } = await import('../getBffSecretHeaders');
    expect(getBffSecretHeaders()).toEqual({
      [BFF_SECRET_HEADER]: 'test-secret',
    });
  });

  it('returns empty object in development when secret is absent', async () => {
    setNodeEnv('development');
    const { getBffSecretHeaders } = await import('../getBffSecretHeaders');
    expect(getBffSecretHeaders()).toEqual({});
  });

  it('throws in production when secret is absent', async () => {
    setNodeEnv('production');
    const { getBffSecretHeaders } = await import('../getBffSecretHeaders');
    expect(() => getBffSecretHeaders()).toThrow(
      'BFF_INTERNAL_SECRET environment variable must be set in production',
    );
  });
});
