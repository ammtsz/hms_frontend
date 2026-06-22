import type { AxiosError } from "axios";
import {
  getResponseMessageOrFallback,
  getResponseMessageOrStatusErrorMessage,
  getStatusErrorMessageFromAxios,
  includeInactiveParams,
  PRIORITY_STATUS_MESSAGES,
  SYSTEM_OPTION_STATUS_MESSAGES,
} from "../utils";

describe("api/settings/utils", () => {
  it("includeInactiveParams returns correct query params", () => {
    expect(includeInactiveParams(true)).toEqual({ all: "true" });
    expect(includeInactiveParams(false)).toEqual({});
  });

  it("getStatusErrorMessageFromAxios maps status codes", () => {
    const error = { response: { status: 409 } } as unknown as AxiosError;
    const message = getStatusErrorMessageFromAxios(
      error,
      SYSTEM_OPTION_STATUS_MESSAGES,
    );

    expect(message).toMatch(/This name already exists|This name already exists/);
  });

  it("getResponseMessageOrStatusErrorMessage prefers response message", () => {
    const error = {
      response: { status: 404, data: { message: "Custom message" } },
    } as unknown as AxiosError<{ message?: string }>;

    const message = getResponseMessageOrStatusErrorMessage(
      error,
      PRIORITY_STATUS_MESSAGES,
    );

    expect(message).toBe("Custom message");
  });

  it("getResponseMessageOrFallback uses fallback when response message is missing", () => {
    const error = {
      response: { status: 500, data: {} },
    } as unknown as AxiosError<{ message?: string }>;

    const message = getResponseMessageOrFallback(error, "Fallback message");

    expect(message).toBe("Fallback message");
  });
});

