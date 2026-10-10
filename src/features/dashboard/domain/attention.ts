/**
 * Builds the dashboard's "Needs attention" list from orders, roster and stock. Pure function.
 */
import { formatClockTime, formatDuration } from "@/utils/format-utils";

import { needsReplenishment } from "@/features/inventory/domain/stock";
import { type InventoryItem } from "@/features/inventory/types";
import {
  minutesOverdue,
  overdueOrders,
} from "@/features/orders/domain/schedule";
import {
  breakNeedsCover,
  type UpcomingBreak,
} from "@/features/roster/domain/cover";

import { type IconName } from "@/components/ui/button";

import { type StatusTone } from "@/theme";
import { type Order } from "@/types/order";

export type AttentionEntry = {
  href: "/orders" | "/roster" | "/inventory";
  icon: IconName;
  key: "orders" | "breakCover" | "stock";
  subtitle: string;
  title: string;
  tone: StatusTone;
};

export type AttentionInput = {
  breakEmployeeName?: string;
  /** Undefined while inventory is loading or unavailable; the stock item is then left out. */
  inventory?: Array<InventoryItem>;
  now: Date;
  orders: Array<Order>;
  upcomingBreak: UpcomingBreak | null;
};

/** Product name without the shade or variant, e.g. "Soft Focus Blush · Rosewood" → "Soft Focus Blush". */
function shortName(name: string): string {
  return name.split(" · ")[0] ?? name;
}

export function buildAttention({
  orders,
  upcomingBreak,
  breakEmployeeName,
  inventory,
  now,
}: AttentionInput): Array<AttentionEntry> {
  const entries: Array<AttentionEntry> = [];

  const overdue = overdueOrders(orders, now);
  const oldest = overdue[0];
  if (oldest) {
    entries.push({
      key: "orders",
      title: `${overdue.length} ${overdue.length === 1 ? "order" : "orders"} overdue`,
      subtitle: `Oldest has waited ${formatDuration(minutesOverdue(oldest, now))} past due`,
      icon: "time-outline",
      tone: "overdue",
      href: "/orders",
    });
  }

  if (upcomingBreak && breakNeedsCover(upcomingBreak, now)) {
    entries.push({
      key: "breakCover",
      title: `Break cover at ${formatClockTime(upcomingBreak.startsAt)}`,
      subtitle: `${breakEmployeeName ?? "Team member"} · ${upcomingBreak.shift.unpaidBreakMinutes} min break`,
      icon: "people-outline",
      tone: "picking",
      href: "/roster",
    });
  }

  const low = (inventory ?? []).filter(needsReplenishment);
  const first = low[0];
  if (first) {
    const more = low.length - 1;
    entries.push({
      key: "stock",
      title: `${low.length} ${low.length === 1 ? "product" : "products"} low or out`,
      subtitle: `${first.product.brand} ${shortName(first.product.name)}${more > 0 ? ` and ${more} more` : ""}`,
      icon: "cube-outline",
      tone: "lowStock",
      href: "/inventory",
    });
  }

  return entries;
}
