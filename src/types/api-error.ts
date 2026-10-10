/** Error codes the API contract can return. The mock server and a real backend share them. */
type ApiErrorCode =
  | "ACCOUNT_INACTIVE"
  | "INVALID_CREDENTIALS"
  | "NETWORK"
  | "NOT_FOUND"
  | "SESSION_EXPIRED"
  | "UNKNOWN"
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
