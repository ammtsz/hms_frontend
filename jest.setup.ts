import '@testing-library/jest-dom';
import React from 'react';

// next/image validates src in tests; map static imports to plain <img>
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt,
    ...rest
  }: {
    src: string | { src?: string };
    alt: string;
    [key: string]: unknown;
  }) {
    const resolvedSrc =
      typeof src === 'string'
        ? src
        : typeof src === 'object' &&
            src !== null &&
            'src' in src &&
            typeof (src as { src?: string }).src === 'string'
          ? (src as { src: string }).src
          : '/mock-image.png';
    return React.createElement('img', {
      src: resolvedSrc,
      alt,
      ...rest,
    });
  },
}));

// App Router hooks (tests render components outside Next.js)
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/attendance'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Setup global test utilities
beforeEach(() => {
  jest.clearAllMocks();
});
