/**
 * Tests for backend.ts token refresh via BFF proxy
 */

import { cookies } from 'next/headers';
import { backendRequest } from '../backend';
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from '../authCookieOptions';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('../getBackendUrl', () => ({
  getBackendUrl: () => 'http://localhost:3001',
}));

jest.mock('../getBffSecretHeaders', () => ({
  getBffSecretHeaders: () => ({ 'x-bff-secret': 'test-secret' }),
}));

class MockResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  private readonly bodyText: string;

  constructor(body: string | null, init?: ResponseInit) {
    this.bodyText = body ?? '';
    this.status = init?.status ?? 200;
    this.statusText = init?.statusText ?? '';
    this.headers = new Headers(init?.headers);
  }

  async text(): Promise<string> {
    return this.bodyText;
  }
}

beforeAll(() => {
  if (typeof global.Response === 'undefined') {
    global.Response = MockResponse as unknown as typeof Response;
  }
});

describe('backendRequest refresh flow', () => {
  const mockCookieSet = jest.fn();
  const mockCookieGet = jest.fn();
  const mockCookieDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockResolvedValue({
      get: mockCookieGet,
      set: mockCookieSet,
      delete: mockCookieDelete,
    });
    global.fetch = jest.fn();
  });

  it('sets both rotated cookies when refresh returns access and refresh tokens', async () => {
    mockCookieGet.mockImplementation((name: string) => {
      if (name === 'access_token') return undefined;
      if (name === 'refresh_token') return { value: 'old-refresh-token' };
      return undefined;
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ ok: true }),
      });

    const response = await backendRequest('/patients');

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3001/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Cookie: 'refresh_token=old-refresh-token',
          'x-bff-secret': 'test-secret',
        }),
      }),
    );
    expect(mockCookieSet).toHaveBeenCalledWith(
      'access_token',
      'new-access-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        maxAge: ACCESS_TOKEN_MAX_AGE,
      }),
    );
    expect(mockCookieSet).toHaveBeenCalledWith(
      'refresh_token',
      'new-refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        maxAge: REFRESH_TOKEN_MAX_AGE,
      }),
    );
  });

  it('returns 401 when refresh response omits the rotated refresh token', async () => {
    mockCookieGet.mockImplementation((name: string) => {
      if (name === 'access_token') return undefined;
      if (name === 'refresh_token') return { value: 'old-refresh-token' };
      return undefined;
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
      }),
    });

    const response = await backendRequest('/patients');

    expect(response.status).toBe(401);
    expect(mockCookieSet).not.toHaveBeenCalled();
    expect(mockCookieDelete).toHaveBeenCalledWith('access_token');
    expect(mockCookieDelete).toHaveBeenCalledWith('refresh_token');
  });

  it('clears auth cookies when backend returns 401 after failed refresh', async () => {
    mockCookieGet.mockImplementation((name: string) => {
      if (name === 'access_token') return { value: 'stale-access-token' };
      if (name === 'refresh_token') return { value: 'stale-refresh-token' };
      return undefined;
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

    const response = await backendRequest('/patients');

    expect(response.status).toBe(401);
    expect(mockCookieDelete).toHaveBeenCalledWith('access_token');
    expect(mockCookieDelete).toHaveBeenCalledWith('refresh_token');
  });
});
