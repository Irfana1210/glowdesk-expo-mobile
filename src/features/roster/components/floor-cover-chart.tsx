import { type FC } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { AppText } from "@/components/ui/app-text";
import { SecondaryButton } from "@/components/ui/secondary-button";

import { colors, fontFamily, spacing, statusPalette } from "@/theme";

import { CoverUtils, type HourCover } from "../domain/cover";

const L = LOCALE.roster.floorCover;

const BAR_UNIT = 10;

function spoken(hour: number): string {
  return FormatUtils.formatHour(hour).replace(/(am|pm)$/, " $1");
}

type Props = {
  /** Below-minimum hours that can still be fixed. Only these respond to taps. */
  actionableHours: Array<number>;
  cover: Array<HourCover>;
  onAddCover: (hour: number) => void;
};

/**
 * One bar per trading hour, labelled with its headcount. Hours below minimum are flagged in
 * text too. A below-minimum hour that is not over yet can be tapped to add a shift starting
 * then, and the note offers the same action as a full-size button for the first such hour.
 */
export const FloorCoverChart: FC<Props> = ({
  actionableHours,
  cover,
  onAddCover,
}) => {
  const max = Math.max(
    CoverUtils.MIN_FLOOR_COVER,
    ...cover.map((h) => h.count),
  );
  const low = CoverUtils.hoursBelowMinimum(cover);
  const firstActionable = actionableHours[0];

  return (
    <View style={styles.container}>
      <View style={styles.plot} testID="FLOOR_COVER_CHART.COVER">
        {cover.map((h, index) => {
          const label = FormatUtils.formatHourShort(h.hour, index === 0);
          const content = (
            <>
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
                {label}
              </AppText>
            </>
          );
          const testID = `FLOOR_COVER_CHART.COVER.${h.hour}.${h.count}${h.belowMinimum ? ".LOW" : ""}`;

          if (actionableHours.includes(h.hour)) {
            return (
              <Pressable
                accessibilityHint={L.addCoverHint}
                accessibilityLabel={L.hourLabelLow(
                  spoken(h.hour),
                  h.count,
                  CoverUtils.MIN_FLOOR_COVER,
                )}
                accessibilityRole="button"
                key={h.hour}
                style={({ pressed }) => [
                  styles.column,
                  pressed && styles.pressed,
                ]}
                testID={testID}
                onPress={() => onAddCover(h.hour)}
              >
                {content}
              </Pressable>
            );
          }
          return (
            <View
              accessible
              accessibilityLabel={L.hourLabel(spoken(h.hour), h.count)}
              key={h.hour}
              style={styles.column}
              testID={testID}
            >
              {content}
            </View>
          );
        })}
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
      {firstActionable === undefined ? null : (
        <SecondaryButton
          accessibilityHint={L.addCoverHint}
          icon="add"
          label={L.addCover(spoken(firstActionable))}
          testID="FLOOR_COVER_CHART.ADD_COVER"
          onPress={() => onAddCover(firstActionable)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  plot: { flexDirection: "row", gap: 4, alignItems: "flex-end" },
  column: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  pressed: { backgroundColor: statusPalette.overdue.background },
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
