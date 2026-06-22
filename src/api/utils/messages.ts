export const ERROR_MESSAGE = {
  LOGIN_FAILED: 'Invalid username or password',
  UNAUTHORIZED: 'Sign in to continue',
  INTERNAL_SERVER_ERROR: 'Internal server error, please try again later',
  NOT_FOUND: 'Resource not found',
  PATIENT_NOT_FOUND: 'Patient not found',
  BAD_REQUEST: 'Invalid request',
  CONFLICT: 'Record already exists or there is a data conflict.',
} as const;

export const CLIENT_ERROR_MESSAGE = {
  VALIDATION: 'Please verify the information provided and try again.',
  RATE_LIMIT:
    'Too many login attempts. Please wait a few minutes and try again.',
} as const;