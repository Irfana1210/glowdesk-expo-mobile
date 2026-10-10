import { LOCALE } from "@/constants/locale";

import { type StatusBadgeProps } from "@/components/ui/status-badge";

import { type StockStatus } from "./types";

export const STOCK_STATUS_META: Record<StockStatus, StatusBadgeProps> = {
  IN_STOCK: {
    label: LOCALE.inventory.stockStatus.inStock,
    icon: "checkmark",
    tone: "inStock",
  },
  LOW_STOCK: {
    label: LOCALE.inventory.stockStatus.lowStock,
    icon: "alert-circle-outline",
    tone: "lowStock",
  },
  OUT_OF_STOCK: {
    label: LOCALE.inventory.stockStatus.outOfStock,
    icon: "close",
    tone: "outOfStock",
  },
};
