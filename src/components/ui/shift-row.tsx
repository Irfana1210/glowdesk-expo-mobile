import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { LOCALE } from "@/constants/locale";

import { colors, fontFamily, shiftStateColors, spacing } from "@/theme";

import { AppText } from "./app-text";
import { InitialsAvatar } from "./initials-avatar";

const L = LOCALE.components.shiftRow;

type ShiftStateTone = keyof typeof shiftStateColors;

type ShiftRowProps = {
  accessibilityLabel: string;
  avatarColor?: string;
  initials: string;
  /** "30m break · 8h" */
  meta: string;
  name: string;
  onEdit: () => void;
  /** "Store Manager · Full time" */
  role: string;
  /** "On the floor", "Break at 5:00 pm · needs cover", "Finished". Shown with a dot, never colour alone. */
  stateLabel?: string;
  stateTone?: ShiftStateTone;
  testID?: string;
  /** "9:00 am – 5:30 pm" */
  time: string;
};

/** One person's shift in the roster list, with an edit button. */
function ShiftRowComponent({
  initials,
  avatarColor,
  name,
  role,
  stateLabel,
  stateTone = "on",
  time,
  meta,
  onEdit,
  accessibilityLabel,
  testID,
}: ShiftRowProps) {
  const state = shiftStateColors[stateTone];
  return (
    <View style={styles.row} testID={testID}>
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        style={styles.main}
      >
        <InitialsAvatar color={avatarColor} initials={initials} />
        <View style={styles.person}>
          <AppText numberOfLines={1} style={styles.name}>
            {name}
          </AppText>
          <AppText color="textMuted" numberOfLines={1} variant="supporting">
            {role}
          </AppText>
          {stateLabel ? (
            <View style={styles.state}>
              <View style={[styles.dot, { backgroundColor: state.dot }]} />
              <AppText
                numberOfLines={1}
                style={[styles.stateText, { color: state.text }]}
              >
                {stateLabel}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.times}>
          <AppText style={styles.time}>{time}</AppText>
          <AppText style={styles.meta}>{meta}</AppText>
        </View>
      </View>
      <Pressable
        accessibilityLabel={L.edit(name)}
        accessibilityRole="button"
        hitSlop={{ left: 4, right: 4 }}
        style={styles.edit}
        testID={testID ? `${testID}.EDIT` : undefined}
        onPress={onEdit}
      >
        <Ionicons color={colors.textMuted} name="create-outline" size={20} />
      </Pressable>
    </View>
  );
}

export const ShiftRow = memo(ShiftRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  person: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  state: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stateText: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    flexShrink: 1,
  },
  times: { alignItems: "flex-end", gap: 2, flexShrink: 0 },
  time: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
  },
  edit: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
