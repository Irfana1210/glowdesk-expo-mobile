import { useEffect, useRef } from "react";

import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import { ReportingUtils } from "@/utils/reporting-utils";

type UseHandleError<TError = Error> = {
  error: TError | null;
  onError?: (error: TError) => void | Promise<void>;
};

/**
 * `useQuery` with error reporting. Never call `useQuery` directly. Add `useSafeMutation` and
 * `useSafeInfiniteQuery` alongside the first server mutation or paged list.
 */
export function useSafeQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError> &
    Pick<UseHandleError<TError>, "onError">,
): UseQueryResult<TData, TError> {
  const { onError, ...queryOptions } = options;
  const query = useQuery<TData, TError>(queryOptions);
  useHandleError({ error: query.error, onError });

  return query;
}

function useHandleError<TError = Error>({
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
