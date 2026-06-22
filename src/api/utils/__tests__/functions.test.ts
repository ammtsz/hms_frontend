import { AxiosError } from 'axios';
import {
  getErrorMessage,
  getApiErrorMessage,
  resolveClientErrorMessage,
} from '../functions';
import { ERROR_MESSAGE, CLIENT_ERROR_MESSAGE } from '../messages';

describe('getErrorMessage', () => {
  it('returns BAD_REQUEST for 400', () => {
    expect(getErrorMessage(400)).toBe(ERROR_MESSAGE.BAD_REQUEST);
  });

  it('returns UNAUTHORIZED for 401', () => {
    expect(getErrorMessage(401)).toBe(ERROR_MESSAGE.UNAUTHORIZED);
  });

  it('returns NOT_FOUND for 404', () => {
    expect(getErrorMessage(404)).toBe(ERROR_MESSAGE.NOT_FOUND);
  });

  it('returns conflict message for 409', () => {
    expect(getErrorMessage(409)).toBe(ERROR_MESSAGE.CONFLICT);
  });

  it('returns INTERNAL_SERVER_ERROR for 500', () => {
    expect(getErrorMessage(500)).toContain(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  });

  it('returns INTERNAL_SERVER_ERROR for unknown status', () => {
    expect(getErrorMessage(503)).toContain(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  });

  it('returns INTERNAL_SERVER_ERROR when no status', () => {
    expect(getErrorMessage(undefined)).toContain(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  });
});

describe('resolveClientErrorMessage – M6 shared resolver', () => {
  it('returns rate-limit message for 429', () => {
    expect(resolveClientErrorMessage(429)).toBe(CLIENT_ERROR_MESSAGE.RATE_LIMIT);
  });

  it('returns rate-limit message when backend message mentions ThrottlerException', () => {
    expect(
      resolveClientErrorMessage(401, { message: 'ThrottlerException: Too Many Requests' }),
    ).toBe(CLIENT_ERROR_MESSAGE.RATE_LIMIT);
  });

  it('returns generic message for array backend messages (no join to client)', () => {
    expect(resolveClientErrorMessage(400, { message: ['a', 'b'] })).toBe(
      ERROR_MESSAGE.BAD_REQUEST,
    );
  });

  it('uses fallback401 when login fails without a safe message', () => {
    expect(
      resolveClientErrorMessage(401, {}, { fallback401: 'Invalid username or password' }),
    ).toBe(ERROR_MESSAGE.LOGIN_FAILED);
  });
});

describe('getApiErrorMessage – M6 centralized error mapping', () => {
  function makeAxiosError(
    status?: number,
    message?: string,
    responseStatus?: number,
  ): AxiosError<{ message?: string }> {
    const err = new Error('test') as AxiosError<{ message?: string }>;
    err.isAxiosError = true;
    (err as unknown as Record<string, unknown>).status = status;
    if (responseStatus !== undefined || message !== undefined) {
      (err as unknown as Record<string, unknown>).response = {
        status: responseStatus ?? status,
        data: message ? { message } : {},
      };
    }
    return err;
  }

  it('returns generic message for 422 validation errors (no raw backend data)', () => {
    const err = makeAxiosError(422);
    expect(getApiErrorMessage(err)).toBe(CLIENT_ERROR_MESSAGE.VALIDATION);
  });

  it('returns generic message for 500 server errors', () => {
    const err = makeAxiosError(500, 'pg error: relation does not exist');
    expect(getApiErrorMessage(err)).toContain(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  });

  it('returns generic message for 502 even with a body', () => {
    const err = makeAxiosError(502, 'Bad gateway');
    expect(getApiErrorMessage(err)).toContain(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  });

  it('shows short 4xx backend message for domain/business errors', () => {
    const err = makeAxiosError(409, 'Email is already in use', 409);
    expect(getApiErrorMessage(err)).toBe('Email is already in use');
  });

  it('does NOT show a message longer than 200 chars', () => {
    const longMessage = 'A'.repeat(201);
    const err = makeAxiosError(400, longMessage, 400);
    // Falls back to generic because message is too long
    expect(getApiErrorMessage(err)).toBe(ERROR_MESSAGE.BAD_REQUEST);
  });

  it('does NOT expose raw PG errors (5xx status)', () => {
    const err = makeAxiosError(500, 'ERROR: duplicate key value violates unique constraint "hms_user_email_key"');
    const msg = getApiErrorMessage(err);
    expect(msg).not.toContain('hms_user');
    expect(msg).not.toContain('duplicate key');
  });

  it('returns generic message when status is undefined', () => {
    const err = makeAxiosError(undefined);
    expect(getApiErrorMessage(err)).toContain(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  });

  it('falls back to error.status when error.response is absent', () => {
    const err = makeAxiosError(404);
    expect(getApiErrorMessage(err)).toBe(ERROR_MESSAGE.NOT_FOUND);
  });
});
