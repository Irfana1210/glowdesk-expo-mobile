import { type FC, useCallback, useState } from "react";
import { AccessibilityInfo, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { formatOrderNumber } from "@/utils/format-utils";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { ErrorState } from "@/components/ui/error-state";
import { InlineBanner } from "@/components/ui/inline-banner";
import { LoadingState } from "@/components/ui/loading-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";

import { colors, radius, spacing } from "@/theme";
import { type Order } from "@/types/order";

import { OrderStatusBadge } from "../components/order-status-badge";
import {
  canMarkReady,
  getPickingProgress,
  getTotalUnits,
} from "../domain/order-state-machine";
import { useEnsureOrdersLoaded } from "../hooks/use-ensure-orders-loaded";
import { spellInitials } from "../order-status-meta";
import { selectOrderById, useOrdersStore } from "../store/orders.store";

export const OrderCompletionScreen: FC = () => {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = useOrdersStore(selectOrderById(orderId));
  const loadStatus = useEnsureOrdersLoaded();

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else router.replace("/orders");
  }, [router]);

  return (
    <Screen edges={["top", "left", "right"]} testID="completion-screen">
      <AppHeader title="Order Completion" onBack={goBack} />
      {order ? (
        <CompletionContent order={order} onBack={goBack} />
      ) : loadStatus === "idle" || loadStatus === "loading" ? (
        <LoadingState message="Loading order" />
      ) : (
        <ErrorState
          message={`We couldn't find order ${orderId ?? ""}.`}
          retryLabel="Back to orders"
          title="Order not found"
          onRetry={() => router.replace("/orders")}
        />
      )}
    </Screen>
  );
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={styles.summaryRow}
    >
      <AppText color="textMuted">{label}</AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function CompletionContent({
  order,
  onBack,
}: {
  onBack: () => void;
  order: Order;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const markReady = useOrdersStore((s) => s.markReady);
  const [error, setError] = useState<string | null>(null);

  const progress = getPickingProgress(order);
  const totalUnits = getTotalUnits(order);
  const pickedUnits = order.items.reduce(
    (sum, item) => sum + Math.min(item.pickedQuantity, item.requiredQuantity),
    0,
  );
  const readiness = canMarkReady(order);
  const isComplete = order.status === "READY" || order.status === "COLLECTED";

  const confirm = () => {
    const result = markReady(order.id);
    if (result.ok) {
      setError(null);
      AccessibilityInfo.announceForAccessibility(
        `${formatOrderNumber(order.id)} is ready for collection.`,
      );
    } else {
      setError(result.message);
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View
            style={[
              styles.heroIcon,
              isComplete ? styles.heroIconDone : styles.heroIconPending,
            ]}
          >
            <Ionicons
              color={isComplete ? colors.success : colors.accent}
              name={isComplete ? "checkmark-done" : "clipboard-outline"}
              size={36}
            />
          </View>
          <AppText
            accessibilityRole="header"
            style={styles.center}
            testID="completion-title"
            variant="pageTitle"
          >
            {isComplete ? "Ready for collection" : "Confirm order is ready"}
          </AppText>
          <AppText color="textMuted" style={styles.center}>
            {isComplete
              ? `${formatOrderNumber(order.id)} can be handed to the customer.`
              : "Check every product is bagged before confirming."}
          </AppText>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <AppText variant="sectionTitle">
              {formatOrderNumber(order.id)}
            </AppText>
            <OrderStatusBadge status={order.status} />
          </View>
          <SummaryRow
            label="Customer"
            value={spellInitials(order.customerInitials)}
          />
          <SummaryRow
            label="Verified products"
            value={`${progress.verifiedItems} of ${progress.totalItems}`}
          />
          <SummaryRow
            label="Units picked"
            value={`${pickedUnits} of ${totalUnits}`}
          />
          <SummaryRow
            label="Final status"
            value={isComplete ? "Ready" : "Picking (not yet confirmed)"}
          />
        </View>

        {!isComplete && !readiness.ok ? (
          <InlineBanner
            message={`This order can't be marked ready yet. ${readiness.message}`}
            testID="completion-error"
            tone="error"
          />
        ) : null}
        {error ? (
          <InlineBanner
            message={error}
            testID="completion-action-error"
            tone="error"
          />
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.actions,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
      >
        {isComplete ? (
          <PrimaryButton
            icon="bag-handle-outline"
            label="Back to orders"
            testID="back-to-orders"
            onPress={() => router.dismissTo("/orders")}
          />
        ) : (
          <>
            <PrimaryButton
              accessibilityHint={
                readiness.ok ? "Moves the order to Ready" : readiness.message
              }
              disabled={!readiness.ok}
              icon="checkmark-done-outline"
              label="Confirm ready for collection"
              testID="confirm-ready"
              onPress={confirm}
            />
            <SecondaryButton label="Back to order" onPress={onBack} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl },
  hero: { alignItems: "center", gap: spacing.sm, paddingTop: spacing.lg },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heroIconDone: { backgroundColor: colors.successSoft },
  heroIconPending: { backgroundColor: colors.accentSoft },
  center: { textAlign: "center" },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
