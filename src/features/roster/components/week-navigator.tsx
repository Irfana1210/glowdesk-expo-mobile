import { type FC } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { LOCALE } from "@/constants/locale";

import { AppText } from "@/components/ui/app-text";

import { colors, spacing, touchTarget } from "@/theme";

import { DateUtils } from "../domain/dates";

const L = LOCALE.roster.weekNavigator;

type Props = {
  now: Date;
  onChange: (weekStart: Date) => void;
  weekStart: Date;
};

export const WeekNavigator: FC<Props> = ({ weekStart, now, onChange }) => {
  const isCurrentWeek = DateUtils.isSameDay(
    weekStart,
    DateUtils.startOfWeek(now),
  );
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={L.previousWeek}
        accessibilityRole="button"
        style={styles.button}
        testID="previous-week"
        onPress={() => onChange(DateUtils.addDays(weekStart, -7))}
      >
        <Ionicons color={colors.text} name="chevron-back" size={22} />
      </Pressable>
      <View style={styles.label}>
        <AppText
          accessibilityRole="header"
          testID="week-range"
          variant="cardTitle"
        >
          {DateUtils.formatWeekRange(weekStart)}
        </AppText>
        {!isCurrentWeek ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onChange(DateUtils.startOfWeek(now))}
          >
            <AppText color="accent" variant="label">
              {L.backToThisWeek}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityLabel={L.nextWeek}
        accessibilityRole="button"
        style={styles.button}
        testID="next-week"
        onPress={() => onChange(DateUtils.addDays(weekStart, 7))}
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
