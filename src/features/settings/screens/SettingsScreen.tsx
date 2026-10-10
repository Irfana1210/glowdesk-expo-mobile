import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { AppText, ConfirmationModal, InitialsAvatar, InlineBanner, PrimaryButton, SecondaryButton } from '@/components/ui';
import { useOrdersStore } from '@/features/orders/store/useOrdersStore';
import { atTime } from '@/features/roster/domain/dates';
import { STORE_TRADING_HOURS } from '@/features/roster/domain/shifts';
import { useRosterStore } from '@/features/roster/store/useRosterStore';
import { formatClockTime } from '@/lib/format';
import { DEMO_STORE_ID, DEMO_STORE_NAME } from '@/mocks/store';
import { DEMO_USER } from '@/mocks/user';
import { colors, radius, spacing } from '@/theme';

import { usePreferencesStore, type NotificationPreferences } from '../usePreferencesStore';

type PendingAction = 'reset' | 'signOut' | null;

const NOTIFICATION_ROWS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: 'newOrders', label: 'New Click & Collect orders', description: 'When a customer places an order' },
  { key: 'lowStock', label: 'Low stock alerts', description: 'When a product reaches its reorder point' },
  { key: 'rosterChanges', label: 'Roster changes', description: 'When your shifts are added or changed' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="cardTitle" accessibilityRole="header">
        {title}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <View style={[styles.row, !first && styles.divider]} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText color="textMuted">{label}</AppText>
      <AppText variant="bodyStrong" style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

interface SwitchRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  testID: string;
  first?: boolean;
}

function SwitchRow({ label, description, value, onChange, testID, first }: SwitchRowProps) {
  return (
    <View style={[styles.row, !first && styles.divider]}>
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="supporting" color="textMuted">
          {description}
        </AppText>
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        accessibilityHint={description}
        trackColor={{ true: colors.accent, false: colors.border }}
      />
    </View>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const vibrateOnScanError = usePreferencesStore((s) => s.vibrateOnScanError);
  const notifications = usePreferencesStore((s) => s.notifications);
  const setVibrateOnScanError = usePreferencesStore((s) => s.setVibrateOnScanError);
  const setNotification = usePreferencesStore((s) => s.setNotification);
  const resetPreferences = usePreferencesStore((s) => s.resetPreferences);
  const resetOrders = useOrdersStore((s) => s.resetDemoData);
  const resetRoster = useRosterStore((s) => s.resetDemoData);

  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const version = Constants.expoConfig?.version ?? 'dev';
  const sdkMajor = Constants.expoConfig?.sdkVersion?.split('.')[0] ?? '57';
  const tradingHours = [STORE_TRADING_HOURS.open, STORE_TRADING_HOURS.close]
    .map((time) => formatClockTime(atTime(new Date(), time) ?? new Date()))
    .join(' – ');

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/more'));

  const confirm = async () => {
    const action = pending;
    setBusy(true);
    resetRoster();
    await resetOrders();
    if (action === 'signOut') resetPreferences();
    setBusy(false);
    setPending(null);

    if (action === 'signOut') {
      AccessibilityInfo.announceForAccessibility('Signed out. Demo data cleared.');
      router.dismissTo('/dashboard');
      return;
    }
    setMessage('Demo orders and roster restored.');
    AccessibilityInfo.announceForAccessibility('Demo orders and roster restored.');
  };

  return (
    <Screen testID="settings-screen">
      <AppHeader title="Settings" onBack={goBack} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View
          style={styles.profile}
          accessible
          accessibilityLabel={`${DEMO_USER.firstName}, ${DEMO_USER.role}, demo account`}
        >
          <InitialsAvatar initials={DEMO_USER.firstName.slice(0, 2).toUpperCase()} size={56} />
          <View style={styles.flex}>
            <AppText variant="sectionTitle">{DEMO_USER.firstName}</AppText>
            <AppText color="textMuted">{DEMO_USER.role} · Demo account</AppText>
          </View>
        </View>

        <Section title="Assigned store">
          <InfoRow first label="Store" value={DEMO_STORE_NAME} />
          <InfoRow label="Store ID" value={DEMO_STORE_ID} />
          <InfoRow label="Trading hours" value={tradingHours} />
        </Section>

        <Section title="App preferences">
          <SwitchRow
            first
            testID="pref-vibrate"
            label="Vibrate on scan errors"
            description="A short vibration when a barcode is wrong or already picked"
            value={vibrateOnScanError}
            onChange={setVibrateOnScanError}
          />
        </Section>

        <Section title="Notifications">
          {NOTIFICATION_ROWS.map((row, index) => (
            <SwitchRow
              key={row.key}
              first={index === 0}
              testID={`pref-notify-${row.key}`}
              label={row.label}
              description={row.description}
              value={notifications[row.key]}
              onChange={(value) => setNotification(row.key, value)}
            />
          ))}
        </Section>
        <AppText variant="supporting" color="textMuted" testID="notifications-note">
          Your choices are saved on this device. Push notifications are not sent yet; they arrive in a later release.
        </AppText>

        <Section title="About">
          <InfoRow first label="App version" value={version} />
          <InfoRow label="Platform" value={`Expo SDK ${sdkMajor}`} />
          <InfoRow label="Data" value="Fictional demo data" />
        </Section>

        {message ? <InlineBanner tone="success" message={message} testID="settings-message" /> : null}

        <SecondaryButton
          testID="reset-demo-data"
          label="Reset demo data"
          icon="refresh"
          onPress={() => {
            setMessage(null);
            setPending('reset');
          }}
          accessibilityHint="Restores orders and the roster to their original demo state"
        />
        <PrimaryButton
          testID="sign-out"
          label="Sign out"
          icon="log-out-outline"
          onPress={() => setPending('signOut')}
          accessibilityHint="Clears data saved on this device and returns to the dashboard"
        />
      </ScrollView>

      <ConfirmationModal
        visible={pending !== null}
        title={pending === 'signOut' ? 'Sign out?' : 'Reset demo data?'}
        message={
          pending === 'signOut'
            ? 'This is a demo account, so signing out clears the orders, roster changes and preferences saved on this device.'
            : 'All order progress and roster changes saved on this device will be lost.'
        }
        confirmLabel={pending === 'signOut' ? 'Sign out' : 'Reset data'}
        destructive
        loading={busy}
        onConfirm={() => void confirm()}
        onCancel={() => setPending(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  section: { gap: spacing.sm },
  card: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, minHeight: 52 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  value: { flexShrink: 1, textAlign: 'right', marginLeft: 'auto' },
});
