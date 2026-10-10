import { type FC } from "react";
import { StyleSheet, View } from "react-native";

import { formatHour, formatHourShort } from "@/utils/format-utils";

import { AppText } from "@/components/ui/app-text";

import { colors, fontFamily, spacing, statusPalette } from "@/theme";

import {
  type HourCover,
  hoursBelowMinimum,
  MIN_FLOOR_COVER,
} from "../domain/cover";

const BAR_UNIT = 10;

function spoken(hour: number): string {
  return formatHour(hour).replace(/(am|pm)$/, " $1");
}

export function describeCover(cover: Array<HourCover>): string {
  if (cover.length === 0) {
    return "No trading hours.";
  }
  const first = cover[0]!;
  const last = cover[cover.length - 1]!;
  const lowest = cover.reduce(
    (min, h) => (h.count < min.count ? h : min),
    first,
  );
  const range = `Staff on the floor by hour, ${spoken(first.hour)} to ${spoken(last.hour)}.`;
  const people = lowest.count === 1 ? "person" : "people";
  return lowest.belowMinimum
    ? `${range} Lowest is ${lowest.count} ${people} at ${spoken(lowest.hour)}, below the minimum of ${MIN_FLOOR_COVER}.`
    : `${range} At least ${MIN_FLOOR_COVER} people all day.`;
}

/** One bar per trading hour, labelled with its headcount. Hours below minimum are flagged in text too. */
export const FloorCoverChart: FC<{ cover: Array<HourCover> }> = ({ cover }) => {
  const max = Math.max(MIN_FLOOR_COVER, ...cover.map((h) => h.count));
  const low = hoursBelowMinimum(cover);

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityLabel={describeCover(cover)}
        accessibilityRole="image"
        style={styles.plot}
        testID="floor-cover"
      >
        {cover.map((h, index) => (
          <View
            key={h.hour}
            style={styles.column}
            testID={`cover-${h.hour}-${h.count}${h.belowMinimum ? "-low" : ""}`}
          >
            <AppText
              maxFontSizeMultiplier={1.1}
              style={[styles.count, h.belowMinimum && styles.countLow]}
            >
              {h.count}
            </AppText>
            <View style={[styles.barArea, { height: max * BAR_UNIT }]}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(2, h.count * BAR_UNIT) },
                  h.belowMinimum ? styles.barLow : styles.barOk,
                ]}
              />
            </View>
            <AppText maxFontSizeMultiplier={1.1} style={styles.hour}>
              {formatHourShort(h.hour, index === 0)}
            </AppText>
          </View>
        ))}
      </View>
      <AppText
        accessibilityLiveRegion="polite"
        style={[styles.note, low.length > 0 && styles.noteLow]}
        testID="cover-note"
      >
        {low.length > 0
          ? `Below minimum of ${MIN_FLOOR_COVER} at ${low.map(spoken).join(", ")}`
          : `At least ${MIN_FLOOR_COVER} on the floor all day`}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  plot: { flexDirection: "row", gap: 4, alignItems: "flex-end" },
  column: { flex: 1, alignItems: "center", gap: spacing.xs },
  count: {
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    lineHeight: 13,
    color: colors.textMuted,
  },
  countLow: { color: colors.errorText },
  barArea: { width: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 4 },
  barOk: { backgroundColor: colors.accent },
  barLow: {
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: statusPalette.overdue.text,
    borderStyle: "dashed",
  },
  hour: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    lineHeight: 13,
    color: colors.textMuted,
  },
  note: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.successDark,
  },
  noteLow: { color: colors.errorText },
});
