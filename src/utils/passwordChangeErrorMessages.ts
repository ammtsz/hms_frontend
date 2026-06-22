/** Client-side normalization for backend password-change error messages */
export const PASSWORD_CHANGE_ERROR_MESSAGES = {
  incorrectPassword: "Current password is incorrect.",
  defaultSubmitError: "Error changing password",
  remainingAttempts: (remaining: string | number) =>
    `Current password is incorrect. ${remaining} attempt(s) remaining.`,
  accountLocked: (minutes: string | number) =>
    `Too many failed password change attempts. Your account has been locked for ${minutes} minutes.`,
  tryAgainIn: (minutes: string | number) =>
    `Too many failed password change attempts. Please try again in ${minutes} minute(s).`,
} as const;

export function normalizePasswordChangeErrorMessage(
  errorMessage: string,
): string {
  if (errorMessage.includes("attempt(s) remaining")) {
    const match = errorMessage.match(/(\d+) attempt\(s\) remaining/);
    if (match) {
      return PASSWORD_CHANGE_ERROR_MESSAGES.remainingAttempts(match[1]);
    }
  }

  if (errorMessage.includes("locked for") && errorMessage.includes("minutes")) {
    const match = errorMessage.match(/locked for (\d+) minutes/);
    if (match) {
      return PASSWORD_CHANGE_ERROR_MESSAGES.accountLocked(match[1]);
    }
  }

  if (
    errorMessage.includes("Please try again in") &&
    errorMessage.includes("minute(s)")
  ) {
    const match = errorMessage.match(/Please try again in (\d+) minute\(s\)/);
    if (match) {
      return PASSWORD_CHANGE_ERROR_MESSAGES.tryAgainIn(match[1]);
    }
  }

  if (errorMessage.includes("Current password is incorrect")) {
    return PASSWORD_CHANGE_ERROR_MESSAGES.incorrectPassword;
  }

  return errorMessage;
}
