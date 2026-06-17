import { translateErrorMessage } from "../errorTranslations";

describe("translateErrorMessage", () => {
  describe("Rate limiting error messages", () => {
    it("translates remaining attempts message to Portuguese", () => {
      const error = "Current password is incorrect. 3 attempt(s) remaining.";
      const result = translateErrorMessage(error);
      expect(result).toBe(
        "Senha atual incorreta. 3 tentativa(s) restante(s).",
      );
    });

    it("translates lockout message to Portuguese", () => {
      const error =
        "Too many failed password change attempts. Your account has been locked for 15 minutes.";
      const result = translateErrorMessage(error);
      expect(result).toBe(
        "Muitas tentativas de alteração de senha falharam. Sua conta foi bloqueada por 15 minutos.",
      );
    });

    it("translates wait time message to Portuguese", () => {
      const error =
        "Too many failed password change attempts. Please try again in 10 minute(s).";
      const result = translateErrorMessage(error);
      expect(result).toBe(
        "Muitas tentativas de alteração de senha falharam. Tente novamente em 10 minuto(s).",
      );
    });

    it("translates incorrect password message to Portuguese", () => {
      const error = "Current password is incorrect";
      const result = translateErrorMessage(error);
      expect(result).toBe("Senha atual incorreta.");
    });

    it("handles different attempt counts correctly", () => {
      const error1 = "Current password is incorrect. 1 attempt(s) remaining.";
      const result1 = translateErrorMessage(error1);
      expect(result1).toBe("Senha atual incorreta. 1 tentativa(s) restante(s).");

      const error5 = "Current password is incorrect. 5 attempt(s) remaining.";
      const result5 = translateErrorMessage(error5);
      expect(result5).toBe("Senha atual incorreta. 5 tentativa(s) restante(s).");
    });

    it("handles different lockout durations correctly", () => {
      const error5 =
        "Too many failed password change attempts. Your account has been locked for 5 minutes.";
      const result5 = translateErrorMessage(error5);
      expect(result5).toBe(
        "Muitas tentativas de alteração de senha falharam. Sua conta foi bloqueada por 5 minutos.",
      );

      const error30 =
        "Too many failed password change attempts. Your account has been locked for 30 minutes.";
      const result30 = translateErrorMessage(error30);
      expect(result30).toBe(
        "Muitas tentativas de alteração de senha falharam. Sua conta foi bloqueada por 30 minutos.",
      );
    });

    it("handles different wait times correctly", () => {
      const error1 =
        "Too many failed password change attempts. Please try again in 1 minute(s).";
      const result1 = translateErrorMessage(error1);
      expect(result1).toBe(
        "Muitas tentativas de alteração de senha falharam. Tente novamente em 1 minuto(s).",
      );

      const error15 =
        "Too many failed password change attempts. Please try again in 15 minute(s).";
      const result15 = translateErrorMessage(error15);
      expect(result15).toBe(
        "Muitas tentativas de alteração de senha falharam. Tente novamente em 15 minuto(s).",
      );
    });
  });

  describe("Fallback behavior", () => {
    it("returns original message when no translation match", () => {
      const error = "Some unknown error message";
      const result = translateErrorMessage(error);
      expect(result).toBe("Some unknown error message");
    });

    it("handles empty strings", () => {
      const error = "";
      const result = translateErrorMessage(error);
      expect(result).toBe("");
    });

    it("handles partial matches gracefully", () => {
      // Messages that don't fully match the expected pattern
      const error1 = "Current password is wrong"; // Missing "incorrect"
      const result1 = translateErrorMessage(error1);
      expect(result1).toBe("Current password is wrong");

      const error2 = "locked for minutes"; // Missing number
      const result2 = translateErrorMessage(error2);
      expect(result2).toBe("locked for minutes");

      const error3 = "attempt(s) remaining"; // Missing number
      const result3 = translateErrorMessage(error3);
      expect(result3).toBe("attempt(s) remaining");
    });
  });
});
