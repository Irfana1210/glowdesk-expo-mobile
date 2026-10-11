import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { LOCALE } from "@/constants/locale";

import { colors, fontFamily, radius, spacing } from "@/theme";

import { AppText } from "./app-text";
import { InitialsAvatar } from "./initials-avatar";
import { StatusBadge, type StatusBadgeProps } from "./status-badge";

const L = LOCALE.components.orderCard;

type OrderCardProps = {
  accessibilityLabel: string;
  /** "Jordan Lee", "Unassigned" or "Packed by Aisha Rahman". */
  assigneeLabel: string;
  initials: string;
  onPress: () => void;
  /** Order ID without the prefix, e.g. "7841". Shown as "#ORD-7841". */
  orderNumber: string;
  overdue?: boolean;
  status: StatusBadgeProps;
  /** "5 items · placed 1:47 pm" */
  summary: string;
  /** Shown when the order has changes that have not reached the server, e.g. "Waiting to sync". */
  syncLabel?: string;
  testID?: string;
  /** "Overdue 53 min", "Due 4:44 pm" or "Waiting 3h". */
  timingLabel: string;
};

/** One Click & Collect order in a list. Presentational: all text is prepared by the caller. */
function OrderCardComponent({
  orderNumber,
  initials,
  summary,
  status,
  assigneeLabel,
  timingLabel,
  overdue = false,
  syncLabel,
  onPress,
  accessibilityLabel,
  testID,
}: OrderCardProps) {
  const timingColor = overdue ? colors.errorText : colors.textMuted;
  return (
    <Pressable
      accessibilityHint={L.hint}
      accessibilityLabel={
        syncLabel ? `${accessibilityLabel}, ${syncLabel}` : accessibilityLabel
      }
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      testID={testID}
      onPress={onPress}
    >
      <View style={styles.top}>
        <InitialsAvatar initials={initials} />
        <View style={styles.body}>
          <AppText style={styles.number}>{L.orderNumber(orderNumber)}</AppText>
          <AppText color="textMuted" variant="supporting">
            {summary}
          </AppText>
          {syncLabel ? (
            <View style={styles.meta} testID={testID && `${testID}.SYNC`}>
              <Ionicons
                color={colors.accent}
                name="cloud-upload-outline"
                size={13}
              />
              <AppText style={styles.sync}>{syncLabel}</AppText>
            </View>
          ) : null}
        </View>
        <StatusBadge {...status} />
      </View>
      <View style={styles.footer}>
        <View style={styles.meta}>
          <Ionicons color={colors.textMuted} name="person-outline" size={14} />
          <AppText
            color="textMuted"
            numberOfLines={1}
            style={styles.flexShrink}
            variant="supporting"
          >
            {assigneeLabel}
          </AppText>
        </View>
        <View style={styles.meta}>
          <Ionicons
            color={timingColor}
            name={overdue ? "alert-circle-outline" : "time-outline"}
            size={13}
          />
          <AppText style={[styles.timing, { color: timingColor }]}>
            {timingLabel}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

export const OrderCard = memo(OrderCardComponent);

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  body: { flex: 1, gap: 2 },
  number: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  flexShrink: { flexShrink: 1 },
  timing: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
  sync: {
    color: colors.accent,
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
});
