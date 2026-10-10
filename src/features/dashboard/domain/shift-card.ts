/**
 * Content of the dark "your shift" card, from the signed-in person's shift today. Pure function.
 */
import { FormatUtils } from "@/utils/format-utils";

import { CoverUtils } from "@/features/roster/domain/cover";
import { type Shift } from "@/features/roster/types";

import { type ShiftCardProps } from "@/components/ui/shift-card";

export type ShiftCardInput = {
  myShift: Shift | undefined;
  nextBreakAt: Date | null;
  now: Date;
  ordersToAssign: number;
  staffOnFloor: number;
};

export namespace ShiftCardUtils {
  export function shiftCardModel({
    myShift,
    now,
    staffOnFloor,
    nextBreakAt,
    ordersToAssign,
  }: ShiftCardInput): ShiftCardProps {
    const stats = [
      { value: String(staffOnFloor), label: "on the floor" },
      {
        value: nextBreakAt ? FormatUtils.formatClockCompact(nextBreakAt) : "—",
        label: "next break",
      },
      {
        value: String(ordersToAssign),
        label: ordersToAssign === 1 ? "order to assign" : "orders to assign",
      },
    ];

    if (!myShift) {
      return {
        statusLabel: "Not rostered",
        live: false,
        timeRange: "No shift today",
        headline: "Day off",
        percent: null,
        stats,
      };
    }

    const timeRange = FormatUtils.formatTimeRange(
      new Date(myShift.startAt),
      new Date(myShift.endAt),
    );
    const progress = CoverUtils.shiftProgress(myShift, now);
    switch (progress.phase) {
      case "upcoming":
        return {
          statusLabel: "Starts later",
          live: false,
          timeRange,
          headline: `Starts in ${FormatUtils.formatDuration(progress.minutesRemaining)}`,
          percent: null,
          stats,
        };
      case "finished":
        return {
          statusLabel: "Shift finished",
          live: false,
          timeRange,
          headline: "All done today",
          percent: 100,
          stats,
        };
      case "active":
        return {
          statusLabel: "On shift",
          live: true,
          timeRange,
          headline: `${FormatUtils.formatDuration(progress.minutesRemaining)} left`,
          percent: progress.percent,
          stats,
        };
    }
  }
}
