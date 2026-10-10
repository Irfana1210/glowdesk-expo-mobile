import { type FC, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme";

import { AppText } from "./app-text";

type Props = {
  /** Small uppercase label above the title, e.g. "Click & Collect". */
  eyebrow: string;
  /** Header actions on the right, e.g. IconButtons. */
  right?: ReactNode;
  /** Optional line under the title, e.g. the user's role. */
  subtitle?: string;
  title: string;
};

/** Tab screen header: eyebrow plus large serif title. */
export const ScreenTitle: FC<Props> = ({ eyebrow, title, subtitle, right }) => {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <AppText color="textMuted" variant="eyebrow">
          {eyebrow}
        </AppText>
        <AppText accessibilityRole="header" numberOfLines={1} variant="display">
          {title}
        </AppText>
        {subtitle ? <AppText color="textMuted">{subtitle}</AppText> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  titles: { flex: 1, gap: spacing.xs },
  right: { flexDirection: "row", gap: spacing.sm },
});
