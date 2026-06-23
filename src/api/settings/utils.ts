import type { AxiosError } from "axios";

export function includeInactiveParams(includeInactive: boolean) {
  return includeInactive ? { all: "true" } : {};
}

type StatusMessageMap = Record<number, string>;

const DEFAULT_SYSTEM_OPTION_ERROR_MESSAGE = "Error processing request";

export const SYSTEM_OPTION_STATUS_MESSAGES: StatusMessageMap = {
  409: "This name already exists",
  400: "Invalid request",
  404: "Option not found",
};

export const PRIORITY_STATUS_MESSAGES: StatusMessageMap = {
  409: "Priority is still in use",
  400: "Invalid request",
  404: "Priority not found",
};

export function getStatusErrorMessage(
  status: number | undefined,
  statusMessages: StatusMessageMap,
  defaultMessage = DEFAULT_SYSTEM_OPTION_ERROR_MESSAGE,
): string {
  if (status === undefined) return defaultMessage;
  return statusMessages[status] ?? defaultMessage;
}

export function getStatusErrorMessageFromAxios(
  error: unknown,
  statusMessages: StatusMessageMap,
  defaultMessage = DEFAULT_SYSTEM_OPTION_ERROR_MESSAGE,
): string {
  const axiosError = error as AxiosError;
  return getStatusErrorMessage(
    axiosError.response?.status,
    statusMessages,
    defaultMessage,
  );
}

export function getResponseMessageOrStatusErrorMessage(
  error: unknown,
  statusMessages: StatusMessageMap,
  defaultMessage = DEFAULT_SYSTEM_OPTION_ERROR_MESSAGE,
): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  const responseMessage = axiosError.response?.data?.message;

  if (responseMessage) return responseMessage;

  return getStatusErrorMessage(
    axiosError.response?.status,
    statusMessages,
    defaultMessage,
  );
}

export function getResponseMessageOrFallback(
  error: unknown,
  fallback: string,
): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}
