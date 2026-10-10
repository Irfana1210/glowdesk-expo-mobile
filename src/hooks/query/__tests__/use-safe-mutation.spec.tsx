import { type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import { ReportingUtils } from "@/utils/reporting-utils";

import { useSafeMutation } from "@/hooks/query/use-safe-mutation";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSafeMutation", () => {
  it("resolves like useMutation", async () => {
    const { result } = await renderHook(
      () =>
        useSafeMutation<number, Error, number>({
          mutationFn: (n) => Promise.resolve(n * 2),
        }),
      { wrapper },
    );

    await expect(result.current.mutateAsync(21)).resolves.toBe(42);
  });

  it("reports a failure and still exposes the error", async () => {
    const report = jest
      .spyOn(ReportingUtils, "reportError")
      .mockImplementation(() => undefined);
    const failure = new Error("boom");
    const { result } = await renderHook(
      () =>
        useSafeMutation<never, Error, void>({
          mutationFn: () => Promise.reject(failure),
        }),
      { wrapper },
    );

    await expect(result.current.mutateAsync()).rejects.toBe(failure);
    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(report).toHaveBeenCalledWith(failure);
    report.mockRestore();
  });
});
