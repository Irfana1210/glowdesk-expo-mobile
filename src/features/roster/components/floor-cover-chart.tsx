import { type FC } from "react";
import { StyleSheet, View } from "react-native";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { AppText } from "@/components/ui/app-text";

import { colors, fontFamily, spacing, statusPalette } from "@/theme";

import { CoverUtils, type HourCover } from "../domain/cover";

const L = LOCALE.roster.floorCover;

const BAR_UNIT = 10;

function spoken(hour: number): string {
  return FormatUtils.formatHour(hour).replace(/(am|pm)$/, " $1");
}

function describeCover(cover: Array<HourCover>): string {
  if (cover.length === 0) {
    return L.noTradingHours;
  }
  const first = cover[0]!;
  const last = cover[cover.length - 1]!;
  const lowest = cover.reduce(
    (min, h) => (h.count < min.count ? h : min),
    first,
  );
  const range = L.range(spoken(first.hour), spoken(last.hour));
  return lowest.belowMinimum
    ? L.belowMinimum(
        range,
        lowest.count,
        spoken(lowest.hour),
        CoverUtils.MIN_FLOOR_COVER,
      )
    : L.allDay(range, CoverUtils.MIN_FLOOR_COVER);
}

/** One bar per trading hour, labelled with its headcount. Hours below minimum are flagged in text too. */
export const FloorCoverChart: FC<{ cover: Array<HourCover> }> = ({ cover }) => {
  const max = Math.max(
    CoverUtils.MIN_FLOOR_COVER,
    ...cover.map((h) => h.count),
  );
  const low = CoverUtils.hoursBelowMinimum(cover);

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityLabel={describeCover(cover)}
        accessibilityRole="image"
        style={styles.plot}
        testID="FLOOR_COVER_CHART.COVER"
      >
        {cover.map((h, index) => (
          <View
            key={h.hour}
            style={styles.column}
            testID={`FLOOR_COVER_CHART.COVER.${h.hour}.${h.count}${h.belowMinimum ? ".LOW" : ""}`}
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
              {FormatUtils.formatHourShort(h.hour, index === 0)}
            </AppText>
          </View>
        ))}
      </View>
      <AppText
        accessibilityLiveRegion="polite"
        style={[styles.note, low.length > 0 && styles.noteLow]}
        testID="FLOOR_COVER_CHART.NOTE"
      >
        {low.length > 0
          ? L.belowMinimumNote(
              CoverUtils.MIN_FLOOR_COVER,
              low.map(spoken).join(", "),
            )
          : L.allDayNote(CoverUtils.MIN_FLOOR_COVER)}
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
