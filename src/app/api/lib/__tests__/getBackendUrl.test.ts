/**
 * Tests for H3: server-only getBackendUrl helper.
 * Verifies that NEXT_PUBLIC_API_URL is never used for server-side calls.
 */

describe('getBackendUrl – H3 server-only URL', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns API_URL when set', async () => {
    process.env.API_URL = 'https://api.example.com';
    delete process.env.NEXT_PUBLIC_API_URL;
    const { getBackendUrl } = await import('../getBackendUrl');
    expect(getBackendUrl()).toBe('https://api.example.com');
  });

  it('uses API_URL even when NEXT_PUBLIC_API_URL is also set', async () => {
    process.env.API_URL = 'https://private.example.com';
    process.env.NEXT_PUBLIC_API_URL = 'https://public.example.com';
    const { getBackendUrl } = await import('../getBackendUrl');
    expect(getBackendUrl()).toBe('https://private.example.com');
  });

  it('falls back to localhost in development when API_URL is absent', async () => {
    delete process.env.API_URL;
    process.env.NODE_ENV = 'development';
    const { getBackendUrl } = await import('../getBackendUrl');
    expect(getBackendUrl()).toBe('http://localhost:3002');
  });

  it('falls back to localhost in test environment when API_URL is absent', async () => {
    delete process.env.API_URL;
    process.env.NODE_ENV = 'test';
    const { getBackendUrl } = await import('../getBackendUrl');
    expect(getBackendUrl()).toBe('http://localhost:3002');
  });

  it('throws in production when API_URL is absent', async () => {
    delete process.env.API_URL;
    process.env.NODE_ENV = 'production';
    const { getBackendUrl } = await import('../getBackendUrl');
    expect(() => getBackendUrl()).toThrow('API_URL environment variable must be set in production');
  });

  it('never reads NEXT_PUBLIC_API_URL', async () => {
    delete process.env.API_URL;
    process.env.NEXT_PUBLIC_API_URL = 'https://should-not-be-used.example.com';
    process.env.NODE_ENV = 'development';
    const { getBackendUrl } = await import('../getBackendUrl');
    const url = getBackendUrl();
    expect(url).not.toBe('https://should-not-be-used.example.com');
    expect(url).toBe('http://localhost:3002');
  });
});
