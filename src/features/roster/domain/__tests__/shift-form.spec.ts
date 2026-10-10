import { ShiftFormUtils } from "@/features/roster/domain/shift-form";

import { createMockShifts } from "@/mocks/shifts";

describe("shift form mapping", () => {
  it("builds absolute times for a same-day shift", () => {
    const draft = ShiftFormUtils.toShiftDraft({
      ...ShiftFormUtils.defaultFormValues("2026-10-07"),
      employeeId: "emp-07",
    });
    expect(new Date(draft!.startAt).getHours()).toBe(9);
    expect(new Date(draft!.endAt).getDate()).toBe(7);
  });

  it('puts the end on the next calendar day when "Ends next day" is on', () => {
    const draft = ShiftFormUtils.toShiftDraft({
      ...ShiftFormUtils.defaultFormValues("2026-10-08"),
      startTime: "22:00",
      endTime: "06:00",
      endsNextDay: true,
    });
    expect(new Date(draft!.endAt).getDate()).toBe(9);
  });

  it("returns null for malformed input", () => {
    expect(
      ShiftFormUtils.toShiftDraft({
        ...ShiftFormUtils.defaultFormValues("2026-02-31"),
      }),
    ).toBeNull();
    expect(
      ShiftFormUtils.toShiftDraft({
        ...ShiftFormUtils.defaultFormValues("2026-10-07"),
        startTime: "25:00",
      }),
    ).toBeNull();
  });

  it("round-trips an overnight shift through the form", () => {
    const overnight = createMockShifts(new Date(2026, 9, 7)).find(
      (s) => s.employeeId === "emp-06" && s.startAt.includes("T11:00"),
    );
    if (!overnight) {
      throw new Error("expected the overnight stocktake shift");
    }
    const values = ShiftFormUtils.toFormValues(overnight);
    expect(values).toMatchObject({
      startTime: "22:00",
      endTime: "06:00",
      endsNextDay: true,
    });
    expect(ShiftFormUtils.toShiftDraft(values)).toEqual({
      employeeId: overnight.employeeId,
      startAt: overnight.startAt,
      endAt: overnight.endAt,
      unpaidBreakMinutes: overnight.unpaidBreakMinutes,
    });
  });

  it("offers every quarter hour", () => {
    expect(ShiftFormUtils.TIME_OPTIONS).toHaveLength(96);
    expect(ShiftFormUtils.TIME_OPTIONS[36]).toEqual({
      value: "09:00",
      label: "9:00 am",
    });
  });
});
