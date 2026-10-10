/**
 * Content of the dark "your shift" card, from the signed-in person's shift today. Pure function.
 */
import { shiftProgress } from "@/features/roster/domain/cover";
import { type Shift } from "@/features/roster/types";

import { type ShiftCardProps } from "@/components/ui";

import {
  formatClockCompact,
  formatDuration,
  formatTimeRange,
} from "@/lib/format";

export type ShiftCardInput = {
  myShift: Shift | undefined;
  nextBreakAt: Date | null;
  now: Date;
  ordersToAssign: number;
  staffOnFloor: number;
};

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
      value: nextBreakAt ? formatClockCompact(nextBreakAt) : "—",
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

  const timeRange = formatTimeRange(
    new Date(myShift.startAt),
    new Date(myShift.endAt),
  );
  const progress = shiftProgress(myShift, now);
  switch (progress.phase) {
    case "upcoming":
      return {
        statusLabel: "Starts later",
        live: false,
        timeRange,
        headline: `Starts in ${formatDuration(progress.minutesRemaining)}`,
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
        headline: `${formatDuration(progress.minutesRemaining)} left`,
        percent: progress.percent,
        stats,
      };
  }
}
