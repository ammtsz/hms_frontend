/**
 * Tests for auth.actions.ts
 * Verifies login action error handling and rate limiting messages
 */

import { loginAction, logoutAction } from '../auth.actions';
import { AUTH_ERROR_MESSAGES } from '@/utils/authFormLabels';
import { CLIENT_ERROR_MESSAGE } from '@/api/utils/messages';
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from '@/app/api/lib/authCookieOptions';

// Mock next/headers
const mockCookieSet = jest.fn();
const mockCookieDelete = jest.fn();
const mockCookieGet = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: mockCookieSet,
    get: mockCookieGet,
    delete: mockCookieDelete,
  })),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('auth.actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.BFF_INTERNAL_SECRET;
  });

  it('sends BFF secret header on login when BFF_INTERNAL_SECRET is set', async () => {
    process.env.BFF_INTERNAL_SECRET = 'local-dev-secret';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'token',
        refresh_token: 'refresh',
        user: { id: 1, email: 'a@b.com', display_name: 'A', must_change_password: false },
      }),
    });

    await loginAction({ email: 'a@b.com', password: 'password123456' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-bff-secret': 'local-dev-secret' }),
      }),
    );
  });

  describe('loginAction', () => {
    it('should return user data on successful login', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        display_name: 'Test User',
        must_change_password: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: mockUser,
        }),
      });

      const result = await loginAction({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 1,
        email: 'test@example.com',
        displayName: 'Test User',
        mustChangePassword: false,
      });
      expect(mockCookieSet).toHaveBeenCalledWith(
        'access_token',
        'mock-access-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          maxAge: ACCESS_TOKEN_MAX_AGE,
        }),
      );
      expect(mockCookieSet).toHaveBeenCalledWith(
        'refresh_token',
        'mock-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_MAX_AGE,
        }),
      );
    });

    it('should return user-friendly error message for rate limiting (429 status)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          message: 'ThrottlerException: Too Many Requests',
        }),
      });

      const result = await loginAction({
        email: 'test@example.com',
        password: 'wrong-password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(CLIENT_ERROR_MESSAGE.RATE_LIMIT);
    });

    it('should return user-friendly error message when message includes "ThrottlerException"', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'ThrottlerException: Rate limit exceeded',
        }),
      });

      const result = await loginAction({
        email: 'test@example.com',
        password: 'wrong-password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(CLIENT_ERROR_MESSAGE.RATE_LIMIT);
    });

    it('should return user-friendly error message when message includes "Too Many Requests"', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Too Many Requests',
        }),
      });

      const result = await loginAction({
        email: 'test@example.com',
        password: 'wrong-password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(CLIENT_ERROR_MESSAGE.RATE_LIMIT);
    });

    it('should return default error message for invalid credentials', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Invalid credentials',
        }),
      });

      const result = await loginAction({
        email: 'test@example.com',
        password: 'wrong-password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should return generic error message when no message is provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      const result = await loginAction({
        email: 'test@example.com',
        password: 'wrong-password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(AUTH_ERROR_MESSAGES.invalidCredentials);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await loginAction({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(AUTH_ERROR_MESSAGES.loginFailedGeneric);
    });
  });

  describe('logoutAction', () => {
    beforeEach(() => {
      mockCookieGet.mockImplementation((name: string) => {
        if (name === 'refresh_token') {
          return { value: 'refresh-token' };
        }
        return undefined;
      });
    });

    it('sends BFF secret header on logout when BFF_INTERNAL_SECRET is set', async () => {
      process.env.BFF_INTERNAL_SECRET = 'local-dev-secret';
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-bff-secret': 'local-dev-secret' }),
        }),
      );
      expect(mockCookieDelete).toHaveBeenCalledWith('access_token');
      expect(mockCookieDelete).toHaveBeenCalledWith('refresh_token');
    });
  });
});
