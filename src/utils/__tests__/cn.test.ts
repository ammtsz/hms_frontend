import { cn } from "../cn";

describe("cn", () => {
  it("joins string classes", () => {
    expect(cn("base", "extra")).toBe("base extra");
  });

  it("ignores empty values", () => {
    expect(cn("base", false, null, undefined, "")).toBe("base");
  });

  it("includes object keys when their value is truthy", () => {
    expect(
      cn("base", {
        enabled: true,
        disabled: false,
        hidden: null,
      }),
    ).toBe("base enabled");
  });
});
