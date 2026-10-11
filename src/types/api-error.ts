/** Error codes the API contract can return. The mock server and a real backend share them. */
type ApiErrorCode =
  | "ACCOUNT_INACTIVE"
  | "FORBIDDEN"
  | "INVALID_CREDENTIALS"
  | "NETWORK"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "SESSION_EXPIRED"
  | "UNKNOWN"
  | "VALIDATION"
  | "VERSION_CONFLICT";

/** A failed API call, with a stable code the UI can map to copy. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

/**
 * A failure worth trying again: the server or the connection had a problem, not the change.
 * Conflicts and validation errors are final, because sending the same change again cannot work.
 */
export const isTransientError = (error: unknown): boolean =>
  isApiError(error) &&
  (error.code === "SERVER_ERROR" || error.code === "NETWORK");
