import { buildAttention } from '@/features/dashboard/domain/attention';
import { shiftCardModel } from '@/features/dashboard/domain/shiftCard';
import { nextBreak, staffOnFloor } from '@/features/roster/domain/cover';
import { shiftsOnDay } from '@/features/roster/domain/shifts';
import { createMockInventory } from '@/mocks/inventory';
import { createMockOrders } from '@/mocks/orders';
import { createMockShifts } from '@/mocks/shifts';

const NOW = new Date(2026, 9, 10, 16, 40);
const today = shiftsOnDay(createMockShifts(NOW), NOW);
const orders = createMockOrders(NOW);

describe('buildAttention', () => {
  it('matches the three items in the Dashboard mockup', () => {
    const items = buildAttention({
      orders,
      upcomingBreak: nextBreak(today, NOW),
      breakEmployeeName: 'Grace Liu',
      inventory: createMockInventory(),
      now: NOW,
    });
    expect(items.map(({ title, subtitle, href }) => ({ title, subtitle, href }))).toEqual([
      { title: '3 orders overdue', subtitle: 'Oldest has waited 53 min past due', href: '/orders' },
      { title: 'Break cover at 5:00 pm', subtitle: 'Grace Liu · 30 min break', href: '/roster' },
      { title: '4 products low or out', subtitle: 'Velour Soft Focus Blush and 3 more', href: '/inventory' },
    ]);
  });

  it('is empty when nothing needs attention, and skips stock while inventory is loading', () => {
    expect(buildAttention({ orders: [], upcomingBreak: null, now: NOW })).toEqual([]);
  });
});

describe('shiftCardModel', () => {
  const alex = today.find((s) => s.employeeId === 'emp-01');

  it('shows time left, progress and the three figures during the shift', () => {
    const model = shiftCardModel({ myShift: alex, now: NOW, staffOnFloor: staffOnFloor(today, NOW).length, nextBreakAt: nextBreak(today, NOW)?.startsAt ?? null, ordersToAssign: 7 });
    expect(model).toMatchObject({ statusLabel: 'On shift', live: true, timeRange: '9:00 am – 5:30 pm', headline: '50 min left' });
    expect(Math.round(model.percent ?? 0)).toBe(90);
    expect(model.stats).toEqual([
      { value: '4', label: 'on the floor' },
      { value: '5:00', label: 'next break' },
      { value: '7', label: 'orders to assign' },
    ]);
  });

  it('handles before, after and no shift', () => {
    const base = { staffOnFloor: 0, nextBreakAt: null, ordersToAssign: 1 };
    expect(shiftCardModel({ ...base, myShift: alex, now: new Date(2026, 9, 10, 8) })).toMatchObject({ headline: 'Starts in 1h', live: false, percent: null });
    expect(shiftCardModel({ ...base, myShift: alex, now: new Date(2026, 9, 10, 19) })).toMatchObject({ statusLabel: 'Shift finished', percent: 100 });
    expect(shiftCardModel({ ...base, myShift: undefined, now: NOW })).toMatchObject({ statusLabel: 'Not rostered', percent: null });
  });
});
