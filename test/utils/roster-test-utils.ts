import { MockServer } from "@/services/mock-api/mock-server";

import { type Shift } from "@/features/roster/types";

import { createMockShifts } from "@/mocks/shifts";

/** Wednesday 7 October 2026, 10am: inside the mock roster week (Mon 5 – Sun 11 Oct). */
export const ROSTER_NOW = new Date(2026, 9, 7, 10);

/**
 * Puts the demo week for the week containing `now` on the mock server, with the server clock
 * pinned to `now`. The designed day is placed on `now`'s date.
 */
export function seedRoster(
  now: Date = ROSTER_NOW,
  shifts: Array<Shift> = createMockShifts(now),
): Promise<void> {
  return MockServer.seedForTest({ now, shifts });
}
