/**
 * Tests for H3: server-only getBackendUrl helper.
 * Verifies that NEXT_PUBLIC_API_URL is never used for server-side calls.
 */

describe("getBackendUrl – H3 server-only URL", () => {
  const originalEnv = process.env;
  let restoreNodeEnv: (() => void) | undefined;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    restoreNodeEnv?.();
    restoreNodeEnv = undefined;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function setNodeEnv(value: "development" | "production" | "test"): void {
    restoreNodeEnv?.();
    restoreNodeEnv = jest.replaceProperty(
      process.env,
      "NODE_ENV",
      value,
    ).restore;
  }

  function setProductionServerPhase(): void {
    process.env.NEXT_PHASE = "phase-production-server";
  }

  it("returns API_URL when set", async () => {
    process.env.API_URL = "https://api.example.com";
    delete process.env.NEXT_PUBLIC_API_URL;
    const { getBackendUrl } = await import("../getBackendUrl");
    expect(getBackendUrl()).toBe("https://api.example.com");
  });

  it("uses API_URL even when NEXT_PUBLIC_API_URL is also set", async () => {
    process.env.API_URL = "https://private.example.com";
    process.env.NEXT_PUBLIC_API_URL = "https://public.example.com";
    const { getBackendUrl } = await import("../getBackendUrl");
    expect(getBackendUrl()).toBe("https://private.example.com");
  });

  it("falls back to localhost in development when API_URL is absent", async () => {
    delete process.env.API_URL;
    setNodeEnv("development");
    const { getBackendUrl } = await import("../getBackendUrl");
    expect(getBackendUrl()).toBe("http://localhost:3002");
  });

  it("falls back to localhost in test environment when API_URL is absent", async () => {
    delete process.env.API_URL;
    setNodeEnv("test");
    const { getBackendUrl } = await import("../getBackendUrl");
    expect(getBackendUrl()).toBe("http://localhost:3002");
  });

  it("throws in production when API_URL is absent", async () => {
    delete process.env.API_URL;
    setNodeEnv("production");
    setProductionServerPhase();
    const { getBackendUrl } = await import("../getBackendUrl");
    expect(() => getBackendUrl()).toThrow(
      "API_URL environment variable must be set in production",
    );
  });

  it("never reads NEXT_PUBLIC_API_URL", async () => {
    delete process.env.API_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://should-not-be-used.example.com";
    setNodeEnv("development");
    const { getBackendUrl } = await import("../getBackendUrl");
    const url = getBackendUrl();
    expect(url).not.toBe("https://should-not-be-used.example.com");
    expect(url).toBe("http://localhost:3002");
  });

  it("strips trailing slashes from API_URL", async () => {
    process.env.API_URL = "https://api.example.com/";
    setNodeEnv("production");
    setProductionServerPhase();
    const { getBackendUrl } = await import("../getBackendUrl");
    expect(getBackendUrl()).toBe("https://api.example.com");
  });

  it("rejects railway.internal hostnames in production", async () => {
    process.env.API_URL = "https://postgres.railway.internal:5432";
    setNodeEnv("production");
    setProductionServerPhase();
    const { getBackendUrl } = await import("../getBackendUrl");
    expect(() => getBackendUrl()).toThrow("public Railway backend URL");
  });

  it("rejects localhost API_URL in production", async () => {
    process.env.API_URL = "http://localhost:3002";
    setNodeEnv("production");
    setProductionServerPhase();
    const { getBackendUrl } = await import("../getBackendUrl");
    expect(() => getBackendUrl()).toThrow("cannot point to localhost");
  });

  it("allows localhost API_URL during production build", async () => {
    process.env.API_URL = "http://localhost:3002";
    setNodeEnv("production");
    process.env.NEXT_PHASE = "phase-production-build";
    const { getBackendUrl } = await import("../getBackendUrl");
    expect(getBackendUrl()).toBe("http://localhost:3002");
  });
});
