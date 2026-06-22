import { getSafeRedirectPath } from "../authRedirect";

describe("authRedirect", () => {
  describe("getSafeRedirectPath", () => {
    it("returns default path when returnUrl is null", () => {
      expect(getSafeRedirectPath(null, "/attendance")).toBe("/attendance");
    });

    it("returns default path when returnUrl is undefined", () => {
      expect(getSafeRedirectPath(undefined as unknown as string, "/attendance")).toBe(
        "/attendance",
      );
    });

    it("returns default path when returnUrl is empty string", () => {
      expect(getSafeRedirectPath("", "/attendance")).toBe("/attendance");
    });

    it("returns default path when returnUrl is not a string", () => {
      expect(getSafeRedirectPath(123 as unknown as string, "/attendance")).toBe(
        "/attendance",
      );
    });

    it("returns decoded returnUrl when it is a safe relative path", () => {
      expect(getSafeRedirectPath("/schedule", "/attendance")).toBe("/schedule");
      expect(getSafeRedirectPath("/patients", "/attendance")).toBe("/patients");
      expect(getSafeRedirectPath("/patients/1/edit", "/attendance")).toBe(
        "/patients/1/edit",
      );
    });

    it("decodes URL-encoded returnUrl", () => {
      expect(getSafeRedirectPath("%2Fschedule", "/attendance")).toBe("/schedule");
      expect(getSafeRedirectPath("%2Fpatients%2F1", "/attendance")).toBe(
        "/patients/1",
      );
    });

    it("trims whitespace from returnUrl", () => {
      expect(getSafeRedirectPath("  /schedule  ", "/attendance")).toBe("/schedule");
    });

    it("returns default path when returnUrl starts with // (protocol-relative)", () => {
      expect(getSafeRedirectPath("//evil.com/path", "/attendance")).toBe(
        "/attendance",
      );
    });

    it("returns default path when returnUrl does not start with /", () => {
      expect(getSafeRedirectPath("schedule", "/attendance")).toBe("/attendance");
      expect(getSafeRedirectPath("https://evil.com/", "/attendance")).toBe(
        "/attendance",
      );
    });

    it("uses custom default path", () => {
      expect(getSafeRedirectPath(null, "/force-password-change")).toBe(
        "/force-password-change",
      );
      expect(getSafeRedirectPath("/schedule", "/attendance")).toBe("/schedule");
    });
  });
});
