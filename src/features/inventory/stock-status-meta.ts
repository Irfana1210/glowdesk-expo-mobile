import { type StatusBadgeProps } from "@/components/ui/status-badge";

import { type StockStatus } from "./types";

export const STOCK_STATUS_META: Record<StockStatus, StatusBadgeProps> = {
  IN_STOCK: { label: "In stock", icon: "checkmark", tone: "inStock" },
  LOW_STOCK: {
    label: "Low stock",
    icon: "alert-circle-outline",
    tone: "lowStock",
  },
  OUT_OF_STOCK: { label: "Out of stock", icon: "close", tone: "outOfStock" },
};
