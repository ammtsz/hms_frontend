import type { NextRequest } from 'next/server';
import { TextEncoder } from 'util';
import { proxy } from '../proxy';
import { jwtVerify } from 'jose';

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => ({ type: 'redirect', url: url.toString() }),
    next: () => ({ type: 'next' }),
  },
}));

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

type MockResponse = { type: 'redirect'; url: string } | { type: 'next' };

describe('proxy', () => {
  const jwtVerifyMock = jwtVerify as jest.MockedFunction<typeof jwtVerify>;

  const createRequest = (pathname: string, token?: string) =>
    ({
      nextUrl: new URL(`http://localhost${pathname}`),
      url: `http://localhost${pathname}`,
      cookies: {
        get: (name: string) => (name === 'access_token' && token ? { value: token } : undefined),
      },
    }) as unknown as NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    global.TextEncoder = TextEncoder as typeof global.TextEncoder;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  it('allows login page even when a locally valid token cookie exists', async () => {
    const response = (await proxy(createRequest('/login', 'valid-token'))) as unknown as MockResponse;

    expect(response).toEqual({ type: 'next' });
    expect(jwtVerifyMock).not.toHaveBeenCalled();
  });

  it('allows unauthenticated users to access login', async () => {
    const response = (await proxy(createRequest('/login'))) as unknown as MockResponse;

    expect(response).toEqual({ type: 'next' });
  });

  it('redirects unauthenticated users from protected routes', async () => {
    const response = (await proxy(createRequest('/attendance'))) as unknown as MockResponse;

    expect(response).toEqual({
      type: 'redirect',
      url: 'http://localhost/login?returnUrl=%2Fattendance',
    });
  });

  it('redirects users with invalid tokens from protected routes', async () => {
    jwtVerifyMock.mockRejectedValueOnce(new Error('Invalid token'));

    const response = (await proxy(createRequest('/attendance', 'bad-token'))) as unknown as MockResponse;

    expect(response).toEqual({
      type: 'redirect',
      url: 'http://localhost/login?returnUrl=%2Fattendance',
    });
  });
});
