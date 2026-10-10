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

import { LOCALE } from "@/constants/locale";

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

const L = LOCALE.settings;

type PendingAction = "reset" | "signOut" | null;

const NOTIFICATION_ROWS: Array<{
  description: string;
  key: keyof NotificationPreferences;
  label: string;
}> = (["newOrders", "lowStock", "rosterChanges"] as const).map((key) => ({
  key,
  ...L.notifications[key],
}));

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
      accessibilityLabel={L.screen.rowLabel(label, value)}
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
      AccessibilityInfo.announceForAccessibility(L.signOut.announcement);
      router.dismissTo("/dashboard");
      return;
    }
    setMessage(L.reset.done);
    AccessibilityInfo.announceForAccessibility(L.reset.done);
  };

  return (
    <Screen testID="SETTINGS.SCREEN">
      <AppHeader title={L.screen.title} onBack={goBack} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View
          accessible
          accessibilityLabel={L.profile.accessibilityLabel(
            DEMO_USER.firstName,
            DEMO_USER.role,
          )}
          style={styles.profile}
        >
          <InitialsAvatar
            initials={DEMO_USER.firstName.slice(0, 2).toUpperCase()}
            size={56}
          />
          <View style={styles.flex}>
            <AppText variant="sectionTitle">{DEMO_USER.firstName}</AppText>
            <AppText color="textMuted">
              {L.profile.role(DEMO_USER.role)}
            </AppText>
          </View>
        </View>

        <Section title={L.store.title}>
          <InfoRow first label={L.store.store} value={DEMO_STORE_NAME} />
          <InfoRow label={L.store.storeId} value={DEMO_STORE_ID} />
          <InfoRow label={L.store.tradingHours} value={tradingHours} />
        </Section>

        <Section title={L.preferences.title}>
          <SwitchRow
            first
            description={L.preferences.vibrate.description}
            label={L.preferences.vibrate.label}
            testID="SETTINGS.PREF_VIBRATE"
            value={vibrateOnScanError}
            onChange={setVibrateOnScanError}
          />
        </Section>

        <Section title={L.notifications.title}>
          {NOTIFICATION_ROWS.map((row, index) => (
            <SwitchRow
              description={row.description}
              first={index === 0}
              key={row.key}
              label={row.label}
              testID={`SETTINGS.PREF_NOTIFY.${row.key}`}
              value={notifications[row.key]}
              onChange={(value) => setNotification(row.key, value)}
            />
          ))}
        </Section>
        <AppText
          color="textMuted"
          testID="SETTINGS.NOTIFICATIONS_NOTE"
          variant="supporting"
        >
          {L.notifications.note}
        </AppText>

        <Section title={L.about.title}>
          <InfoRow first label={L.about.appVersion} value={version} />
          <InfoRow
            label={L.about.platform}
            value={L.about.platformValue(sdkMajor)}
          />
          <InfoRow label={L.about.data} value={L.about.dataValue} />
        </Section>

        {message ? (
          <InlineBanner
            message={message}
            testID="SETTINGS.MESSAGE"
            tone="success"
          />
        ) : null}

        <SecondaryButton
          accessibilityHint={L.reset.hint}
          icon="refresh"
          label={L.reset.label}
          testID="SETTINGS.RESET_DEMO_DATA"
          onPress={() => {
            setMessage(null);
            setPending("reset");
          }}
        />
        <PrimaryButton
          accessibilityHint={L.signOut.hint}
          icon="log-out-outline"
          label={L.signOut.label}
          testID="SETTINGS.SIGN_OUT"
          onPress={() => setPending("signOut")}
        />
      </ScrollView>

      <ConfirmationModal
        destructive
        confirmLabel={
          pending === "signOut" ? L.signOut.confirmLabel : L.reset.confirmLabel
        }
        loading={busy}
        message={
          pending === "signOut"
            ? L.signOut.confirmMessage
            : L.reset.confirmMessage
        }
        title={
          pending === "signOut" ? L.signOut.confirmTitle : L.reset.confirmTitle
        }
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
