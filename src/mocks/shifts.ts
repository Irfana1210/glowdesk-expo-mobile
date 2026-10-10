/**
 * A week of fictional shifts for the week containing `now`.
 *
 * Today always uses the Roster mockup's day (6 staff, 37.5 paid hours, a dip to 2 people at
 * 11 am, Grace Liu's break at 5 pm), so the dashboard and roster open on the designed state
 * whatever weekday the demo runs on. The other days use a steady pattern for the same team.
 */
import { DateUtils } from "@/features/roster/domain/dates";
import { type Shift } from "@/features/roster/types";

import { DEMO_STORE_ID } from "./store";

type Seed = {
  breakAt?: string;
  breakMinutes: number;
  employeeId: string;
  end: string;
  endsNextDay?: boolean;
  start: string;
};

/** From the Roster mockup, Saturday 10 October. */
const DESIGNED_DAY: Array<Seed> = [
  {
    employeeId: "emp-01",
    start: "09:00",
    end: "17:30",
    breakMinutes: 30,
    breakAt: "13:00",
  },
  {
    employeeId: "emp-02",
    start: "12:00",
    end: "20:30",
    breakMinutes: 30,
    breakAt: "16:00",
  },
  {
    employeeId: "emp-03",
    start: "13:00",
    end: "21:00",
    breakMinutes: 30,
    breakAt: "17:00",
  },
  { employeeId: "emp-04", start: "16:00", end: "21:00", breakMinutes: 30 },
  {
    employeeId: "emp-05",
    start: "09:00",
    end: "15:00",
    breakMinutes: 30,
    breakAt: "12:00",
  },
  { employeeId: "emp-06", start: "07:00", end: "11:00", breakMinutes: 0 },
];

/** Monday to Sunday pattern used for every other day of the week. */
const WEEK_PATTERN: Array<Array<Seed>> = [
  [
    { employeeId: "emp-01", start: "08:30", end: "17:00", breakMinutes: 30 },
    { employeeId: "emp-05", start: "09:00", end: "15:00", breakMinutes: 30 },
    { employeeId: "emp-02", start: "12:00", end: "20:30", breakMinutes: 30 },
    { employeeId: "emp-04", start: "15:00", end: "21:00", breakMinutes: 30 },
  ],
  [
    { employeeId: "emp-01", start: "08:30", end: "17:00", breakMinutes: 30 },
    { employeeId: "emp-03", start: "09:00", end: "15:00", breakMinutes: 30 },
    { employeeId: "emp-02", start: "12:30", end: "21:00", breakMinutes: 30 },
    { employeeId: "emp-06", start: "07:00", end: "11:00", breakMinutes: 0 },
  ],
  [
    { employeeId: "emp-02", start: "08:30", end: "17:00", breakMinutes: 30 },
    { employeeId: "emp-05", start: "09:00", end: "15:00", breakMinutes: 30 },
    { employeeId: "emp-04", start: "13:00", end: "21:00", breakMinutes: 30 },
    { employeeId: "emp-03", start: "15:00", end: "21:00", breakMinutes: 30 },
  ],
  [
    { employeeId: "emp-01", start: "08:30", end: "17:00", breakMinutes: 30 },
    { employeeId: "emp-03", start: "10:00", end: "18:30", breakMinutes: 30 },
    { employeeId: "emp-02", start: "12:30", end: "21:00", breakMinutes: 30 },
    {
      employeeId: "emp-06",
      start: "22:00",
      end: "06:00",
      breakMinutes: 30,
      endsNextDay: true,
    },
  ],
  [
    { employeeId: "emp-01", start: "08:30", end: "17:00", breakMinutes: 30 },
    { employeeId: "emp-05", start: "09:00", end: "15:00", breakMinutes: 30 },
    { employeeId: "emp-04", start: "12:00", end: "21:00", breakMinutes: 30 },
    { employeeId: "emp-02", start: "13:00", end: "21:00", breakMinutes: 30 },
  ],
  DESIGNED_DAY,
  [
    { employeeId: "emp-02", start: "09:00", end: "17:00", breakMinutes: 30 },
    { employeeId: "emp-04", start: "10:00", end: "17:00", breakMinutes: 30 },
  ],
];

export function createMockShifts(now: Date = new Date()): Array<Shift> {
  const weekStart = DateUtils.startOfWeek(now);
  const shifts: Array<Shift> = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const day = DateUtils.addDays(weekStart, dayIndex);
    const seeds = DateUtils.isSameDay(day, now)
      ? DESIGNED_DAY
      : (WEEK_PATTERN[dayIndex] ?? []);
    seeds.forEach((seed, index) => {
      const startAt = DateUtils.atTime(day, seed.start);
      const endAt = DateUtils.atTime(
        seed.endsNextDay ? DateUtils.addDays(day, 1) : day,
        seed.end,
      );
      const breakAt = seed.breakAt ? DateUtils.atTime(day, seed.breakAt) : null;
      if (!startAt || !endAt) {
        throw new Error(`Invalid mock shift seed ${dayIndex}/${index}`);
      }
      shifts.push({
        id: `shift-${DateUtils.toDateKey(day)}-${index + 1}`,
        storeId: DEMO_STORE_ID,
        employeeId: seed.employeeId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        unpaidBreakMinutes: seed.breakMinutes,
        ...(breakAt ? { breakStartAt: breakAt.toISOString() } : {}),
      });
    });
  }
  return shifts;
}
