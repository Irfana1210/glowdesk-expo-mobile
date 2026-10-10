import { type FC, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, spacing } from "@/theme";

import { AppText } from "./AppText";
import { type IconName } from "./Button";

type Props = {
  action?: ReactNode;
  icon?: IconName;
  message?: string;
  testID?: string;
  title: string;
};

export const EmptyState: FC<Props> = ({
  title,
  message,
  icon = "file-tray-outline",
  action,
  testID = "empty-state",
}) => {
  return (
    <View style={styles.container} testID={testID}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.iconCircle}
      >
        <Ionicons color={colors.accent} name={icon} size={28} />
      </View>
      <AppText
        accessibilityRole="header"
        style={styles.center}
        variant="sectionTitle"
      >
        {title}
      </AppText>
      {message ? (
        <AppText color="textMuted" style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  center: { textAlign: "center" },
  action: { marginTop: spacing.lg, alignSelf: "stretch" },
});
