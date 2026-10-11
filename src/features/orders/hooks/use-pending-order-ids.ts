import { useMutationState } from "@tanstack/react-query";

import { OrderMutations, type OrderUpdateVariables } from "./order-mutations";

/** IDs of orders with changes that have not reached the server yet. */
export function usePendingOrderIds(): Array<string> {
  return useMutationState({
    filters: { mutationKey: OrderMutations.QUEUED_KEY, status: "pending" },
    select: (mutation) =>
      (mutation.state.variables as OrderUpdateVariables).orderId,
  });
}
