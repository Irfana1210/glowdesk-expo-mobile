/**
 * Content of the dark "your shift" card, from the signed-in person's shift today. Pure function.
 */
import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { CoverUtils } from "@/features/roster/domain/cover";
import { type Shift } from "@/features/roster/types";

import { type ShiftCardProps } from "@/components/ui/shift-card";

type ShiftCardInput = {
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
      {
        value: String(staffOnFloor),
        label: LOCALE.dashboard.shiftCard.stats.onTheFloor,
      },
      {
        value: nextBreakAt
          ? FormatUtils.formatClockCompact(nextBreakAt)
          : LOCALE.dashboard.shiftCard.noValue,
        label: LOCALE.dashboard.shiftCard.stats.nextBreak,
      },
      {
        value: String(ordersToAssign),
        label: LOCALE.dashboard.shiftCard.stats.ordersToAssign(ordersToAssign),
      },
    ];

    if (!myShift) {
      return {
        statusLabel: LOCALE.dashboard.shiftCard.notRostered.status,
        live: false,
        timeRange: LOCALE.dashboard.shiftCard.notRostered.timeRange,
        headline: LOCALE.dashboard.shiftCard.notRostered.headline,
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
          statusLabel: LOCALE.dashboard.shiftCard.upcoming.status,
          live: false,
          timeRange,
          headline: LOCALE.dashboard.shiftCard.upcoming.headline(
            FormatUtils.formatDuration(progress.minutesRemaining),
          ),
          percent: null,
          stats,
        };
      case "finished":
        return {
          statusLabel: LOCALE.dashboard.shiftCard.finished.status,
          live: false,
          timeRange,
          headline: LOCALE.dashboard.shiftCard.finished.headline,
          percent: 100,
          stats,
        };
      case "active":
        return {
          statusLabel: LOCALE.dashboard.shiftCard.active.status,
          live: true,
          timeRange,
          headline: LOCALE.dashboard.shiftCard.active.headline(
            FormatUtils.formatDuration(progress.minutesRemaining),
          ),
          percent: progress.percent,
          stats,
        };
    }
  }
}
