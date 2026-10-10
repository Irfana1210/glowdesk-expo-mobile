import {
  AssignmentError,
  assignOrder,
  cancelOrder,
} from "@/features/orders/domain/assignment";
import {
  getUnitProgress,
  OrderTransitionError,
} from "@/features/orders/domain/order-state-machine";

import { createMockOrders } from "@/mocks/orders";
import { type Order } from "@/types/order";

const orders = createMockOrders(new Date(2026, 9, 10, 16, 40));
const order = (id: string): Order => {
  const found = orders.find((o) => o.id === `ORD-${id}`);
  if (!found) {
    throw new Error(`missing ${id}`);
  }
  return found;
};

describe("assignOrder", () => {
  it("assigns and bumps the version without mutating the input", () => {
    const input = order("7846");
    const result = assignOrder(input, "emp-03");

    expect(result.assigneeId).toBe("emp-03");
    expect(result.version).toBe(input.version + 1);
    expect(input.assigneeId).toBeUndefined();
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("unassigns when no employee is given", () => {
    expect("assigneeId" in assignOrder(order("7841"), undefined)).toBe(false);
  });

  it.each(["7840", "7830", "7831"])(
    "refuses to reassign finished order %s",
    (id) => {
      expect(() => assignOrder(order(id), "emp-02")).toThrow(AssignmentError);
    },
  );
});

describe("cancelOrder", () => {
  it("cancels New and Picking orders through the state machine", () => {
    expect(cancelOrder(order("7846")).status).toBe("CANCELLED");
    expect(cancelOrder(order("7841")).status).toBe("CANCELLED");
  });

  it("refuses to cancel a Ready order", () => {
    expect(() => cancelOrder(order("7840"))).toThrow(OrderTransitionError);
  });
});

describe("getUnitProgress", () => {
  it("counts units, as the Order Details mockup does", () => {
    expect(getUnitProgress(order("7841"))).toEqual({
      pickedUnits: 2,
      totalUnits: 6,
      remainingUnits: 4,
      ratio: 2 / 6,
      percent: 33,
    });
  });

  it("never counts over-picked units and is safe with no items", () => {
    const over = {
      ...order("7842"),
      items: order("7842").items.map((i) => ({
        ...i,
        pickedQuantity: i.requiredQuantity + 3,
      })),
    };
    expect(getUnitProgress(over).percent).toBe(100);
    expect(getUnitProgress({ ...order("7841"), items: [] })).toEqual({
      pickedUnits: 0,
      totalUnits: 0,
      remainingUnits: 0,
      ratio: 0,
      percent: 0,
    });
  });
});
