import {
  normalizePasswordChangeErrorMessage,
  PASSWORD_CHANGE_ERROR_MESSAGES,
} from "../passwordChangeErrorMessages";

describe("normalizePasswordChangeErrorMessage", () => {
  describe("password change rate-limit messages", () => {
    it("normalizes remaining attempts message", () => {
      const error = "Current password is incorrect. 3 attempt(s) remaining.";
      expect(normalizePasswordChangeErrorMessage(error)).toBe(
        PASSWORD_CHANGE_ERROR_MESSAGES.remainingAttempts(3),
      );
    });

    it("normalizes lockout message", () => {
      const error =
        "Too many failed password change attempts. Your account has been locked for 15 minutes.";
      expect(normalizePasswordChangeErrorMessage(error)).toBe(
        PASSWORD_CHANGE_ERROR_MESSAGES.accountLocked(15),
      );
    });

    it("normalizes wait time message", () => {
      const error =
        "Too many failed password change attempts. Please try again in 10 minute(s).";
      expect(normalizePasswordChangeErrorMessage(error)).toBe(
        PASSWORD_CHANGE_ERROR_MESSAGES.tryAgainIn(10),
      );
    });

    it("normalizes incorrect password message without trailing period", () => {
      expect(
        normalizePasswordChangeErrorMessage("Current password is incorrect"),
      ).toBe(PASSWORD_CHANGE_ERROR_MESSAGES.incorrectPassword);
    });

    it("handles different attempt counts correctly", () => {
      expect(
        normalizePasswordChangeErrorMessage(
          "Current password is incorrect. 1 attempt(s) remaining.",
        ),
      ).toBe(PASSWORD_CHANGE_ERROR_MESSAGES.remainingAttempts(1));

      expect(
        normalizePasswordChangeErrorMessage(
          "Current password is incorrect. 5 attempt(s) remaining.",
        ),
      ).toBe(PASSWORD_CHANGE_ERROR_MESSAGES.remainingAttempts(5));
    });
  });

  describe("fallback behavior", () => {
    it("returns original message when no normalization match", () => {
      expect(normalizePasswordChangeErrorMessage("Some unknown error message")).toBe(
        "Some unknown error message",
      );
    });

    it("handles empty strings", () => {
      expect(normalizePasswordChangeErrorMessage("")).toBe("");
    });

    it("handles partial matches gracefully", () => {
      expect(normalizePasswordChangeErrorMessage("Current password is wrong")).toBe(
        "Current password is wrong",
      );
    });
  });
});
