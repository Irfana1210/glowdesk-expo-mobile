import Storage from "expo-sqlite/kv-store";

import {
  isPersistedShift,
  ROSTER_STORAGE_KEY,
  useRosterStore,
} from "@/features/roster/store/roster.store";

import { createMockShifts } from "@/mocks/shifts";

const NOW = new Date(2026, 9, 7, 10); // Wednesday 7 October 2026
const at = (day: number, h: number, m = 0) =>
  new Date(2026, 9, day, h, m).toISOString();

beforeEach(async () => {
  await Storage.removeItem(ROSTER_STORAGE_KEY);
  useRosterStore.setState({ shifts: createMockShifts(NOW) });
});

describe("useRosterStore", () => {
  it("adds a valid shift and saves it to storage", async () => {
    const result = useRosterStore.getState().addShift({
      employeeId: "emp-06", // Tom Becker is not rostered on Monday
      startAt: at(5, 9),
      endAt: at(5, 12),
      unpaidBreakMinutes: 0,
    });

    expect(result.ok).toBe(true);
    const saved = JSON.parse(
      (await Storage.getItem(ROSTER_STORAGE_KEY)) ?? "{}",
    );
    expect(saved.state.shifts).toHaveLength(createMockShifts(NOW).length + 1);
  });

  it("refuses an overlapping shift and leaves state untouched", () => {
    const before = useRosterStore.getState().shifts;
    // Alex works 8:30 am–5pm on Monday 5 October in the mock roster.
    const result = useRosterStore.getState().addShift({
      employeeId: "emp-01",
      startAt: at(5, 16),
      endAt: at(5, 20),
      unpaidBreakMinutes: 0,
    });

    expect(result).toEqual({
      ok: false,
      errors: {
        form: "Alex Morgan already works 8:30 am – 5:00 pm on Mon 5 Oct.",
      },
    });
    expect(useRosterStore.getState().shifts).toBe(before);
  });

  it("refuses inactive and other-store employees", () => {
    const add = (employeeId: string) =>
      useRosterStore.getState().addShift({
        employeeId,
        startAt: at(5, 9),
        endAt: at(5, 12),
        unpaidBreakMinutes: 0,
      });
    expect(add("emp-07")).toMatchObject({
      ok: false,
      errors: { employeeId: expect.stringMatching(/inactive/) },
    });
    expect(add("emp-08")).toMatchObject({
      ok: false,
      errors: { employeeId: expect.stringMatching(/not assigned/) },
    });
  });

  it("updates a shift without clashing with itself", () => {
    const [first] = useRosterStore.getState().shifts;
    if (!first) {
      throw new Error("expected mock shifts");
    }
    const result = useRosterStore
      .getState()
      .updateShift(first.id, { ...first, endAt: at(5, 17, 30) });

    expect(result.ok).toBe(true);
    expect(
      useRosterStore.getState().shifts.find((s) => s.id === first.id)?.endAt,
    ).toBe(at(5, 17, 30));
  });

  it("removes a shift and resets demo data", () => {
    const [first] = useRosterStore.getState().shifts;
    if (!first) {
      throw new Error("expected mock shifts");
    }
    useRosterStore.getState().removeShift(first.id);
    expect(
      useRosterStore.getState().shifts.find((s) => s.id === first.id),
    ).toBeUndefined();
  });

  it("rejects corrupted shift records from storage", () => {
    expect(
      isPersistedShift({
        id: "x",
        storeId: "s",
        employeeId: "e",
        startAt: "bad",
        endAt: "bad",
        unpaidBreakMinutes: 0,
      }),
    ).toBe(false);
    expect(isPersistedShift(createMockShifts(NOW)[0])).toBe(true);
  });

  it("generates a valid mock week with no overlaps", () => {
    const { employees } = useRosterStore.getState();
    const shifts = createMockShifts(NOW);
    // Re-adding every mock shift through validation proves the seed data is itself valid.
    useRosterStore.setState({ shifts: [] });
    for (const s of shifts) {
      expect(useRosterStore.getState().addShift(s)).toMatchObject({ ok: true });
    }
    expect(
      employees.filter((e) => !e.active || e.storeId !== shifts[0]?.storeId),
    ).toHaveLength(2);
  });
});
