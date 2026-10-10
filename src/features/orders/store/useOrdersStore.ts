/**
 * MVP order state (brief §9), persisted on the device with expo-sqlite's key-value store.
 * All business rules live in the pure domain modules. This store only applies their results.
 *
 * When the Supabase backend arrives, fetched orders move to TanStack Query and this store
 * shrinks to local UI state plus the offline mutation queue.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS, persistStorage } from '@/database/storage';
import { fetchOrders } from '@/features/orders/api/ordersApi';
import { OrderTransitionError, markOrderReady, startPicking } from '@/features/orders/domain/orderStateMachine';
import { assignOrder, cancelOrder } from '@/features/orders/domain/assignment';
import { recordPick, type PickResult } from '@/features/orders/domain/picking';
import type { Order, OrderStatus } from '@/types/order';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type ActionResult = { ok: true } | { ok: false; message: string };

interface OrdersState {
  orders: Order[];
  loadStatus: LoadStatus;
  loadError: string | null;
  isRefreshing: boolean;
  loadOrders: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  startPicking: (orderId: string) => ActionResult;
  markReady: (orderId: string) => ActionResult;
  scanItem: (orderId: string, barcode: string) => PickResult;
  /** Assigns a New or Picking order, or unassigns it when no employee is given. */
  assignOrder: (orderId: string, employeeId: string | undefined) => ActionResult;
  cancelOrder: (orderId: string) => ActionResult;
  resetDemoData: () => Promise<void>;
}

export const ORDERS_STORAGE_KEY = STORAGE_KEYS.orders;
/**
 * v2: demo orders were replaced with the design-handoff data set (same IDs, different products).
 * Older saved demo orders are dropped rather than mixed with the new ones.
 */
export const ORDERS_STORAGE_VERSION = 2;

const PRIORITY_RANK = { HIGH: 0, STANDARD: 1 } as const;

export function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority ?? 'STANDARD'] - PRIORITY_RANK[b.priority ?? 'STANDARD'] ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

/**
 * Combines two copies of the order set. Orders present in only one copy are kept, and when
 * both have an order the higher version wins (local wins ties). Refreshes and app restarts
 * therefore never discard picking progress.
 */
export function mergeByVersion(local: Order[], incoming: Order[]): Order[] {
  const merged = new Map(incoming.map((order) => [order.id, order]));
  for (const order of local) {
    const other = merged.get(order.id);
    if (!other || order.version >= other.version) merged.set(order.id, order);
  }
  return [...merged.values()];
}

const ORDER_STATUSES: readonly OrderStatus[] = ['NEW', 'PICKING', 'READY', 'COLLECTED', 'CANCELLED'];

/** Guards against corrupted or outdated data on disk. Invalid records are dropped, not trusted. */
export function isPersistedOrder(value: unknown): value is Order {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.storeId === 'string' &&
    typeof o.customerInitials === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.version === 'number' &&
    ORDER_STATUSES.includes(o.status as OrderStatus) &&
    Array.isArray(o.items) &&
    o.items.every(
      (i: unknown) =>
        typeof i === 'object' &&
        i !== null &&
        typeof (i as OrderItemLike).id === 'string' &&
        typeof (i as OrderItemLike).barcode === 'string' &&
        typeof (i as OrderItemLike).requiredQuantity === 'number' &&
        typeof (i as OrderItemLike).pickedQuantity === 'number',
    )
  );
}
type OrderItemLike = { id?: unknown; barcode?: unknown; requiredQuantity?: unknown; pickedQuantity?: unknown };

function errorMessage(error: unknown): string {
  if (error instanceof OrderTransitionError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

/** Resolves once saved orders have been read from disk, so a fetch never races hydration. */
function waitForHydration(): Promise<void> {
  if (useOrdersStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = useOrdersStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => {
      const replaceOrder = (updated: Order) =>
        set({ orders: get().orders.map((order) => (order.id === updated.id ? updated : order)) });

      const applyTransition = (orderId: string, transition: (order: Order) => Order): ActionResult => {
        const current = get().orders.find((order) => order.id === orderId);
        if (!current) return { ok: false, message: 'Order not found.' };
        try {
          replaceOrder(transition(current));
          return { ok: true };
        } catch (error) {
          return { ok: false, message: errorMessage(error) };
        }
      };

      return {
        orders: [],
        loadStatus: 'idle',
        loadError: null,
        isRefreshing: false,

        loadOrders: async () => {
          if (get().loadStatus === 'loading') return;
          set({ loadStatus: 'loading', loadError: null });
          try {
            await waitForHydration();
            const incoming = await fetchOrders();
            set({ orders: sortOrders(mergeByVersion(get().orders, incoming)), loadStatus: 'ready' });
          } catch (error) {
            // Saved orders are still usable when the fetch fails.
            set({ loadStatus: get().orders.length > 0 ? 'ready' : 'error', loadError: errorMessage(error) });
          }
        },

        refreshOrders: async () => {
          if (get().isRefreshing) return;
          set({ isRefreshing: true });
          try {
            const incoming = await fetchOrders();
            set({ orders: sortOrders(mergeByVersion(get().orders, incoming)), loadStatus: 'ready', loadError: null });
          } catch (error) {
            set({ loadError: errorMessage(error) });
          } finally {
            set({ isRefreshing: false });
          }
        },

        startPicking: (orderId) => applyTransition(orderId, startPicking),
        markReady: (orderId) => applyTransition(orderId, markOrderReady),
        assignOrder: (orderId, employeeId) => applyTransition(orderId, (order) => assignOrder(order, employeeId)),
        cancelOrder: (orderId) => applyTransition(orderId, cancelOrder),

        scanItem: (orderId, barcode) => {
          const current = get().orders.find((order) => order.id === orderId);
          if (!current) return { ok: false, code: 'ORDER_NOT_PICKING', message: 'Order not found.' };
          const result = recordPick(current, barcode);
          if (result.ok) replaceOrder(result.order);
          return result;
        },

        resetDemoData: async () => {
          set({ orders: [], loadStatus: 'loading', loadError: null });
          try {
            set({ orders: sortOrders(await fetchOrders()), loadStatus: 'ready' });
          } catch (error) {
            set({ loadStatus: 'error', loadError: errorMessage(error) });
          }
        },
      };
    },
    {
      name: ORDERS_STORAGE_KEY,
      version: ORDERS_STORAGE_VERSION,
      migrate: (persisted, fromVersion) => (fromVersion < ORDERS_STORAGE_VERSION ? {} : persisted) as never,
      storage: persistStorage,
      // Only domain data is saved. Loading flags are runtime state.
      partialize: (state) => ({ orders: state.orders }),
      merge: (persisted, current) => {
        const saved = (persisted as { orders?: unknown } | undefined)?.orders;
        const valid = Array.isArray(saved) ? saved.filter(isPersistedOrder) : [];
        return { ...current, orders: sortOrders(mergeByVersion(valid, current.orders)) };
      },
    },
  ),
);

export const selectOrderById = (orderId: string | undefined) => (state: OrdersState) =>
  orderId ? state.orders.find((order) => order.id === orderId) : undefined;
