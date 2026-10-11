import { LOCALE } from "@/constants/locale";

import { AttentionUtils } from "@/features/dashboard/domain/attention";
import { ShiftCardUtils } from "@/features/dashboard/domain/shift-card";
import { CoverUtils } from "@/features/roster/domain/cover";
import { ShiftUtils } from "@/features/roster/domain/shifts";

import { createMockInventory } from "@/mocks/inventory";
import { createMockOrders } from "@/mocks/orders";
import { createMockShifts } from "@/mocks/shifts";

const L = LOCALE.dashboard;
const NOW = new Date(2026, 9, 10, 16, 40);
const today = ShiftUtils.shiftsOnDay(createMockShifts(NOW), NOW);
const orders = createMockOrders(NOW);

describe("buildAttention", () => {
  it("lists overdue orders and low stock, but not a break the team already covers", () => {
    const items = AttentionUtils.buildAttention({
      orders,
      breakNeedingCover: CoverUtils.nextBreakNeedingCover(today, NOW),
      breakEmployeeName: "Grace Liu",
      inventory: createMockInventory(),
      now: NOW,
    });
    expect(
      items.map(({ title, subtitle, href }) => ({ title, subtitle, href })),
    ).toEqual([
      {
        title: L.attention.orders.title(3),
        subtitle: L.attention.orders.subtitle("53 min"),
        href: "/orders",
      },
      {
        title: L.attention.stock.title(4),
        subtitle: L.attention.stock.subtitle("Velour Soft Focus Blush", 3),
        href: "/inventory",
      },
    ]);
  });

  it("asks for break cover when a break would leave the floor short", () => {
    const morning = new Date(2026, 9, 10, 11, 30);
    const items = AttentionUtils.buildAttention({
      orders: [],
      breakNeedingCover: CoverUtils.nextBreakNeedingCover(today, morning),
      breakEmployeeName: "Aisha Rahman",
      now: morning,
    });
    expect(items.map(({ title, subtitle }) => ({ title, subtitle }))).toEqual([
      {
        title: L.attention.breakCover.title("12:00 pm"),
        subtitle: L.attention.breakCover.subtitle("Aisha Rahman", 30),
      },
    ]);
  });

  it("is empty when nothing needs attention, and skips stock while inventory is loading", () => {
    expect(
      AttentionUtils.buildAttention({
        orders: [],
        breakNeedingCover: null,
        now: NOW,
      }),
    ).toEqual([]);
  });
});

describe("shiftCardModel", () => {
  const alex = today.find((s) => s.employeeId === "emp-01");

  it("shows time left, progress and the three figures during the shift", () => {
    const model = ShiftCardUtils.shiftCardModel({
      myShift: alex,
      now: NOW,
      staffOnFloor: CoverUtils.staffOnFloor(today, NOW).length,
      nextBreakAt: CoverUtils.nextBreak(today, NOW)?.startsAt ?? null,
      nextBreakOf: { firstName: "Grace" },
      ordersToAssign: 7,
    });
    expect(model).toMatchObject({
      statusLabel: L.shiftCard.active.status,
      live: true,
      timeRange: "9:00 am – 5:30 pm",
      headline: L.shiftCard.active.headline("50 min"),
    });
    expect(Math.round(model.percent ?? 0)).toBe(90);
    expect(model.stats).toEqual([
      { value: "4", label: L.shiftCard.stats.onTheFloor },
      { value: "5:00", label: L.shiftCard.stats.breakOf("Grace") },
      { value: "7", label: L.shiftCard.stats.ordersToAssign(7) },
    ]);
  });

  it("labels the next break as yours when it is the signed-in person's", () => {
    const model = ShiftCardUtils.shiftCardModel({
      myShift: alex,
      now: new Date(2026, 9, 10, 12, 30),
      staffOnFloor: 3,
      nextBreakAt: new Date(2026, 9, 10, 13),
      nextBreakOf: "you",
      ordersToAssign: 0,
    });
    expect(model.stats[1]).toEqual({
      value: "1:00",
      label: L.shiftCard.stats.yourBreak,
    });
  });

  it("handles before, after and no shift", () => {
    const base = { staffOnFloor: 0, nextBreakAt: null, ordersToAssign: 1 };
    expect(
      ShiftCardUtils.shiftCardModel({
        ...base,
        myShift: alex,
        now: new Date(2026, 9, 10, 8),
      }),
    ).toMatchObject({
      headline: L.shiftCard.upcoming.headline("1h"),
      live: false,
      percent: null,
    });
    expect(
      ShiftCardUtils.shiftCardModel({
        ...base,
        myShift: alex,
        now: new Date(2026, 9, 10, 19),
      }),
    ).toMatchObject({
      statusLabel: L.shiftCard.finished.status,
      percent: 100,
    });
    expect(
      ShiftCardUtils.shiftCardModel({ ...base, myShift: undefined, now: NOW }),
    ).toMatchObject({
      statusLabel: L.shiftCard.notRostered.status,
      percent: null,
    });
  });
});
