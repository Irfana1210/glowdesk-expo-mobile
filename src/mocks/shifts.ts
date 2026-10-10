/**
 * A week of fictional shifts for the week containing `now`.
 *
 * Today always uses the Roster mockup's day (6 staff, 37.5 paid hours, a dip to 2 people at
 * 11 am, Grace Liu's break at 5 pm), so the dashboard and roster open on the designed state
 * whatever weekday the demo runs on. The other days use a steady pattern for the same team.
 */
import { addDays, atTime, isSameDay, startOfWeek, toDateKey } from '@/features/roster/domain/dates';
import type { Shift } from '@/features/roster/types';

import { DEMO_STORE_ID } from './store';

type Seed = {
  employeeId: string;
  start: string;
  end: string;
  breakMinutes: number;
  breakAt?: string;
  endsNextDay?: boolean;
};

/** From the Roster mockup, Saturday 10 October. */
const DESIGNED_DAY: Seed[] = [
  { employeeId: 'emp-01', start: '09:00', end: '17:30', breakMinutes: 30, breakAt: '13:00' },
  { employeeId: 'emp-02', start: '12:00', end: '20:30', breakMinutes: 30, breakAt: '16:00' },
  { employeeId: 'emp-03', start: '13:00', end: '21:00', breakMinutes: 30, breakAt: '17:00' },
  { employeeId: 'emp-04', start: '16:00', end: '21:00', breakMinutes: 30 },
  { employeeId: 'emp-05', start: '09:00', end: '15:00', breakMinutes: 30, breakAt: '12:00' },
  { employeeId: 'emp-06', start: '07:00', end: '11:00', breakMinutes: 0 },
];

/** Monday to Sunday pattern used for every other day of the week. */
const WEEK_PATTERN: Seed[][] = [
  [
    { employeeId: 'emp-01', start: '08:30', end: '17:00', breakMinutes: 30 },
    { employeeId: 'emp-05', start: '09:00', end: '15:00', breakMinutes: 30 },
    { employeeId: 'emp-02', start: '12:00', end: '20:30', breakMinutes: 30 },
    { employeeId: 'emp-04', start: '15:00', end: '21:00', breakMinutes: 30 },
  ],
  [
    { employeeId: 'emp-01', start: '08:30', end: '17:00', breakMinutes: 30 },
    { employeeId: 'emp-03', start: '09:00', end: '15:00', breakMinutes: 30 },
    { employeeId: 'emp-02', start: '12:30', end: '21:00', breakMinutes: 30 },
    { employeeId: 'emp-06', start: '07:00', end: '11:00', breakMinutes: 0 },
  ],
  [
    { employeeId: 'emp-02', start: '08:30', end: '17:00', breakMinutes: 30 },
    { employeeId: 'emp-05', start: '09:00', end: '15:00', breakMinutes: 30 },
    { employeeId: 'emp-04', start: '13:00', end: '21:00', breakMinutes: 30 },
    { employeeId: 'emp-03', start: '15:00', end: '21:00', breakMinutes: 30 },
  ],
  [
    { employeeId: 'emp-01', start: '08:30', end: '17:00', breakMinutes: 30 },
    { employeeId: 'emp-03', start: '10:00', end: '18:30', breakMinutes: 30 },
    { employeeId: 'emp-02', start: '12:30', end: '21:00', breakMinutes: 30 },
    { employeeId: 'emp-06', start: '22:00', end: '06:00', breakMinutes: 30, endsNextDay: true },
  ],
  [
    { employeeId: 'emp-01', start: '08:30', end: '17:00', breakMinutes: 30 },
    { employeeId: 'emp-05', start: '09:00', end: '15:00', breakMinutes: 30 },
    { employeeId: 'emp-04', start: '12:00', end: '21:00', breakMinutes: 30 },
    { employeeId: 'emp-02', start: '13:00', end: '21:00', breakMinutes: 30 },
  ],
  DESIGNED_DAY,
  [
    { employeeId: 'emp-02', start: '09:00', end: '17:00', breakMinutes: 30 },
    { employeeId: 'emp-04', start: '10:00', end: '17:00', breakMinutes: 30 },
  ],
];

export function createMockShifts(now: Date = new Date()): Shift[] {
  const weekStart = startOfWeek(now);
  const shifts: Shift[] = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const day = addDays(weekStart, dayIndex);
    const seeds = isSameDay(day, now) ? DESIGNED_DAY : (WEEK_PATTERN[dayIndex] ?? []);
    seeds.forEach((seed, index) => {
      const startAt = atTime(day, seed.start);
      const endAt = atTime(seed.endsNextDay ? addDays(day, 1) : day, seed.end);
      const breakAt = seed.breakAt ? atTime(day, seed.breakAt) : null;
      if (!startAt || !endAt) throw new Error(`Invalid mock shift seed ${dayIndex}/${index}`);
      shifts.push({
        id: `shift-${toDateKey(day)}-${index + 1}`,
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
