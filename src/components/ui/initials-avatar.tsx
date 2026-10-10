import { type FC } from "react";
import { StyleSheet, View } from "react-native";

import { colors, fontFamily } from "@/theme";

import { AppText } from "./app-text";

/** Decorative avatar. Hidden from screen readers because the parent label already names the person. */
export const InitialsAvatar: FC<{
  color?: string;
  initials: string;
  size?: number;
}> = ({ initials, size = 42, color }) => {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color ?? colors.avatar,
        },
      ]}
    >
      <AppText maxFontSizeMultiplier={1.2} style={styles.text}>
        {initials}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  text: { fontFamily: fontFamily.semibold, fontSize: 13, color: colors.text },
});
