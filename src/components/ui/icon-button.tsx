import { type FC } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, fontFamily, radius } from "@/theme";

import { AppText } from "./app-text";
import { type IconName } from "./button";

type Props = {
  accessibilityLabel: string;
  /** Small count bubble, for example unread notifications. */
  badge?: number;
  icon: IconName;
  onPress: () => void;
  testID?: string;
  /** Text shown instead of an icon, for example profile initials. */
  text?: string;
  /** `outline` is white with a border; `filled` is dark. */
  variant?: "outline" | "filled";
};

/** Round 44×44 button used in screen headers. */
export const IconButton: FC<Props> = ({
  icon,
  accessibilityLabel,
  onPress,
  variant = "outline",
  badge,
  text,
  testID,
}) => {
  const filled = variant === "filled";
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        filled ? styles.filled : styles.outline,
        pressed && styles.pressed,
      ]}
      testID={testID}
      onPress={onPress}
    >
      {text ? (
        <AppText
          maxFontSizeMultiplier={1.2}
          style={[styles.text, filled && styles.textFilled]}
        >
          {text}
        </AppText>
      ) : (
        <Ionicons
          color={filled ? colors.textOnDark : colors.text}
          name={icon}
          size={20}
        />
      )}
      {badge ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.badge}
        >
          <AppText maxFontSizeMultiplier={1} style={styles.badgeText}>
            {badge > 9 ? "9+" : badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filled: { backgroundColor: colors.inverse },
  pressed: { opacity: 0.8 },
  text: { fontFamily: fontFamily.semibold, fontSize: 13, color: colors.text },
  textFilled: { color: colors.textOnDark },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.textOnDark,
  },
});
