import { type FC } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";

import { colors, fontFamily } from "@/theme";

import {
  formatDayLabel,
  isSameDay,
  toDateKey,
  weekdayShort,
} from "../domain/dates";

type Props = {
  days: Array<Date>;
  onSelect: (date: Date) => void;
  selected: Date;
  today: Date;
};

/** Seven day buttons. The selected day is dark; today is announced to screen readers. */
export const WeekDaySelector: FC<Props> = ({
  days,
  selected,
  today,
  onSelect,
}) => {
  return (
    <View
      accessibilityLabel="Choose a day"
      accessibilityRole="tablist"
      style={styles.row}
    >
      {days.map((date) => {
        const isSelected = isSameDay(date, selected);
        const isToday = isSameDay(date, today);
        const textColor = isSelected ? colors.textOnDark : colors.text;
        return (
          <Pressable
            accessibilityLabel={`${formatDayLabel(date)}${isToday ? ", today" : ""}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            key={toDateKey(date)}
            style={[styles.day, isSelected ? styles.selected : styles.idle]}
            testID={`day-${toDateKey(date)}`}
            onPress={() => onSelect(date)}
          >
            <AppText
              maxFontSizeMultiplier={1.2}
              style={[
                styles.dow,
                { color: isSelected ? colors.textOnDark : colors.textMuted },
              ]}
            >
              {weekdayShort(date)}
            </AppText>
            <AppText
              maxFontSizeMultiplier={1.2}
              style={[styles.num, { color: textColor }]}
            >
              {date.getDate()}
            </AppText>
            <View
              style={[
                styles.todayDot,
                isToday ? { backgroundColor: textColor } : null,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  day: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  idle: { backgroundColor: colors.surface, borderColor: colors.border },
  selected: { backgroundColor: colors.inverse, borderColor: colors.inverse },
  dow: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 14 },
  num: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 20 },
  todayDot: { width: 4, height: 4, borderRadius: 2 },
});
