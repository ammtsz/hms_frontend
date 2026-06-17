import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from '../authCookieOptions';

describe('authCookieOptions', () => {
  let restoreNodeEnv: (() => void) | undefined;

  afterEach(() => {
    restoreNodeEnv?.();
    restoreNodeEnv = undefined;
  });

  function setNodeEnv(value: 'development' | 'production' | 'test'): void {
    restoreNodeEnv?.();
    restoreNodeEnv = jest.replaceProperty(process.env, 'NODE_ENV', value).restore;
  }

  it('uses strict sameSite and path for access token cookies', () => {
    setNodeEnv('development');

    expect(getAccessTokenCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
  });

  it('uses strict sameSite and path for refresh token cookies', () => {
    setNodeEnv('development');

    expect(getRefreshTokenCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  });

  it('sets secure flag in production', () => {
    setNodeEnv('production');

    expect(getAccessTokenCookieOptions().secure).toBe(true);
    expect(getRefreshTokenCookieOptions().secure).toBe(true);
  });
});
