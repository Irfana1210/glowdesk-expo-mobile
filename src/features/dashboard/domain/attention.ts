/**
 * Builds the dashboard's "Needs attention" list from orders, roster and stock. Pure function.
 */
import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { StockUtils } from "@/features/inventory/domain/stock";
import { type InventoryItem } from "@/features/inventory/types";
import { ScheduleUtils } from "@/features/orders/domain/schedule";
import { CoverUtils, type UpcomingBreak } from "@/features/roster/domain/cover";

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

export namespace AttentionUtils {
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

    const overdue = ScheduleUtils.overdueOrders(orders, now);
    const oldest = overdue[0];
    if (oldest) {
      entries.push({
        key: "orders",
        title: LOCALE.dashboard.attention.orders.title(overdue.length),
        subtitle: LOCALE.dashboard.attention.orders.subtitle(
          FormatUtils.formatDuration(ScheduleUtils.minutesOverdue(oldest, now)),
        ),
        icon: "time-outline",
        tone: "overdue",
        href: "/orders",
      });
    }

    if (upcomingBreak && CoverUtils.breakNeedsCover(upcomingBreak, now)) {
      entries.push({
        key: "breakCover",
        title: LOCALE.dashboard.attention.breakCover.title(
          FormatUtils.formatClockTime(upcomingBreak.startsAt),
        ),
        subtitle: LOCALE.dashboard.attention.breakCover.subtitle(
          breakEmployeeName ??
            LOCALE.dashboard.attention.breakCover.fallbackName,
          upcomingBreak.shift.unpaidBreakMinutes,
        ),
        icon: "people-outline",
        tone: "picking",
        href: "/roster",
      });
    }

    const low = (inventory ?? []).filter(StockUtils.needsReplenishment);
    const first = low[0];
    if (first) {
      const more = low.length - 1;
      entries.push({
        key: "stock",
        title: LOCALE.dashboard.attention.stock.title(low.length),
        subtitle: LOCALE.dashboard.attention.stock.subtitle(
          `${first.product.brand} ${shortName(first.product.name)}`,
          more,
        ),
        icon: "cube-outline",
        tone: "lowStock",
        href: "/inventory",
      });
    }

    return entries;
  }
}
