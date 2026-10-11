import { type FC, type ReactNode, useState } from "react";
import {
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";
import { handleError } from "@/utils/handle-api-error";

import { useMockNetworkStore } from "@/services/mock-api/mock-network.store";
import { MockServer } from "@/services/mock-api/mock-server";

import { AuthUtils } from "@/features/auth/domain/auth";
import { AuthService } from "@/features/auth/services/auth.service";
import {
  selectSession,
  useSessionStore,
} from "@/features/auth/store/session.store";
import { ROLE_LABELS } from "@/features/employees/types";
import { DateUtils } from "@/features/roster/domain/dates";
import { ShiftUtils } from "@/features/roster/domain/shifts";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { InlineBanner } from "@/components/ui/inline-banner";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";

import { DEMO_STORE_NAME } from "@/mocks/store";
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

/** Switches for simulated network conditions, so a demo can show offline and error handling. */
function DeveloperSection() {
  const D = L.developer;
  const network = useMockNetworkStore();

  return (
    <>
      <Section title={D.title}>
        <SwitchRow
          first
          description={D.forceOffline.description}
          label={D.forceOffline.label}
          testID="SETTINGS.DEV.FORCE_OFFLINE"
          value={network.forceOffline}
          onChange={network.setForceOffline}
        />
        <SwitchRow
          description={D.slowNetwork.description}
          label={D.slowNetwork.label}
          testID="SETTINGS.DEV.SLOW_NETWORK"
          value={network.slowNetwork}
          onChange={network.setSlowNetwork}
        />
        <SwitchRow
          description={D.failRequests.description}
          label={D.failRequests.label}
          testID="SETTINGS.DEV.FAIL_REQUESTS"
          value={network.failRequests}
          onChange={network.setFailRequests}
        />
      </Section>
      <AppText color="textMuted" variant="supporting">
        {D.note}
      </AppText>
    </>
  );
}

export const SettingsScreen: FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const session = useSessionStore(selectSession);
  const clearSession = useSessionStore((s) => s.clear);
  const vibrateOnScanError = usePreferencesStore((s) => s.vibrateOnScanError);
  const notifications = usePreferencesStore((s) => s.notifications);
  const setVibrateOnScanError = usePreferencesStore(
    (s) => s.setVibrateOnScanError,
  );
  const setNotification = usePreferencesStore((s) => s.setNotification);
  const resetPreferences = usePreferencesStore((s) => s.resetPreferences);

  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const name = session?.name ?? "";
  const roleLabel = session ? ROLE_LABELS[session.role] : "";
  const staffId = session?.staffId ?? "";
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

  // Restores the server's demo data and drops cached data and changes waiting to sync.
  const resetDemoData = async () => {
    queryClient.getMutationCache().clear();
    await MockServer.reset();
    await queryClient.resetQueries();
  };

  const confirm = async () => {
    const action = pending;
    setBusy(true);
    try {
      await resetDemoData();
    } catch (error) {
      handleError(error);
    }

    if (action === "signOut") {
      try {
        await AuthService.signOut();
      } catch (error) {
        // The device still signs out; the server call is best effort in demo mode.
        handleError(error);
      }
      resetPreferences();
      queryClient.clear();
      setBusy(false);
      setPending(null);
      AccessibilityInfo.announceForAccessibility(L.signOut.announcement);
      // The root layout's route guard swaps to the sign-in screen once the session clears.
      clearSession();
      return;
    }

    setBusy(false);
    setPending(null);
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
            name,
            roleLabel,
            staffId,
          )}
          style={styles.profile}
          testID="SETTINGS.PROFILE"
        >
          <InitialsAvatar initials={AuthUtils.initials(name)} size={56} />
          <View style={styles.flex}>
            <AppText variant="sectionTitle">{name}</AppText>
            <AppText color="textMuted">
              {L.profile.summary(roleLabel, staffId)}
            </AppText>
          </View>
        </View>

        <Section title={L.store.title}>
          <InfoRow first label={L.store.store} value={DEMO_STORE_NAME} />
          <InfoRow label={L.store.storeId} value={session?.storeId ?? ""} />
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

        <Section title={L.about.title}>
          <InfoRow first label={L.about.appVersion} value={version} />
          <InfoRow
            label={L.about.platform}
            value={L.about.platformValue(sdkMajor)}
          />
        </Section>

        {__DEV__ ? <DeveloperSection /> : null}

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
