import {
  QUEUED_CHANGE_MAX_RETRY_MS,
  QUEUED_CHANGE_RETRIES,
  QUEUED_CHANGE_RETRY_MS,
} from "@/constants/primitives";

import { isTransientError } from "@/types/api-error";

export namespace MutationRetryUtils {
  /**
   * Retry settings for queued changes. A temporary failure (server error, dropped connection) is
   * retried with a growing delay before anything queued after it is sent. Conflicts and validation
   * errors are final and roll back straight away.
   */
  export const queued = {
    retry: (failures: number, error: unknown) =>
      isTransientError(error) && failures < QUEUED_CHANGE_RETRIES,
    retryDelay: (attempt: number) =>
      Math.min(
        QUEUED_CHANGE_RETRY_MS * 2 ** attempt,
        QUEUED_CHANGE_MAX_RETRY_MS,
      ),
  };
}
