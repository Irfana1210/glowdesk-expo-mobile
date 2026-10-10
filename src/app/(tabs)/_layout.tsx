import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { colors, fontFamily, radius } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type TabRoute = 'dashboard' | 'orders' | 'roster' | 'inventory' | 'more';
type TabIconProps = { focused: boolean; color: ColorValue; size: number };

const TAB_ICONS: Record<TabRoute, { idle: IconName; active: IconName }> = {
  dashboard: { idle: 'grid-outline', active: 'grid' },
  orders: { idle: 'bag-handle-outline', active: 'bag-handle' },
  roster: { idle: 'calendar-outline', active: 'calendar' },
  inventory: { idle: 'cube-outline', active: 'cube' },
  more: { idle: 'ellipsis-horizontal-circle-outline', active: 'ellipsis-horizontal-circle' },
};

/** The active tab gets a blush pill behind its icon (design handoff). */
function TabIcon({ route, focused, color }: TabIconProps & { route: TabRoute }) {
  const icons = TAB_ICONS[route];
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Ionicons name={focused ? icons.active : icons.idle} size={22} color={color} />
    </View>
  );
}

const TABS: { name: TabRoute; title: string }[] = [
  { name: 'dashboard', title: 'Dashboard' },
  { name: 'orders', title: 'Orders' },
  { name: 'roster', title: 'Roster' },
  { name: 'inventory', title: 'Inventory' },
  { name: 'more', title: 'More' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map(({ name, title }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ title, tabBarIcon: (props: TabIconProps) => <TabIcon route={name} {...props} /> }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 6 },
  item: { minHeight: 52 },
  label: { fontFamily: fontFamily.medium, fontSize: 11, marginTop: 3 },
  iconPill: { width: 52, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  iconPillActive: { backgroundColor: colors.accentSoft },
});
