import { MOCK_LATENCY_MS } from "@/constants/primitives";

export namespace MockUtils {
  /** Waits like a network round trip, so the mock services exercise loading states. */
  export function simulateLatency(ms: number = MOCK_LATENCY_MS): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
