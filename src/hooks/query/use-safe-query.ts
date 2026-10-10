import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import { type UseHandleError, useHandleError } from "./use-handle-error";

/** `useQuery` with error reporting. Never call `useQuery` directly. */
export function useSafeQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError> &
    Pick<UseHandleError<TError>, "onError">,
): UseQueryResult<TData, TError> {
  const { onError, ...queryOptions } = options;
  const query = useQuery<TData, TError>(queryOptions);
  useHandleError({ error: query.error, onError });

  return query;
}
