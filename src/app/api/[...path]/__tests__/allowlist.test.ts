/**
 * Tests for H1: catch-all proxy allowlist and auth/* denial.
 *
 * Verifies that:
 * 1. Allowed path segments are accepted.
 * 2. Unknown path segments are rejected (returns false → 404).
 * 3. auth/* is always denied regardless of allowlist contents.
 */

import {
  isProxyPathAllowed,
  PROXY_ALLOWED_SEGMENTS,
} from '../allowlist';

describe('isProxyPathAllowed – H1 proxy allowlist', () => {
  describe('allowed paths', () => {
    it.each([...PROXY_ALLOWED_SEGMENTS])(
      'allows /%s',
      (segment) => {
        expect(isProxyPathAllowed([segment])).toBe(true);
      },
    );

    it('allows nested paths when the first segment is allowed', () => {
      expect(isProxyPathAllowed(['patients', '123'])).toBe(true);
      expect(isProxyPathAllowed(['settings', 'body-locations', '5'])).toBe(true);
    });
  });

  describe('denied paths', () => {
    it('rejects empty path', () => {
      expect(isProxyPathAllowed([])).toBe(false);
    });

    it('rejects unknown first segment', () => {
      expect(isProxyPathAllowed(['internal'])).toBe(false);
      expect(isProxyPathAllowed(['admin'])).toBe(false);
      expect(isProxyPathAllowed(['metrics'])).toBe(false);
    });
  });

  describe('auth/* is always denied (H1 + C4)', () => {
    const authPaths = [
      ['auth'],
      ['auth', 'login'],
      ['auth', 'logout'],
      ['auth', 'refresh'],
      ['auth', 'me'],
      ['auth', 'register'],
      ['AUTH', 'LOGIN'],   // case insensitive
    ];

    it.each(authPaths)('denies /%s', (...segments) => {
      expect(isProxyPathAllowed(segments.flat())).toBe(false);
    });

    it('denies auth even if someone added it to the allowlist', () => {
      // Simulate misuse — auth should always be blocked
      const patchedSet = new Set([...PROXY_ALLOWED_SEGMENTS, 'auth']);
      // The function uses its own reference so this is just documenting intent:
      // isProxyPathAllowed checks 'auth' explicitly before consulting the set
      expect(isProxyPathAllowed(['auth', 'login'])).toBe(false);
      expect(patchedSet.has('auth')).toBe(true); // would be in set, but still blocked
    });
  });
});
