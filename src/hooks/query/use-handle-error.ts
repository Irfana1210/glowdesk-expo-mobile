import { useEffect, useRef } from "react";

import { ReportingUtils } from "@/utils/reporting-utils";

export type UseHandleError<TError = Error> = {
  error: TError | null;
  onError?: (error: TError) => void | Promise<void>;
};

/** Reports a query or mutation error once per occurrence and forwards it to an optional handler. */
export function useHandleError<TError = Error>({
  onError,
  error,
}: UseHandleError<TError>) {
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (error) {
      ReportingUtils.reportError(error);
      void onErrorRef.current?.(error);
    }
  }, [error]);
}
