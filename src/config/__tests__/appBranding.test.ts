describe("appBranding", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses defaults when env vars are unset", async () => {
    delete process.env.NEXT_PUBLIC_APP_TITLE;
    delete process.env.NEXT_PUBLIC_APP_TAGLINE;
    delete process.env.NEXT_PUBLIC_APP_DEMO_LABEL;

    const { APP_TITLE, APP_TAGLINE, APP_DEMO_LABEL } = await import(
      "../appBranding"
    );

    expect(APP_TITLE).toBe("Treatment & Scheduling Platform");
    expect(APP_TAGLINE).toBe(
      "Appointments, treatments, and daily operations",
    );
    expect(APP_DEMO_LABEL).toBe("");
  });

  it("reads branding from env when set", async () => {
    process.env.NEXT_PUBLIC_APP_TITLE = "Custom Title";
    process.env.NEXT_PUBLIC_APP_TAGLINE = "Custom tagline";
    process.env.NEXT_PUBLIC_APP_DEMO_LABEL = "Demo instance";

    const { APP_TITLE, APP_TAGLINE, APP_DEMO_LABEL } = await import(
      "../appBranding"
    );

    expect(APP_TITLE).toBe("Custom Title");
    expect(APP_TAGLINE).toBe("Custom tagline");
    expect(APP_DEMO_LABEL).toBe("Demo instance");
  });
});
