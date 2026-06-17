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

// Server-only backend URL (H3): uses private API_URL, never exposes NEXT_PUBLIC_API_URL
const BACKEND_URL = getBackendUrl();

/**
 * Login action - authenticates user and sets HTTP-only cookies
 */
export async function loginAction(
  credentials: LoginCredentials
): Promise<ServerActionResult<User>> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
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
      return {
        success: false,
        error: resolveClientErrorMessage(response.status, errorData, {
          fallback401: 'Email ou senha inválidos',
        }),
      };
    }

    const data = await response.json();
    // Transform snake_case to camelCase (backend returns snake_case)
    const transformed = transformKeys.toCamelCase(data) as {
      accessToken: string;
      refreshToken: string;
      user: User;
    };
    const { accessToken, refreshToken, user } = transformed;

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
      error: 'Erro ao fazer login. Tente novamente.',
    };
  }
}

/**
 * Logout action - revokes tokens and clears cookies
 */
export async function logoutAction(): Promise<void> {
  try {
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

      await fetch(`${BACKEND_URL}/auth/logout`, {
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
