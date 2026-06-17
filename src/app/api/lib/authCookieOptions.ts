/** Shared httpOnly cookie options — BFF is the sole cookie owner for the browser. */

export const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 8; // 8 hours
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getBaseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  };
}

export function getAccessTokenCookieOptions() {
  return {
    ...getBaseCookieOptions(),
    maxAge: ACCESS_TOKEN_MAX_AGE,
  };
}

export function getRefreshTokenCookieOptions() {
  return {
    ...getBaseCookieOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE,
  };
}
