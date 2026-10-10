import { useEffect } from 'react';

import { useOrdersStore, type LoadStatus } from '../store/useOrdersStore';

/**
 * Starts the initial order load if nothing has loaded yet. Screens reachable by deep link
 * (details, scanner, completion) call this so they work on a cold start.
 */
export function useEnsureOrdersLoaded(): LoadStatus {
  const loadStatus = useOrdersStore((s) => s.loadStatus);
  const loadOrders = useOrdersStore((s) => s.loadOrders);

  useEffect(() => {
    if (loadStatus === 'idle') void loadOrders();
  }, [loadStatus, loadOrders]);

  return loadStatus;
}
