import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { transformKeys } from '@/utils/caseConverters';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from './authCookieOptions';
import { getBackendUrl } from './getBackendUrl';
import { getBffSecretHeaders } from './getBffSecretHeaders';

// Server-only backend URL (H3): uses private API_URL, never exposes NEXT_PUBLIC_API_URL
const BACKEND_URL = getBackendUrl();

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function clearAuthCookies(cookieStore: CookieStore): void {
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}

function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ message: 'Authentication required' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } },
  );
}

/**
 * Refresh the access token using the refresh_token cookie.
 * Backend reads refresh_token from Cookie header (not JSON body).
 */
async function refreshAccessToken(
  cookieStore: CookieStore,
): Promise<string | null> {
  const refreshToken = cookieStore.get('refresh_token')?.value;
  if (!refreshToken) {
    return null;
  }

  const refreshResponse = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `refresh_token=${refreshToken}`,
      ...getBffSecretHeaders(),
    },
  });

  if (!refreshResponse.ok) {
    return null;
  }

  const data = await refreshResponse.json();
  const transformed = transformKeys.toCamelCase(data) as {
    accessToken?: string;
    refreshToken?: string;
  };
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = transformed;

  if (!newAccessToken || !newRefreshToken) {
    console.error('[API Proxy] Refresh response missing rotated tokens');
    return null;
  }

  cookieStore.set('access_token', newAccessToken, getAccessTokenCookieOptions());
  cookieStore.set('refresh_token', newRefreshToken, getRefreshTokenCookieOptions());

  return newAccessToken;
}

/**
 * Secure backend request utility
 * Handles authentication via cookies server-side
 * Automatically refreshes tokens when needed
 */
export async function backendRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('access_token')?.value;

    // Attempt refresh when access token is missing but refresh token exists
    if (!accessToken) {
      accessToken = (await refreshAccessToken(cookieStore)) ?? undefined;
    }

    if (!accessToken) {
      clearAuthCookies(cookieStore);
      return unauthorizedResponse();
    }

    const makeRequest = (token: string) =>
      fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

    let response = await makeRequest(accessToken);

    // If 401, try to refresh token and retry once
    if (response.status === 401) {
      const newAccessToken = await refreshAccessToken(cookieStore);
      if (newAccessToken) {
        response = await makeRequest(newAccessToken);
      }
    }

    // Stale or revoked session (e.g. after DB reset) — drop cookies so proxy/axios don't loop
    if (response.status === 401) {
      clearAuthCookies(cookieStore);
    }

    return response;
  } catch (error) {
    console.error('[API Proxy] Request failed:', error);
    return new Response(
      JSON.stringify({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Proxy a Next.js API request to the backend
 * Automatically handles authentication and token refresh
 */
export async function proxyToBackend(
  request: NextRequest,
  endpoint: string
): Promise<Response> {
  try {
    const method = request.method;
    const body = method === 'GET' ? undefined : await request.text();

    const response = await backendRequest(endpoint, {
      method,
      body,
    });

    // Handle responses that should not have a body per HTTP spec
    if (response.status === 204 || response.status === 304 || method === 'HEAD') {
      return new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const responseBody = await response.text();

    // Transform snake_case to camelCase (matching axios interceptor behavior)
    let transformedBody = responseBody;
    if (responseBody && response.headers.get('content-type')?.includes('application/json')) {
      try {
        const parsed = JSON.parse(responseBody);
        const transformed = transformKeys.toCamelCase(parsed);
        transformedBody = JSON.stringify(transformed);
      } catch (e) {
        // If parsing fails, return original body
        console.warn('[API Proxy] Failed to transform response:', e);
      }
    }

    // Return the response with proper headers
    return new Response(transformedBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[API Proxy] Proxy failed:', error);
    return new Response(
      JSON.stringify({
        message: 'Proxy error',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
