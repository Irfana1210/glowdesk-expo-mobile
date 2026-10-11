import { type ReactElement } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";

import { OrderMutations } from "@/features/orders/hooks/order-mutations";
import { ShiftMutations } from "@/features/roster/hooks/shift-mutations";

/**
 * A fresh QueryClient like the app's, with the order and roster mutations registered. Retries are
 * off so error states appear immediately, and garbage-collection timers are disabled so finished
 * queries and mutations do not keep the Jest worker alive.
 */
export function createTestQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  OrderMutations.register(client);
  ShiftMutations.register(client);
  return client;
}

export async function renderWithQuery(
  ui: ReactElement,
  client: QueryClient = createTestQueryClient(),
) {
  const view = await render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
  return { ...view, client };
}
