import { type FC, useCallback, useState } from "react";
import { AccessibilityInfo, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

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
import { OrderStateMachine } from "../domain/order-state-machine";
import { useEnsureOrdersLoaded } from "../hooks/use-ensure-orders-loaded";
import { OrderPresentationUtils } from "../presentation";
import { selectOrderById, useOrdersStore } from "../store/orders.store";

const L = LOCALE.orders.completion;
const C = LOCALE.orders.common;

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
    <Screen edges={["top", "left", "right"]} testID="ORDER_COMPLETION.SCREEN">
      <AppHeader title={L.title} onBack={goBack} />
      {order ? (
        <CompletionContent order={order} onBack={goBack} />
      ) : loadStatus === "idle" || loadStatus === "loading" ? (
        <LoadingState message={C.loadingOrder} />
      ) : (
        <ErrorState
          message={L.notFoundMessage(orderId ?? "")}
          retryLabel={C.backToOrders}
          title={C.orderNotFound}
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
      accessibilityLabel={L.summaryAccessibilityLabel(label, value)}
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

  const progress = OrderStateMachine.getPickingProgress(order);
  const totalUnits = OrderStateMachine.getTotalUnits(order);
  const pickedUnits = order.items.reduce(
    (sum, item) => sum + Math.min(item.pickedQuantity, item.requiredQuantity),
    0,
  );
  const readiness = OrderStateMachine.canMarkReady(order);
  const isComplete = order.status === "READY" || order.status === "COLLECTED";

  const confirm = () => {
    const result = markReady(order.id);
    if (result.ok) {
      setError(null);
      AccessibilityInfo.announceForAccessibility(
        L.readyAnnouncement(FormatUtils.formatOrderNumber(order.id)),
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
            testID="ORDER_COMPLETION.TITLE"
            variant="pageTitle"
          >
            {isComplete ? L.readyTitle : L.confirmTitle}
          </AppText>
          <AppText color="textMuted" style={styles.center}>
            {isComplete
              ? L.readySubtitle(FormatUtils.formatOrderNumber(order.id))
              : L.confirmSubtitle}
          </AppText>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <AppText variant="sectionTitle">
              {FormatUtils.formatOrderNumber(order.id)}
            </AppText>
            <OrderStatusBadge status={order.status} />
          </View>
          <SummaryRow
            label={L.customer}
            value={OrderPresentationUtils.spellInitials(order.customerInitials)}
          />
          <SummaryRow
            label={L.verifiedProducts}
            value={L.ratio(progress.verifiedItems, progress.totalItems)}
          />
          <SummaryRow
            label={L.unitsPicked}
            value={L.ratio(pickedUnits, totalUnits)}
          />
          <SummaryRow
            label={L.finalStatus}
            value={isComplete ? L.finalReady : L.finalPending}
          />
        </View>

        {!isComplete && !readiness.ok ? (
          <InlineBanner
            message={L.cannotMarkReady(readiness.message)}
            testID="ORDER_COMPLETION.ERROR"
            tone="error"
          />
        ) : null}
        {error ? (
          <InlineBanner
            message={error}
            testID="ORDER_COMPLETION.ACTION_ERROR"
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
            label={C.backToOrders}
            testID="ORDER_COMPLETION.BACK_TO_ORDERS"
            onPress={() => router.dismissTo("/orders")}
          />
        ) : (
          <>
            <PrimaryButton
              accessibilityHint={
                readiness.ok ? L.confirmReadyHint : readiness.message
              }
              disabled={!readiness.ok}
              icon="checkmark-done-outline"
              label={L.confirmReady}
              testID="ORDER_COMPLETION.CONFIRM_READY"
              onPress={confirm}
            />
            <SecondaryButton label={C.backToOrder} onPress={onBack} />
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
