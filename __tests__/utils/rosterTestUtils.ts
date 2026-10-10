import { useRosterStore } from '@/features/roster/store/useRosterStore';
import { createMockShifts } from '@/mocks/shifts';

/** Wednesday 7 October 2026, 10am: inside the mock roster week (Mon 5 – Sun 11 Oct). */
export const ROSTER_NOW = new Date(2026, 9, 7, 10);

/** Loads the demo week for the week containing `now`. The designed day is placed on `now`'s date. */
export function resetRosterStore(now: Date = ROSTER_NOW) {
  useRosterStore.setState({ shifts: createMockShifts(now) });
}
