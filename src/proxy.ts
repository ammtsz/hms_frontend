import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Validate access token locally using jose library
 * This is much faster than making HTTP requests to the backend
 * Returns true if token is valid and not expired, false otherwise
 */
async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    if (!secret || !process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return false;
    }

    // Verify the token signature and expiration
    await jwtVerify(accessToken, secret);

    // Token is valid and not expired
    return true;
  } catch (error) {
    // Token is invalid, expired, or malformed
    console.error('JWT validation failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Proxy for route protection
 * Validates JWT tokens and redirects accordingly
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Login page: do not redirect based on local JWT signature alone.
  // Stale cookies after DB reset can pass signature check but fail backend auth,
  // causing an infinite loop with the axios 401 → /login redirect.
  // LoginPageContent redirects only after /api/auth/me succeeds.

  // If trying to access protected route, validate token
  if (!isPublicRoute) {
    if (!accessToken) {
      // No token at all, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate the token
    const isValid = await validateAccessToken(accessToken);
    if (!isValid) {
      // Token exists but is invalid/expired, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow request to proceed
  return NextResponse.next();
}

/**
 * Configure which routes the proxy should run on
 * Exclude static files, API routes, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     * - api routes (server-side proxy routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
