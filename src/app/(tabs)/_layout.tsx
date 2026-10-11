import { type ComponentProps } from "react";
import { type ColorValue, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router/js-tabs";

import { LOCALE } from "@/constants/locale";

import { TAB_BAR_HEIGHT } from "@/hooks/use-tab-bar-inset";

import { colors, fontFamily, radius, spacing } from "@/theme";

const L = LOCALE.app.tabs;

type IconName = ComponentProps<typeof Ionicons>["name"];
type TabRoute = "dashboard" | "orders" | "roster" | "inventory" | "more";
type TabIconProps = { color: ColorValue; focused: boolean; size: number };

const TAB_ICONS: Record<TabRoute, { active: IconName; idle: IconName }> = {
  dashboard: { idle: "grid-outline", active: "grid" },
  orders: { idle: "bag-handle-outline", active: "bag-handle" },
  roster: { idle: "calendar-outline", active: "calendar" },
  inventory: { idle: "cube-outline", active: "cube" },
  more: {
    idle: "ellipsis-horizontal-circle-outline",
    active: "ellipsis-horizontal-circle",
  },
};

/** The active tab gets a plum pill with a white icon; its label takes the plum tint. */
function TabIcon({
  route,
  focused,
  color,
}: TabIconProps & { route: TabRoute }) {
  const icons = TAB_ICONS[route];
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Ionicons
        color={focused ? colors.textOnAccent : color}
        name={focused ? icons.active : icons.idle}
        size={22}
      />
    </View>
  );
}

const TABS: Array<{ name: TabRoute; title: string }> = [
  { name: "dashboard", title: L.dashboard },
  { name: "orders", title: L.orders },
  { name: "roster", title: L.roster },
  { name: "inventory", title: L.inventory },
  { name: "more", title: L.more },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: [
          styles.bar,
          {
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ],
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map(({ name, title }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: (props: TabIconProps) => (
              <TabIcon route={name} {...props} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    elevation: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  item: { minHeight: 52 },
  label: { fontFamily: fontFamily.medium, fontSize: 11, marginTop: 3 },
  iconPill: {
    width: 52,
    height: 30,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPillActive: { backgroundColor: colors.primary },
});
