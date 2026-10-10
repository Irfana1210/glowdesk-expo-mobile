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

describe("cover shift defaults", () => {
  it("starts on the tapped hour, runs four hours and has no unpaid break", () => {
    expect(
      ShiftFormUtils.defaultFormValues("2026-10-11", 11, 21),
    ).toMatchObject({
      date: "2026-10-11",
      startTime: "11:00",
      endTime: "15:00",
      endsNextDay: false,
      breakMinutes: 0,
    });
  });

  it("ends at closing time when four hours would run past it", () => {
    expect(
      ShiftFormUtils.defaultFormValues("2026-10-11", 19, 21),
    ).toMatchObject({
      startTime: "19:00",
      endTime: "21:00",
    });
    expect(ShiftFormUtils.defaultFormValues("2026-10-11", 20, 21).endTime).toBe(
      "21:00",
    );
  });

  it("keeps the 9 to 5 default when no hour is given", () => {
    expect(ShiftFormUtils.defaultFormValues("2026-10-11")).toMatchObject({
      startTime: "09:00",
      endTime: "17:00",
      breakMinutes: 30,
    });
  });

  it.each([
    ["9", 9],
    ["17", 17],
    ["0", 0],
    [undefined, undefined],
    ["23", undefined],
    ["9am", undefined],
    ["-1", undefined],
  ])("parses start hour %p as %p", (value, expected) => {
    expect(ShiftFormUtils.parseStartHour(value)).toBe(expected);
  });
});

describe("today's default start", () => {
  it("starts at the next full hour later today, otherwise at 9am", () => {
    const today = "2026-10-07";
    expect(
      ShiftFormUtils.defaultFormValues(
        today,
        undefined,
        21,
        new Date(2026, 9, 7, 13, 20),
      ),
    ).toMatchObject({ startTime: "14:00", endTime: "21:00", breakMinutes: 30 });
    expect(
      ShiftFormUtils.defaultFormValues(
        today,
        undefined,
        21,
        new Date(2026, 9, 7, 7),
      ),
    ).toMatchObject({ startTime: "09:00", endTime: "17:00" });
    expect(
      ShiftFormUtils.defaultFormValues(
        "2026-10-08",
        undefined,
        21,
        new Date(2026, 9, 7, 13),
      ),
    ).toMatchObject({ startTime: "09:00", endTime: "17:00" });
  });
});
