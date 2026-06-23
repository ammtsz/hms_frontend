import { getSafeRedirectPath } from "../authRedirect";

describe("authRedirect", () => {
  describe("getSafeRedirectPath", () => {
    it("returns default path when returnUrl is null", () => {
      expect(getSafeRedirectPath(null, "/board")).toBe("/board");
    });

    it("returns default path when returnUrl is undefined", () => {
      expect(getSafeRedirectPath(undefined as unknown as string, "/board")).toBe(
        "/board",
      );
    });

    it("returns default path when returnUrl is empty string", () => {
      expect(getSafeRedirectPath("", "/board")).toBe("/board");
    });

    it("returns default path when returnUrl is not a string", () => {
      expect(getSafeRedirectPath(123 as unknown as string, "/board")).toBe(
        "/board",
      );
    });

    it("returns decoded returnUrl when it is a safe relative path", () => {
      expect(getSafeRedirectPath("/schedule", "/board")).toBe("/schedule");
      expect(getSafeRedirectPath("/patients", "/board")).toBe("/patients");
      expect(getSafeRedirectPath("/patients/1/edit", "/board")).toBe(
        "/patients/1/edit",
      );
    });

    it("decodes URL-encoded returnUrl", () => {
      expect(getSafeRedirectPath("%2Fschedule", "/board")).toBe("/schedule");
      expect(getSafeRedirectPath("%2Fpatients%2F1", "/board")).toBe(
        "/patients/1",
      );
    });

    it("trims whitespace from returnUrl", () => {
      expect(getSafeRedirectPath("  /schedule  ", "/board")).toBe("/schedule");
    });

    it("returns default path when returnUrl starts with // (protocol-relative)", () => {
      expect(getSafeRedirectPath("//evil.com/path", "/board")).toBe(
        "/board",
      );
    });

    it("returns default path when returnUrl does not start with /", () => {
      expect(getSafeRedirectPath("schedule", "/board")).toBe("/board");
      expect(getSafeRedirectPath("https://evil.com/", "/board")).toBe(
        "/board",
      );
    });

    it("uses custom default path", () => {
      expect(getSafeRedirectPath(null, "/force-password-change")).toBe(
        "/force-password-change",
      );
      expect(getSafeRedirectPath("/schedule", "/board")).toBe("/schedule");
    });
  });
});
