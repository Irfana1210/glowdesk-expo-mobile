import { type FC } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { AppText } from "@/components/ui";

import { colors, spacing, touchTarget } from "@/theme";

import {
  addDays,
  formatWeekRange,
  isSameDay,
  startOfWeek,
} from "../domain/dates";

type Props = {
  now: Date;
  onChange: (weekStart: Date) => void;
  weekStart: Date;
};

export const WeekNavigator: FC<Props> = ({ weekStart, now, onChange }) => {
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(now));
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Previous week"
        accessibilityRole="button"
        style={styles.button}
        testID="previous-week"
        onPress={() => onChange(addDays(weekStart, -7))}
      >
        <Ionicons color={colors.text} name="chevron-back" size={22} />
      </Pressable>
      <View style={styles.label}>
        <AppText
          accessibilityRole="header"
          testID="week-range"
          variant="cardTitle"
        >
          {formatWeekRange(weekStart)}
        </AppText>
        {!isCurrentWeek ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onChange(startOfWeek(now))}
          >
            <AppText color="accent" variant="label">
              Back to this week
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityLabel="Next week"
        accessibilityRole="button"
        style={styles.button}
        testID="next-week"
        onPress={() => onChange(addDays(weekStart, 7))}
      >
        <Ionicons color={colors.text} name="chevron-forward" size={22} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  button: {
    width: touchTarget,
    height: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, alignItems: "center", gap: 2 },
});
