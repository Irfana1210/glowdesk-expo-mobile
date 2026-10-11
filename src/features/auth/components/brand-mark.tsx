import { type FC } from "react";
import { Image, StyleSheet, View } from "react-native";

import { LOCALE } from "@/constants/locale";

import { AppText } from "@/components/ui/app-text";

import { colors, fontFamily } from "@/theme";

const APP_ICON = require("../../../../assets/icon.png");

type Props = {
  eyebrow: string;
};

/** The app icon above the wordmark on the sign-in screen. Decorative. */
export const BrandMark: FC<Props> = ({ eyebrow }) => (
  <View
    accessible
    accessibilityLabel={LOCALE.auth.signIn.brandLabel(eyebrow)}
    accessibilityRole="header"
    style={styles.container}
  >
    <Image source={APP_ICON} style={styles.icon} />
    <AppText style={styles.wordmark}>Glowdesk</AppText>
    <AppText color="textMuted" variant="eyebrow">
      {eyebrow}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 10 },
  icon: { borderRadius: 24, height: 104, width: 104 },
  wordmark: {
    color: colors.text,
    fontFamily: fontFamily.display,
    fontSize: 40,
    lineHeight: 46,
  },
});
