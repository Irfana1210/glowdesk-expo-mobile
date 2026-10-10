/**
 * Click & Collect orders from the Orders and Order Details mockups (docs/screens).
 *
 * Times are stored as minutes before `now`, matching the mockup at 4:40 pm: order 7841 was
 * placed at 1:47 pm, so it is 53 minutes past its 2-hour pickup window whenever the demo runs.
 * Two Collected orders and one Cancelled order are added so every filter has data.
 */
import { type Order, type OrderItem, type OrderStatus } from "@/types/order";

import { MOCK_PRODUCTS, type MockProductKey } from "./products";
import { DEMO_STORE_ID } from "./store";

type OrderSeed = {
  assigneeId?: string;
  id: string;
  initials: string;
  itemCount: number;
  placedMinutesAgo: number;
  readyMinutesAgo?: number;
  status: OrderStatus;
};

/** [id, initials, items, placed (min ago), status, assignee, ready (min ago)] from the Orders mockup. */
const SEEDS: Array<OrderSeed> = [
  {
    id: "7841",
    initials: "J.L.",
    itemCount: 5,
    placedMinutesAgo: 173,
    status: "PICKING",
    assigneeId: "emp-02",
  },
  {
    id: "7845",
    initials: "F.A.",
    itemCount: 2,
    placedMinutesAgo: 155,
    status: "PICKING",
    assigneeId: "emp-03",
  },
  {
    id: "7846",
    initials: "C.D.",
    itemCount: 3,
    placedMinutesAgo: 139,
    status: "NEW",
  },
  {
    id: "7843",
    initials: "P.M.",
    itemCount: 2,
    placedMinutesAgo: 116,
    status: "PICKING",
    assigneeId: "emp-04",
  },
  {
    id: "7844",
    initials: "B.S.",
    itemCount: 3,
    placedMinutesAgo: 90,
    status: "PICKING",
    assigneeId: "emp-03",
  },
  {
    id: "7842",
    initials: "K.O.",
    itemCount: 1,
    placedMinutesAgo: 65,
    status: "PICKING",
    assigneeId: "emp-04",
  },
  {
    id: "7852",
    initials: "S.C.",
    itemCount: 3,
    placedMinutesAgo: 9,
    status: "NEW",
  },
  {
    id: "7851",
    initials: "M.K.",
    itemCount: 2,
    placedMinutesAgo: 22,
    status: "NEW",
  },
  {
    id: "7850",
    initials: "H.B.",
    itemCount: 1,
    placedMinutesAgo: 38,
    status: "NEW",
  },
  {
    id: "7849",
    initials: "O.R.",
    itemCount: 4,
    placedMinutesAgo: 56,
    status: "NEW",
  },
  {
    id: "7848",
    initials: "T.N.",
    itemCount: 2,
    placedMinutesAgo: 80,
    status: "NEW",
  },
  {
    id: "7847",
    initials: "L.W.",
    itemCount: 1,
    placedMinutesAgo: 102,
    status: "NEW",
  },
  {
    id: "7840",
    initials: "R.W.",
    itemCount: 4,
    placedMinutesAgo: 225,
    status: "READY",
    assigneeId: "emp-05",
    readyMinutesAgo: 180,
  },
  {
    id: "7838",
    initials: "A.P.",
    itemCount: 2,
    placedMinutesAgo: 338,
    status: "READY",
    assigneeId: "emp-05",
    readyMinutesAgo: 300,
  },
  {
    id: "7837",
    initials: "D.N.",
    itemCount: 1,
    placedMinutesAgo: 359,
    status: "READY",
    assigneeId: "emp-06",
    readyMinutesAgo: 305,
  },
  {
    id: "7835",
    initials: "E.T.",
    itemCount: 3,
    placedMinutesAgo: 1500,
    status: "READY",
    assigneeId: "emp-01",
    readyMinutesAgo: 1440,
  },
  {
    id: "7833",
    initials: "G.H.",
    itemCount: 2,
    placedMinutesAgo: 1560,
    status: "READY",
    assigneeId: "emp-01",
    readyMinutesAgo: 1450,
  },
  // Added so the Collected filter and terminal states have data.
  {
    id: "7831",
    initials: "V.P.",
    itemCount: 1,
    placedMinutesAgo: 1650,
    status: "CANCELLED",
  },
  {
    id: "7830",
    initials: "N.B.",
    itemCount: 2,
    placedMinutesAgo: 1700,
    status: "COLLECTED",
    assigneeId: "emp-05",
    readyMinutesAgo: 1600,
  },
  {
    id: "7829",
    initials: "Y.C.",
    itemCount: 1,
    placedMinutesAgo: 1800,
    status: "COLLECTED",
    assigneeId: "emp-01",
    readyMinutesAgo: 1700,
  },
];

/** Order 7841's lines exactly as the Order Details mockup shows them: 2 of 6 units picked. */
const ORDER_7841_LINES: Array<[MockProductKey, number, number]> = [
  ["lumenCream", 1, 1],
  ["velourBlush", 2, 0],
  ["saltwaterToner", 1, 1],
  ["petalLipOil", 1, 0],
  ["koriHairOil", 1, 0],
];

/** Order 7842 is fully picked, so "Mark ready" can be demonstrated. */
const FULLY_PICKED = new Set(["7842"]);

const VERSION: Record<OrderStatus, number> = {
  NEW: 1,
  PICKING: 3,
  READY: 5,
  COLLECTED: 6,
  CANCELLED: 2,
};

const PRODUCT_ORDER = Object.keys(MOCK_PRODUCTS) as Array<MockProductKey>;

function line(
  orderId: string,
  index: number,
  key: MockProductKey,
  required: number,
  picked: number,
): OrderItem {
  const p = MOCK_PRODUCTS[key];
  return {
    id: `ORD-${orderId}-L${index + 1}`,
    productId: p.id,
    sku: p.sku,
    barcode: p.barcode,
    brand: p.brand,
    name: p.name,
    requiredQuantity: required,
    pickedQuantity: picked,
  };
}

function buildItems(seed: OrderSeed, seedIndex: number): Array<OrderItem> {
  if (seed.id === "7841") {
    return ORDER_7841_LINES.map(([key, req, picked], i) =>
      line(seed.id, i, key, req, picked),
    );
  }

  return Array.from({ length: seed.itemCount }, (_, i) => {
    const key = PRODUCT_ORDER[
      (seedIndex * 2 + i) % PRODUCT_ORDER.length
    ] as MockProductKey;
    const required = i === 1 ? 2 : 1;
    const allPicked =
      seed.status === "READY" ||
      seed.status === "COLLECTED" ||
      FULLY_PICKED.has(seed.id);
    const picked = allPicked
      ? required
      : seed.status === "PICKING" && i === 0
        ? required
        : 0;
    return line(seed.id, i, key, required, picked);
  });
}

export function createMockOrders(now: Date = new Date()): Array<Order> {
  const ago = (minutes: number) =>
    new Date(now.getTime() - minutes * 60_000).toISOString();
  return SEEDS.map((seed, index) => ({
    id: `ORD-${seed.id}`,
    storeId: DEMO_STORE_ID,
    customerInitials: seed.initials,
    status: seed.status,
    version: VERSION[seed.status],
    createdAt: ago(seed.placedMinutesAgo),
    priority: "STANDARD",
    items: buildItems(seed, index),
    ...(seed.assigneeId ? { assigneeId: seed.assigneeId } : {}),
    ...(seed.readyMinutesAgo !== undefined
      ? { readyAt: ago(seed.readyMinutesAgo) }
      : {}),
  }));
}
