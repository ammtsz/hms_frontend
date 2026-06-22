import { AxiosError } from 'axios';
import { ERROR_MESSAGE, CLIENT_ERROR_MESSAGE } from './messages';

export const getErrorMessage = (status?: number): string => {
  if (status) {
    switch (status) {
      case 400:
        return ERROR_MESSAGE.BAD_REQUEST;
      case 401:
        return ERROR_MESSAGE.UNAUTHORIZED;
      case 404:
        return ERROR_MESSAGE.NOT_FOUND;
      case 409:
        return ERROR_MESSAGE.CONFLICT;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGE.INTERNAL_SERVER_ERROR;
      default:
        return ERROR_MESSAGE.INTERNAL_SERVER_ERROR;
    }
  } else {
    return ERROR_MESSAGE.INTERNAL_SERVER_ERROR;
  }
};

const VALIDATION_ERROR_MESSAGE = CLIENT_ERROR_MESSAGE.VALIDATION;

const RATE_LIMIT_MESSAGE = CLIENT_ERROR_MESSAGE.RATE_LIMIT;

export type ClientErrorBody = {
  message?: string | string[];
};

function isRateLimitMessage(message: string): boolean {
  return (
    message.includes('ThrottlerException') ||
    message.includes('Too Many Requests')
  );
}

function extractSafeBackendMessage(
  message: string | string[] | undefined,
): string | undefined {
  if (typeof message === 'string') {
    if (isRateLimitMessage(message)) {
      return undefined;
    }
    return message.length > 0 && message.length <= 200 ? message : undefined;
  }

  // Never surface validation arrays as a single client string (M6).
  return undefined;
}

export type ResolveClientErrorOptions = {
  /** Used when status is 401 and no safe backend message is present (e.g. login). */
  fallback401?: string;
};

/**
 * Shared client-facing error resolver (M6).
 * Used by axios helpers and Server Actions (fetch).
 */
export function resolveClientErrorMessage(
  status?: number,
  data?: ClientErrorBody,
  options?: ResolveClientErrorOptions,
): string {
  if (status === 429) {
    return RATE_LIMIT_MESSAGE;
  }

  const rawMessage = data?.message;
  if (
    typeof rawMessage === 'string' &&
    isRateLimitMessage(rawMessage)
  ) {
    return RATE_LIMIT_MESSAGE;
  }

  if (status === 422) {
    return VALIDATION_ERROR_MESSAGE;
  }

  const safeMessage = extractSafeBackendMessage(rawMessage);
  if (status && status >= 400 && status < 500 && safeMessage) {
    return safeMessage;
  }

  if (status === 401 && options?.fallback401) {
    return options.fallback401;
  }

  return getErrorMessage(status);
}

/**
 * Centralized API error message resolver (M6).
 */
export function getApiErrorMessage(
  error: AxiosError<{ message?: string | string[] }>,
): string {
  const status =
    error.response?.status ?? (error as { status?: number }).status;
  return resolveClientErrorMessage(status, error.response?.data);
}
