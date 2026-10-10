import { LOCALE } from "@/constants/locale";

import { type Employee } from "@/features/employees/types";
import { ShiftUtils } from "@/features/roster/domain/shifts";
import { type Shift, type ShiftDraft } from "@/features/roster/types";

const V = LOCALE.roster.validation;
const STORE = "store-1";
const at = (day: number, h: number, m = 0) =>
  new Date(2026, 9, day, h, m).toISOString();

const employees: Array<Employee> = [
  {
    id: "e1",
    staffId: "RO9001",
    storeId: STORE,
    name: "Olivia Carter",
    role: "STORE_MANAGER",
    employmentType: "FULL_TIME",
    active: true,
  },
  {
    id: "e2",
    staffId: "RO9002",
    storeId: STORE,
    name: "Liam Nguyen",
    role: "BEAUTY_ADVISOR",
    employmentType: "PART_TIME",
    active: true,
  },
  {
    id: "e3",
    staffId: "RO9003",
    storeId: STORE,
    name: "Jack Wilson",
    role: "CASHIER",
    employmentType: "CASUAL",
    active: false,
  },
  {
    id: "e4",
    staffId: "RO9004",
    storeId: "other-store",
    name: "Grace Lee",
    role: "CASHIER",
    employmentType: "CASUAL",
    active: true,
  },
];

const draft = (overrides: Partial<ShiftDraft> = {}): ShiftDraft => ({
  employeeId: "e1",
  startAt: at(6, 9),
  endAt: at(6, 17),
  unpaidBreakMinutes: 30,
  ...overrides,
});
const shift = (id: string, overrides: Partial<ShiftDraft> = {}): Shift => ({
  id,
  storeId: STORE,
  ...draft(overrides),
});

const context = (shifts: Array<Shift> = [], editingShiftId?: string) => ({
  storeId: STORE,
  employees,
  shifts,
  editingShiftId,
});

describe("durations and paid hours", () => {
  it("calculates paid hours as duration minus unpaid break", () => {
    expect(ShiftUtils.shiftDurationMinutes(draft())).toBe(480);
    expect(ShiftUtils.paidHours(draft())).toBe(7.5);
  });

  it("handles overnight shifts with an explicit next-day end", () => {
    const overnight = draft({ startAt: at(8, 22), endAt: at(9, 6) });
    expect(ShiftUtils.shiftDurationMinutes(overnight)).toBe(480);
    expect(ShiftUtils.isOvernight(overnight)).toBe(true);
    expect(ShiftUtils.isOvernight(draft())).toBe(false);
  });

  it("counts real elapsed time across the daylight-saving change", () => {
    // Clocks go forward at 2am on Sunday 4 October 2026 in Melbourne: 1am–5am is 3 hours.
    expect(
      ShiftUtils.shiftDurationMinutes(
        draft({ startAt: at(4, 1), endAt: at(4, 5) }),
      ),
    ).toBe(180);
  });

  it("never reports negative paid time", () => {
    expect(ShiftUtils.paidHours(draft({ unpaidBreakMinutes: 600 }))).toBe(0);
    expect(ShiftUtils.shiftDurationMinutes(draft({ startAt: "nope" }))).toBe(0);
  });

  it("formats hours", () => {
    expect([450, 480, 0, 465].map(ShiftUtils.formatHours)).toEqual([
      "7.5h",
      "8h",
      "0h",
      "7.75h",
    ]);
  });
});

describe("shiftsOverlap", () => {
  it("detects overlap and allows back-to-back shifts", () => {
    expect(
      ShiftUtils.shiftsOverlap(
        draft(),
        draft({ startAt: at(6, 16), endAt: at(6, 20) }),
      ),
    ).toBe(true);
    expect(
      ShiftUtils.shiftsOverlap(
        draft(),
        draft({ startAt: at(6, 17), endAt: at(6, 21) }),
      ),
    ).toBe(false);
  });

  it("detects an overnight shift overlapping the next morning", () => {
    const overnight = draft({ startAt: at(8, 22), endAt: at(9, 6) });
    expect(
      ShiftUtils.shiftsOverlap(
        overnight,
        draft({ startAt: at(9, 5), endAt: at(9, 9) }),
      ),
    ).toBe(true);
  });
});

describe("validateShift", () => {
  it("accepts a valid shift", () => {
    expect(ShiftUtils.validateShift(draft(), context())).toEqual({});
  });

  it("requires an end time after the start time", () => {
    expect(
      ShiftUtils.validateShift(draft({ endAt: at(6, 9) }), context()).endAt,
    ).toBe(V.endBeforeStart);
    expect(
      ShiftUtils.validateShift(
        draft({ startAt: at(6, 22), endAt: at(6, 6) }),
        context(),
      ).endAt,
    ).toBe(V.endBeforeStart);
  });

  it("rejects implausibly long shifts", () => {
    expect(
      ShiftUtils.validateShift(draft({ endAt: at(7, 17) }), context()).endAt,
    ).toBe(V.tooLong(14));
  });

  it("rejects invalid timestamps", () => {
    expect(
      ShiftUtils.validateShift(draft({ startAt: "bad" }), context()).startAt,
    ).toBe(V.invalidStartTime);
  });

  it("rejects a break that is as long as the shift or longer", () => {
    expect(
      ShiftUtils.validateShift(draft({ unpaidBreakMinutes: 480 }), context())
        .unpaidBreakMinutes,
    ).toBe(V.breakTooLong);
    expect(
      ShiftUtils.validateShift(draft({ unpaidBreakMinutes: -5 }), context())
        .unpaidBreakMinutes,
    ).toBe(V.breakNotWhole);
    expect(
      ShiftUtils.validateShift(draft({ unpaidBreakMinutes: 0 }), context()),
    ).toEqual({});
  });

  it("prevents invalid employee assignments", () => {
    expect(
      ShiftUtils.validateShift(draft({ employeeId: "" }), context()).employeeId,
    ).toBe(V.chooseEmployee);
    expect(
      ShiftUtils.validateShift(draft({ employeeId: "ghost" }), context())
        .employeeId,
    ).toBe(V.employeeMissing);
    expect(
      ShiftUtils.validateShift(draft({ employeeId: "e3" }), context())
        .employeeId,
    ).toBe(V.employeeInactive("Jack Wilson"));
    expect(
      ShiftUtils.validateShift(draft({ employeeId: "e4" }), context())
        .employeeId,
    ).toBe(V.employeeNotAssigned("Grace Lee"));
  });

  it("detects overlapping shifts for the same employee only", () => {
    const existing = [shift("s1", { startAt: at(6, 16), endAt: at(6, 21) })];
    expect(ShiftUtils.validateShift(draft(), context(existing)).form).toBe(
      V.alreadyWorks("Olivia Carter", "4:00 pm – 9:00 pm", "Tue 6 Oct"),
    );
    expect(
      ShiftUtils.validateShift(draft({ employeeId: "e2" }), context(existing)),
    ).toEqual({});
  });

  it("ignores the shift being edited when checking overlap", () => {
    const existing = [shift("s1")];
    expect(
      ShiftUtils.validateShift(
        draft({ endAt: at(6, 18) }),
        context(existing, "s1"),
      ),
    ).toEqual({});
  });
});

describe("day grouping and coverage", () => {
  const day = new Date(2026, 9, 6);

  it("assigns overnight shifts to the day they start", () => {
    const shifts = [
      shift("a"),
      shift("b", { startAt: at(5, 22), endAt: at(6, 6) }),
    ];
    expect(ShiftUtils.shiftsOnDay(shifts, day).map((s) => s.id)).toEqual(["a"]);
  });

  it("counts distinct staff", () => {
    expect(
      ShiftUtils.staffCount([
        shift("a"),
        shift("b", { startAt: at(6, 18), endAt: at(6, 21) }),
        shift("c", { employeeId: "e2" }),
      ]),
    ).toBe(2);
  });

  it("reports full coverage when shifts span trading hours", () => {
    const shifts = [
      shift("a", { startAt: at(6, 8, 30), endAt: at(6, 17) }),
      shift("b", { startAt: at(6, 13), endAt: at(6, 21) }),
    ];
    expect(ShiftUtils.coverageGaps(shifts, day)).toEqual([]);
  });

  it("reports gaps at the start, middle and end of the day", () => {
    const shifts = [
      shift("a", { startAt: at(6, 10), endAt: at(6, 13) }),
      shift("b", { startAt: at(6, 14), endAt: at(6, 19) }),
    ];
    const gaps = ShiftUtils.coverageGaps(shifts, day).map((g) => [
      g.start.getHours(),
      g.end.getHours(),
    ]);
    expect(gaps).toEqual([
      [9, 10],
      [13, 14],
      [19, 21],
    ]);
  });

  it("treats a day with no shifts as one gap across trading hours", () => {
    expect(ShiftUtils.coverageGaps([], day)).toHaveLength(1);
  });
});
