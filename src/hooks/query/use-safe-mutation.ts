import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

import { useHandleError } from "./use-handle-error";

/**
 * `useMutation` with error reporting. Never call `useMutation` directly.
 * `onError` runs for each failure, in addition to TanStack's own `onError` callback.
 */
export function useSafeMutation<
  TData,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const mutation = useMutation<TData, TError, TVariables, TContext>(options);
  useHandleError<TError>({ error: mutation.error });

  return mutation;
}
