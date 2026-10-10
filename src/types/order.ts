/** Order domain model (brief §7). */
export type OrderStatus =
  | "NEW"
  | "PICKING"
  | "READY"
  | "COLLECTED"
  | "CANCELLED";

/**
 * Not in the brief's minimal model, but the Order List screen (§6) needs a
 * priority indicator. Optional so the core contract stays unchanged.
 */
export type OrderPriority = "STANDARD" | "HIGH";

export type OrderItem = {
  barcode: string;
  /** Optional brand line shown above the product name. */
  brand?: string;
  id: string;
  name: string;
  pickedQuantity: number;
  productId: string;
  requiredQuantity: number;
  sku: string;
};

export type Order = {
  /** Team member picking or packing the order. Unassigned when absent. */
  assigneeId?: string;
  createdAt: string;
  customerInitials: string;
  id: string;
  items: Array<OrderItem>;
  priority?: OrderPriority;
  /** When the order moved to READY. Set by the state machine; drives "Waiting 3h". */
  readyAt?: string;
  status: OrderStatus;
  storeId: string;
  version: number;
};
