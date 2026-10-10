import {
  addDays,
  atTime,
  formatDayLabel,
  formatWeekRange,
  fromDateKey,
  startOfWeek,
  toDateKey,
  weekDays,
} from '@/features/roster/domain/dates';

describe('date helpers', () => {
  it('runs tests in the store timezone', () => {
    // Melbourne is UTC+11 during daylight saving in October.
    expect(new Date(2026, 9, 10, 12).getTimezoneOffset()).toBe(-660);
  });

  it('round-trips date keys and rejects invalid ones', () => {
    expect(toDateKey(new Date(2026, 9, 6))).toBe('2026-10-06');
    expect(toDateKey(fromDateKey('2026-02-28') as Date)).toBe('2026-02-28');
    expect(fromDateKey('2026-02-30')).toBeNull();
    expect(fromDateKey('6/10/2026')).toBeNull();
  });

  it('starts weeks on Monday', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 9, 10)))).toBe('2026-10-05'); // Saturday
    expect(toDateKey(startOfWeek(new Date(2026, 9, 5)))).toBe('2026-10-05'); // Monday
    expect(toDateKey(startOfWeek(new Date(2026, 9, 11)))).toBe('2026-10-05'); // Sunday
  });

  it('lists seven consecutive days, across the DST change', () => {
    const days = weekDays(new Date(2026, 8, 28)).map(toDateKey);
    expect(days).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(toDateKey(addDays(new Date(2026, 9, 3), 1))).toBe('2026-10-04');
  });

  it('formats week ranges within a month, across months and across years', () => {
    expect(formatWeekRange(new Date(2026, 9, 5))).toBe('5 – 11 Oct 2026');
    expect(formatWeekRange(new Date(2026, 8, 28))).toBe('28 Sep – 4 Oct 2026');
    expect(formatWeekRange(new Date(2025, 11, 29))).toBe('29 Dec 2025 – 4 Jan 2026');
  });

  it('formats day labels and parses wall-clock times', () => {
    expect(formatDayLabel(new Date(2026, 9, 6))).toBe('Tue 6 Oct');
    expect(atTime(new Date(2026, 9, 6), '09:30')?.getHours()).toBe(9);
    expect(atTime(new Date(2026, 9, 6), '24:00')).toBeNull();
    expect(atTime(new Date(2026, 9, 6), '9:30')).toBeNull();
  });
});
