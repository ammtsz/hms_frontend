'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { transformKeys } from '@/utils/caseConverters';
import type {
  LoginCredentials,
  User,
  ServerActionResult,
} from '@/types/auth';

import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from '@/app/api/lib/authCookieOptions';
import { getBackendUrl } from '@/app/api/lib/getBackendUrl';
import { getBffSecretHeaders } from '@/app/api/lib/getBffSecretHeaders';
import {
  resolveClientErrorMessage,
  type ClientErrorBody,
} from '@/api/utils/functions';
import { AUTH_ERROR_MESSAGES } from '@/utils/authFormLabels';

/** Detailed ops messages are for development/logs only — never expose infra details in production UI. */
function isProductionLoginErrorMode(): boolean {
  return process.env.NODE_ENV === 'production';
}

function userFacingLoginError(detailedMessage: string): string {
  return isProductionLoginErrorMode()
    ? AUTH_ERROR_MESSAGES.loginFailedGeneric
    : detailedMessage;
}

function formatLoginCatchError(error: unknown): string {
  if (isProductionLoginErrorMode()) {
    return AUTH_ERROR_MESSAGES.loginFailedGeneric;
  }

  if (!(error instanceof Error)) {
    return AUTH_ERROR_MESSAGES.loginFailedGeneric;
  }

  const message = error.message;

  if (
    message.includes('API_URL') ||
    message.includes('BFF_INTERNAL_SECRET') ||
    message.includes('Login response missing tokens')
  ) {
    return message;
  }

  const cause = error.cause;
  const causeCode =
    cause &&
    typeof cause === 'object' &&
    'code' in cause &&
    typeof cause.code === 'string'
      ? cause.code
      : undefined;

  if (
    message.includes('fetch failed') ||
    causeCode === 'ENOTFOUND' ||
    causeCode === 'ECONNREFUSED' ||
    causeCode === 'ECONNRESET' ||
    causeCode === 'ETIMEDOUT'
  ) {
    return (
      'Cannot reach the backend from Vercel. Verify API_URL is the public Railway HTTPS URL ' +
      '(https://your-backend.up.railway.app), not localhost or railway.internal.'
    );
  }

  if (error instanceof SyntaxError) {
    return (
      'Backend returned an invalid login response. Verify API_URL points to the NestJS backend, ' +
      'not the database or another Railway service.'
    );
  }

  return AUTH_ERROR_MESSAGES.loginFailedGeneric;
}

/**
 * Login action - authenticates user and sets HTTP-only cookies
 */
export async function loginAction(
  credentials: LoginCredentials
): Promise<ServerActionResult<User>> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getBffSecretHeaders(),
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as ClientErrorBody;
      const backendMessage =
        typeof errorData.message === 'string' ? errorData.message : undefined;

      // BffSecretGuard returns 401 "Unauthorized" — distinct from bad credentials
      if (
        response.status === 401 &&
        backendMessage === 'Unauthorized'
      ) {
        return {
          success: false,
          error: userFacingLoginError(
            'Login blocked by backend security check. Verify BFF_INTERNAL_SECRET matches on Vercel and Railway, then redeploy both services.',
          ),
        };
      }

      return {
        success: false,
        error: resolveClientErrorMessage(response.status, errorData, {
          fallback401: AUTH_ERROR_MESSAGES.invalidCredentials,
        }),
      };
    }

    const data = await response.json();
    // Transform snake_case to camelCase (backend returns snake_case)
    const transformed = transformKeys.toCamelCase(data) as {
      accessToken?: string;
      refreshToken?: string;
      user?: User;
    };
    const { accessToken, refreshToken, user } = transformed;

    if (!accessToken || !refreshToken || !user) {
      console.error('Login response missing tokens or user', {
        hasAccessToken: Boolean(accessToken),
        hasRefreshToken: Boolean(refreshToken),
        hasUser: Boolean(user),
      });
      throw new Error(
        'Login response missing tokens. Verify API_URL points to the NestJS backend.',
      );
    }

    // Store tokens in HTTP-only cookies (secure, not accessible to JavaScript)
    const cookieStore = await cookies();

    cookieStore.set('access_token', accessToken, getAccessTokenCookieOptions());
    cookieStore.set('refresh_token', refreshToken, getRefreshTokenCookieOptions());

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('Login error:', error);

    return {
      success: false,
      error: formatLoginCatchError(error),
    };
  }
}

/**
 * Logout action - revokes tokens and clears cookies
 */
export async function logoutAction(): Promise<void> {
  try {
    const backendUrl = getBackendUrl();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    // Call backend to revoke refresh token (backend reads from cookies)
    if (accessToken || refreshToken) {
      // Create cookie header string to send to backend
      const cookieHeader = [
        accessToken ? `access_token=${accessToken}` : '',
        refreshToken ? `refresh_token=${refreshToken}` : '',
      ]
        .filter(Boolean)
        .join('; ');

      await fetch(`${backendUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
          ...getBffSecretHeaders(),
        },
      }).catch((error) => {
        console.error('Logout error:', error);
        // Continue even if backend call fails
      });
    }

    // Clear cookies
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
  } catch (error) {
    console.error('Logout error:', error);
  }

  // Redirect to login page
  redirect('/login');
}

/**
 * Check if user is authenticated
 * Now uses the secure API proxy route
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}
