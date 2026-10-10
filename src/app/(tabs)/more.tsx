import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { type Href } from "expo-router";
import { useRouter } from "expo-router";

import { LOCALE } from "@/constants/locale";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { type IconName } from "@/components/ui/button";
import { InlineBanner } from "@/components/ui/inline-banner";

import { colors, radius, spacing, touchTarget } from "@/theme";

const L = LOCALE.app.more;

type MenuItem = {
  description: string;
  href?: Href;
  icon: IconName;
  label: string;
};

const MENU: Array<MenuItem> = [
  {
    ...L.labour,
    icon: "wallet-outline",
    href: "/more/labour",
  },
  {
    ...L.salesAnalytics,
    icon: "stats-chart-outline",
  },
  { ...L.employees, icon: "people-outline" },
  {
    ...L.settings,
    icon: "settings-outline",
    href: "/more/settings",
  },
];

export default function MoreTab() {
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "dev";

  return (
    <Screen testID="more-screen">
      <AppHeader subtitle={L.version(version)} title={L.title} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.menu}>
          {MENU.map((item, index) => {
            const enabled = Boolean(item.href);
            return (
              <Pressable
                accessibilityLabel={L.itemSummary(item.label, item.description)}
                accessibilityRole="button"
                accessibilityState={{ disabled: !enabled }}
                disabled={!enabled}
                key={item.label}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && styles.rowDivider,
                  pressed && styles.pressed,
                ]}
                testID={`menu-${item.label}`}
                onPress={() => item.href && router.push(item.href)}
              >
                <View style={styles.icon}>
                  <Ionicons
                    color={enabled ? colors.accent : colors.textMuted}
                    name={item.icon}
                    size={20}
                  />
                </View>
                <View style={styles.flex}>
                  <AppText
                    color={enabled ? "text" : "textMuted"}
                    variant="bodyStrong"
                  >
                    {item.label}
                  </AppText>
                  <AppText color="textMuted" variant="supporting">
                    {item.description}
                  </AppText>
                </View>
                {enabled ? (
                  <Ionicons
                    color={colors.textMuted}
                    name="chevron-forward"
                    size={18}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <InlineBanner message={L.demoBanner} tone="info" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  menu: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: touchTarget + 16,
    paddingHorizontal: spacing.lg,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
});
