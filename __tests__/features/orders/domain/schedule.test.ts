import { markOrderReady } from "@/features/orders/domain/orderStateMachine";
import {
  dueAt,
  isOverdue,
  minutesOverdue,
  minutesWaiting,
  overdueOrders,
  sortForPicking,
  unassignedActiveCount,
} from "@/features/orders/domain/schedule";
import {
  assigneeLabel,
  orderCardModel,
  timingLabel,
} from "@/features/orders/presentation";

import { createMockOrders } from "@/mocks/orders";
import { type Order } from "@/types/order";

const NOW = new Date(2026, 9, 10, 16, 40);
const all = createMockOrders(NOW);
const order = (id: string): Order => {
  const found = all.find((o) => o.id === `ORD-${id}`);
  if (!found) {
    throw new Error(`missing ${id}`);
  }
  return found;
};

describe("due times and overdue", () => {
  it("makes an order due two hours after it is placed", () => {
    expect(dueAt(order("7841")).getHours()).toBe(15);
    expect(dueAt(order("7841")).getMinutes()).toBe(47);
  });

  it("marks only New and Picking orders past due as overdue", () => {
    expect(isOverdue(order("7841"), NOW)).toBe(true);
    expect(minutesOverdue(order("7841"), NOW)).toBe(53);
    expect(isOverdue(order("7843"), NOW)).toBe(false);
    expect(isOverdue(order("7838"), NOW)).toBe(false); // Ready orders are never overdue
    expect(minutesOverdue(order("7843"), NOW)).toBe(0);
  });

  it("lists overdue orders most overdue first, matching the mockup", () => {
    expect(overdueOrders(all, NOW).map((o) => o.id)).toEqual([
      "ORD-7841",
      "ORD-7845",
      "ORD-7846",
    ]);
  });

  it("counts unassigned work", () => {
    expect(unassignedActiveCount(all)).toBe(7);
  });
});

describe("sortForPicking", () => {
  it("puts overdue first, then active by due time, then ready, collected and cancelled", () => {
    const ids = sortForPicking(all, NOW).map((o) => o.id.replace("ORD-", ""));
    expect(ids.slice(0, 3)).toEqual(["7841", "7845", "7846"]);
    expect(ids.slice(3, 5)).toEqual(["7843", "7847"]);
    expect(ids.indexOf("7840")).toBeGreaterThan(ids.indexOf("7852"));
    expect(ids.slice(-3)).toEqual(["7830", "7829", "7831"]);
  });
});

describe("ready time", () => {
  it("is recorded when an order is marked ready", () => {
    const picked = { ...order("7842") };
    const ready = markOrderReady(picked, NOW);
    expect(ready.readyAt).toBe(NOW.toISOString());
    expect(minutesWaiting(ready, new Date(NOW.getTime() + 3 * 3_600_000))).toBe(
      180,
    );
  });
});

describe("order card text", () => {
  it("matches the mockup wording", () => {
    expect(timingLabel(order("7841"), NOW)).toBe("Overdue 53 min");
    expect(timingLabel(order("7843"), NOW)).toBe("Due 4:44 pm");
    expect(timingLabel(order("7840"), NOW)).toBe("Waiting 3h");
    expect(timingLabel(order("7835"), NOW)).toBe("Waiting 1 day");
    expect(assigneeLabel(order("7846"), undefined)).toBe("Unassigned");
    expect(assigneeLabel(order("7840"), "Aisha Rahman")).toBe(
      "Packed by Aisha Rahman",
    );
  });

  it("builds the summary line", () => {
    expect(orderCardModel(order("7841"), "Jordan Lee", NOW).summary).toBe(
      "5 items · placed 1:47 pm",
    );
    expect(orderCardModel(order("7835"), "Alex Morgan", NOW).summary).toBe(
      "3 items · placed yesterday",
    );
  });
});
