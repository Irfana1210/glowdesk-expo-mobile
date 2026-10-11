import { useIsMutating } from "@tanstack/react-query";

/**
 * How many changes have not reached the server yet, including ones waiting offline. Counts keyed
 * mutations only: the data changes the app queues, not one-off requests such as sign-in.
 */
export function usePendingChangeCount(): number {
  return useIsMutating({
    predicate: (mutation) => mutation.options.mutationKey !== undefined,
  });
}
