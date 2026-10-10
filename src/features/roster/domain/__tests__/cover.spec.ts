import { LOCALE } from "@/constants/locale";

import { CoverUtils } from "@/features/roster/domain/cover";
import { ShiftUtils } from "@/features/roster/domain/shifts";
import { type Shift } from "@/features/roster/types";

import { createMockShifts } from "@/mocks/shifts";

/** Saturday 10 October 2026 at 4:40 pm, the moment the mockups show. */
const NOW = new Date(2026, 9, 10, 16, 40);
const COVER = LOCALE.roster.cover;
const today = ShiftUtils.shiftsOnDay(createMockShifts(NOW), NOW);
const at = (h: number, m = 0) => new Date(2026, 9, 10, h, m);
const byName = (id: string) => {
  const found = today.find((s) => s.employeeId === id);
  if (!found) {
    throw new Error(`no shift for ${id}`);
  }
  return found;
};

describe("hourlyCover", () => {
  it("matches the floor cover in the Roster mockup", () => {
    expect(CoverUtils.hourlyCover(today, NOW).map((h) => h.count)).toEqual([
      3, 3, 2, 3, 4, 4, 3, 4, 4, 3, 3, 3,
    ]);
  });

  it("flags hours below the minimum", () => {
    const low = CoverUtils.hourlyCover(today, NOW).filter(
      (h) => h.belowMinimum,
    );
    expect(low.map((h) => h.hour)).toEqual([11]);
    expect(CoverUtils.MIN_FLOOR_COVER).toBe(3);
  });

  it("reports every hour as below minimum on an empty day", () => {
    expect(
      CoverUtils.hourlyCover([], NOW).every(
        (h) => h.count === 0 && h.belowMinimum,
      ),
    ).toBe(true);
  });
});

describe("staffOnFloor and breaks", () => {
  it("counts the four people working at 4:40 pm", () => {
    expect(
      CoverUtils.staffOnFloor(today, NOW)
        .map((s) => s.employeeId)
        .sort(),
    ).toEqual(["emp-01", "emp-02", "emp-03", "emp-04"]);
  });

  it("excludes someone on a scheduled break", () => {
    expect(
      CoverUtils.staffOnFloor(today, at(17, 10)).map((s) => s.employeeId),
    ).not.toContain("emp-03");
  });

  it("finds the next break and flags it for cover when it is within the hour", () => {
    const upcoming = CoverUtils.nextBreak(today, NOW);
    expect(upcoming?.shift.employeeId).toBe("emp-03");
    expect(upcoming?.startsAt.getHours()).toBe(17);
    expect(CoverUtils.breakNeedsCover(upcoming!, NOW)).toBe(true);
    expect(CoverUtils.breakNeedsCover(upcoming!, at(15, 0))).toBe(false);
  });

  it("returns null when no breaks are left today", () => {
    expect(CoverUtils.nextBreak(today, at(20, 0))).toBeNull();
  });
});

describe("shiftProgress", () => {
  const shift: Shift = {
    id: "s",
    storeId: "x",
    employeeId: "e",
    startAt: at(9).toISOString(),
    endAt: at(17, 30).toISOString(),
    unpaidBreakMinutes: 30,
  };

  it("reports time left and elapsed share during the shift", () => {
    const p = CoverUtils.shiftProgress(shift, NOW);
    expect(p.phase).toBe("active");
    expect(p.minutesRemaining).toBe(50);
    expect(Math.round(p.percent)).toBe(90);
  });

  it("handles before and after the shift", () => {
    expect(CoverUtils.shiftProgress(shift, at(7, 30))).toEqual({
      phase: "upcoming",
      minutesRemaining: 90,
      percent: 0,
    });
    expect(CoverUtils.shiftProgress(shift, at(18))).toEqual({
      phase: "finished",
      minutesRemaining: 0,
      percent: 100,
    });
  });
});

describe("shiftState", () => {
  it("matches the states shown in the Roster mockup at 4:40 pm", () => {
    expect(
      CoverUtils.shiftState(byName("emp-01"), NOW, { isCurrentUser: true }),
    ).toEqual({
      label: COVER.onTheFloorYou,
      tone: "on",
    });
    expect(CoverUtils.shiftState(byName("emp-03"), NOW)).toEqual({
      label: COVER.breakNeedsCover("5:00 pm"),
      tone: "warn",
    });
    expect(CoverUtils.shiftState(byName("emp-05"), NOW)).toEqual({
      label: COVER.finished,
      tone: "off",
    });
  });

  it("shows breaks in progress and shifts not yet started", () => {
    expect(CoverUtils.shiftState(byName("emp-03"), at(17, 10))).toEqual({
      label: COVER.onBreakUntil("5:30 pm"),
      tone: "warn",
    });
    expect(CoverUtils.shiftState(byName("emp-04"), at(10))).toEqual({
      label: COVER.starts("4:00 pm"),
      tone: "off",
    });
  });
});

describe("sortShiftsForDay", () => {
  it("lists today like the Roster mockup: working first, then finished", () => {
    expect(
      CoverUtils.sortShiftsForDay(today, NOW, NOW).map((s) => s.employeeId),
    ).toEqual(["emp-01", "emp-02", "emp-03", "emp-04", "emp-05", "emp-06"]);
  });

  it("sorts other days by start time", () => {
    const tomorrow = new Date(2026, 9, 11, 9);
    expect(
      CoverUtils.sortShiftsForDay(today, tomorrow, NOW).map(
        (s) => s.employeeId,
      )[0],
    ).toBe("emp-06");
  });
});
