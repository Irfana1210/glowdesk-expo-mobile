import { type FC, type ReactNode, useState } from "react";
import {
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Constants from "expo-constants";
import { useRouter } from "expo-router";

import { FormatUtils } from "@/utils/format-utils";

import { useOrdersStore } from "@/features/orders/store/orders.store";
import { DateUtils } from "@/features/roster/domain/dates";
import { ShiftUtils } from "@/features/roster/domain/shifts";
import { useRosterStore } from "@/features/roster/store/roster.store";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { InlineBanner } from "@/components/ui/inline-banner";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";

import { DEMO_STORE_ID, DEMO_STORE_NAME } from "@/mocks/store";
import { DEMO_USER } from "@/mocks/user";
import { colors, radius, spacing } from "@/theme";

import {
  type NotificationPreferences,
  usePreferencesStore,
} from "../preferences.store";

type PendingAction = "reset" | "signOut" | null;

const NOTIFICATION_ROWS: Array<{
  description: string;
  key: keyof NotificationPreferences;
  label: string;
}> = [
  {
    key: "newOrders",
    label: "New Click & Collect orders",
    description: "When a customer places an order",
  },
  {
    key: "lowStock",
    label: "Low stock alerts",
    description: "When a product reaches its reorder point",
  },
  {
    key: "rosterChanges",
    label: "Roster changes",
    description: "When your shifts are added or changed",
  },
];

function Section({ title, children }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <AppText accessibilityRole="header" variant="cardTitle">
        {title}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  first,
}: {
  first?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.row, !first && styles.divider]}
    >
      <AppText color="textMuted">{label}</AppText>
      <AppText style={styles.value} variant="bodyStrong">
        {value}
      </AppText>
    </View>
  );
}

type SwitchRowProps = {
  description: string;
  first?: boolean;
  label: string;
  onChange: (value: boolean) => void;
  testID: string;
  value: boolean;
};

function SwitchRow({
  label,
  description,
  value,
  onChange,
  testID,
  first,
}: SwitchRowProps) {
  return (
    <View style={[styles.row, !first && styles.divider]}>
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText color="textMuted" variant="supporting">
          {description}
        </AppText>
      </View>
      <Switch
        accessibilityHint={description}
        accessibilityLabel={label}
        testID={testID}
        trackColor={{ true: colors.accent, false: colors.border }}
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

export const SettingsScreen: FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const vibrateOnScanError = usePreferencesStore((s) => s.vibrateOnScanError);
  const notifications = usePreferencesStore((s) => s.notifications);
  const setVibrateOnScanError = usePreferencesStore(
    (s) => s.setVibrateOnScanError,
  );
  const setNotification = usePreferencesStore((s) => s.setNotification);
  const resetPreferences = usePreferencesStore((s) => s.resetPreferences);
  const resetOrders = useOrdersStore((s) => s.resetDemoData);
  const resetRoster = useRosterStore((s) => s.resetDemoData);

  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const version = Constants.expoConfig?.version ?? "dev";
  const sdkMajor = Constants.expoConfig?.sdkVersion?.split(".")[0] ?? "57";
  const tradingHours = [
    ShiftUtils.STORE_TRADING_HOURS.open,
    ShiftUtils.STORE_TRADING_HOURS.close,
  ]
    .map((time) =>
      FormatUtils.formatClockTime(
        DateUtils.atTime(new Date(), time) ?? new Date(),
      ),
    )
    .join(" – ");

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/more");

  const confirm = async () => {
    const action = pending;
    setBusy(true);
    resetRoster();
    await resetOrders();
    if (action === "signOut") {
      resetPreferences();
    }
    setBusy(false);
    setPending(null);

    if (action === "signOut") {
      AccessibilityInfo.announceForAccessibility(
        "Signed out. Demo data cleared.",
      );
      router.dismissTo("/dashboard");
      return;
    }
    setMessage("Demo orders and roster restored.");
    AccessibilityInfo.announceForAccessibility(
      "Demo orders and roster restored.",
    );
  };

  return (
    <Screen testID="settings-screen">
      <AppHeader title="Settings" onBack={goBack} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View
          accessible
          accessibilityLabel={`${DEMO_USER.firstName}, ${DEMO_USER.role}, demo account`}
          style={styles.profile}
        >
          <InitialsAvatar
            initials={DEMO_USER.firstName.slice(0, 2).toUpperCase()}
            size={56}
          />
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
            description="A short vibration when a barcode is wrong or already picked"
            label="Vibrate on scan errors"
            testID="pref-vibrate"
            value={vibrateOnScanError}
            onChange={setVibrateOnScanError}
          />
        </Section>

        <Section title="Notifications">
          {NOTIFICATION_ROWS.map((row, index) => (
            <SwitchRow
              description={row.description}
              first={index === 0}
              key={row.key}
              label={row.label}
              testID={`pref-notify-${row.key}`}
              value={notifications[row.key]}
              onChange={(value) => setNotification(row.key, value)}
            />
          ))}
        </Section>
        <AppText
          color="textMuted"
          testID="notifications-note"
          variant="supporting"
        >
          Your choices are saved on this device. Push notifications are not sent
          yet; they arrive in a later release.
        </AppText>

        <Section title="About">
          <InfoRow first label="App version" value={version} />
          <InfoRow label="Platform" value={`Expo SDK ${sdkMajor}`} />
          <InfoRow label="Data" value="Fictional demo data" />
        </Section>

        {message ? (
          <InlineBanner
            message={message}
            testID="settings-message"
            tone="success"
          />
        ) : null}

        <SecondaryButton
          accessibilityHint="Restores orders and the roster to their original demo state"
          icon="refresh"
          label="Reset demo data"
          testID="reset-demo-data"
          onPress={() => {
            setMessage(null);
            setPending("reset");
          }}
        />
        <PrimaryButton
          accessibilityHint="Clears data saved on this device and returns to the dashboard"
          icon="log-out-outline"
          label="Sign out"
          testID="sign-out"
          onPress={() => setPending("signOut")}
        />
      </ScrollView>

      <ConfirmationModal
        destructive
        confirmLabel={pending === "signOut" ? "Sign out" : "Reset data"}
        loading={busy}
        message={
          pending === "signOut"
            ? "This is a demo account, so signing out clears the orders, roster changes and preferences saved on this device."
            : "All order progress and roster changes saved on this device will be lost."
        }
        title={pending === "signOut" ? "Sign out?" : "Reset demo data?"}
        visible={pending !== null}
        onCancel={() => setPending(null)}
        onConfirm={() => void confirm()}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  profile: {
    flexDirection: "row",
    alignItems: "center",
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  value: { flexShrink: 1, textAlign: "right", marginLeft: "auto" },
});
