import { type ReactElement } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";

/**
 * Renders with a fresh QueryClient. Retries are off so error states appear immediately, and
 * garbage-collection timers are disabled so finished queries and mutations do not keep the
 * Jest worker alive.
 */
export async function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}
