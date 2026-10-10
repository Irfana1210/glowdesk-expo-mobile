/** Order domain model (brief §7). */
export type OrderStatus = 'NEW' | 'PICKING' | 'READY' | 'COLLECTED' | 'CANCELLED';

/**
 * Not in the brief's minimal model, but the Order List screen (§6) needs a
 * priority indicator. Optional so the core contract stays unchanged.
 */
export type OrderPriority = 'STANDARD' | 'HIGH';

export interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  name: string;
  requiredQuantity: number;
  pickedQuantity: number;
  /** Optional brand line shown above the product name. */
  brand?: string;
}

export interface Order {
  id: string;
  storeId: string;
  customerInitials: string;
  status: OrderStatus;
  version: number;
  createdAt: string;
  items: OrderItem[];
  priority?: OrderPriority;
  /** Team member picking or packing the order. Unassigned when absent. */
  assigneeId?: string;
  /** When the order moved to READY. Set by the state machine; drives "Waiting 3h". */
  readyAt?: string;
}
