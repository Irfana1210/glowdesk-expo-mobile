import { type FC, useCallback, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useNow } from "@/hooks/useNow";

import { ROLE_LABELS } from "@/features/employees/types";
import { useRosterStore } from "@/features/roster/store/useRosterStore";

import { AppHeader } from "@/components/layout/AppHeader";
import { Screen } from "@/components/layout/Screen";
import {
  AppText,
  ConfirmationModal,
  ErrorState,
  InitialsAvatar,
  InlineBanner,
  LoadingState,
  OptionSheet,
  PrimaryButton,
  ProductRow,
  SecondaryButton,
  StatusBadge,
} from "@/components/ui";

import { formatClockTime, formatDuration } from "@/lib/format";
import { productSwatch } from "@/mocks/products";
import { DEMO_STORE_ID } from "@/mocks/store";
import { colors, fontFamily, radius, spacing, touchTarget } from "@/theme";
import { type Order } from "@/types/order";

import {
  canMarkReady,
  getUnitProgress,
  isItemVerified,
} from "../domain/orderStateMachine";
import { dueAt, isActive, isOverdue, minutesOverdue } from "../domain/schedule";
import { useEnsureOrdersLoaded } from "../hooks/useEnsureOrdersLoaded";
import { ORDER_STATUS_META, spellInitials } from "../orderStatusMeta";
import { orderNumber, placedLabel } from "../presentation";
import { selectOrderById, useOrdersStore } from "../store/useOrdersStore";

type Feedback = { message: string; tone: "error" | "success" } | null;

const UNASSIGN = "__unassign__";

export const OrderDetailsScreen: FC<{ now?: Date }> = ({ now: fixedNow }) => {
  const router = useRouter();
  const liveNow = useNow();
  const now = fixedNow ?? liveNow;
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrdersStore(selectOrderById(id));
  const loadStatus = useEnsureOrdersLoaded();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else router.replace("/orders");
  }, [router]);

  let content;
  if (!order && (loadStatus === "idle" || loadStatus === "loading")) {
    content = <LoadingState message="Loading order" />;
  } else if (!order) {
    content = (
      <ErrorState
        message={`We couldn't find order ${id ?? ""}. It may have been removed.`}
        retryLabel="Back to orders"
        title="Order not found"
        onRetry={() => router.replace("/orders")}
      />
    );
  } else {
    content = (
      <OrderDetailsContent
        confirmCancel={confirmCancel}
        now={now}
        order={order}
        onCloseCancel={() => setConfirmCancel(false)}
      />
    );
  }

  const canCancel = order ? isActive(order) : false;

  return (
    <Screen edges={["top", "left", "right"]} testID="order-details-screen">
      <AppHeader
        right={
          canCancel ? (
            <Pressable
              accessibilityLabel="More order actions"
              accessibilityRole="button"
              style={styles.iconButton}
              testID="more-actions"
              onPress={() => setConfirmCancel(true)}
            >
              <Ionicons
                color={colors.text}
                name="ellipsis-horizontal"
                size={22}
              />
            </Pressable>
          ) : null
        }
        title="Order details"
        onBack={goBack}
      />
      {content}
    </Screen>
  );
};

type ContentProps = {
  confirmCancel: boolean;
  now: Date;
  onCloseCancel: () => void;
  order: Order;
};

function OrderDetailsContent({
  order,
  now,
  confirmCancel,
  onCloseCancel,
}: ContentProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const startPicking = useOrdersStore((s) => s.startPicking);
  const assignOrder = useOrdersStore((s) => s.assignOrder);
  const cancelOrder = useOrdersStore((s) => s.cancelOrder);
  const employees = useRosterStore((s) => s.employees);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [assigning, setAssigning] = useState(false);

  const units = useMemo(() => getUnitProgress(order), [order]);
  const readiness = useMemo(() => canMarkReady(order), [order]);
  const assignee = employees.find((e) => e.id === order.assigneeId);
  const overdue = isOverdue(order, now);
  const number = orderNumber(order);

  const staffOptions = useMemo(
    () => [
      ...employees
        .filter((e) => e.active && e.storeId === DEMO_STORE_ID)
        .map((e) => ({
          value: e.id,
          label: e.name,
          description: ROLE_LABELS[e.role],
        })),
      {
        value: UNASSIGN,
        label: "Unassign",
        description: "Return the order to the unassigned queue",
      },
    ],
    [employees],
  );

  const report = (
    result: { ok: true } | { message: string; ok: false },
    success: string,
  ) => {
    if (result.ok) {
      setFeedback(null);
      AccessibilityInfo.announceForAccessibility(success);
    } else {
      setFeedback({ tone: "error", message: result.message });
    }
  };

  const handleAssign = (value: string) => {
    setAssigning(false);
    const employeeId = value === UNASSIGN ? undefined : value;
    const name = employees.find((e) => e.id === employeeId)?.name;
    report(
      assignOrder(order.id, employeeId),
      name ? `Assigned to ${name}` : "Order unassigned",
    );
  };

  const openScanner = (manual = false) =>
    router.push({
      pathname: "/orders/scan",
      params: manual
        ? { orderId: order.id, manual: "1" }
        : { orderId: order.id },
    });
  const openCompletion = () =>
    router.push({
      pathname: "/orders/complete",
      params: { orderId: order.id },
    });

  const readyHint = readiness.ok
    ? "All units verified."
    : readiness.code === "ITEMS_NOT_VERIFIED"
      ? `Scan ${units.remainingUnits} more ${units.remainingUnits === 1 ? "unit" : "units"} to mark this order ready`
      : readiness.message;

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        {feedback ? (
          <InlineBanner
            message={feedback.message}
            testID="order-feedback"
            tone={feedback.tone}
          />
        ) : null}

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <AppText
              accessibilityLabel={`Order ${number}`}
              accessibilityRole="header"
              variant="orderNumber"
            >
              #ORD-{number}
            </AppText>
            <StatusBadge {...ORDER_STATUS_META[order.status]} />
          </View>

          <View style={styles.customerRow}>
            <InitialsAvatar initials={order.customerInitials} />
            <View
              accessible
              accessibilityLabel={`Customer ${spellInitials(order.customerInitials)}, placed ${placedLabel(order, now)}, due ${formatClockTime(dueAt(order))}`}
              style={styles.flex}
            >
              <AppText style={styles.customer}>
                Customer {order.customerInitials}
              </AppText>
              <AppText
                color="textMuted"
                testID="order-timing"
                variant="supporting"
              >
                Placed {placedLabel(order, now)}
                {isActive(order)
                  ? ` · due ${formatClockTime(dueAt(order))}`
                  : ""}
              </AppText>
            </View>
            {overdue ? (
              <View style={styles.overdue} testID="overdue-pill">
                <Ionicons
                  color={colors.errorText}
                  name="alert-circle-outline"
                  size={14}
                />
                <AppText style={styles.overdueText}>
                  Overdue {formatDuration(minutesOverdue(order, now))}
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.assignRow}>
            <AppText style={[styles.flex, styles.small]} testID="assignee">
              {assignee ? (
                <>
                  <AppText color="textMuted" style={styles.small}>
                    {order.status === "READY" || order.status === "COLLECTED"
                      ? "Packed by "
                      : "Assigned to "}
                  </AppText>
                  <AppText style={[styles.small, styles.strong]}>
                    {assignee.name}
                  </AppText>
                </>
              ) : (
                <AppText color="textMuted" style={styles.small}>
                  Not assigned yet
                </AppText>
              )}
            </AppText>
            {isActive(order) ? (
              <Pressable
                accessibilityLabel={
                  assignee
                    ? `Reassign, currently ${assignee.name}`
                    : "Assign this order"
                }
                accessibilityRole="button"
                style={styles.textButton}
                testID="reassign"
                onPress={() => setAssigning(true)}
              >
                <AppText style={styles.textButtonLabel}>
                  {assignee ? "Reassign" : "Assign"}
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <View
            accessible
            accessibilityLabel={`Picking progress: ${units.pickedUnits} of ${units.totalUnits} ${units.totalUnits === 1 ? "unit" : "units"} picked`}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: units.percent }}
            style={styles.progress}
          >
            <View style={styles.progressLabels}>
              <AppText style={[styles.small, styles.strong]}>
                {units.pickedUnits} of {units.totalUnits}{" "}
                {units.totalUnits === 1 ? "unit" : "units"} picked
              </AppText>
              <AppText color="textMuted" style={styles.small}>
                {units.percent}%
              </AppText>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${units.percent}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.products}>
          <AppText accessibilityRole="header" variant="cardTitle">
            Products · {order.items.length}
          </AppText>
          {order.items.map((item) => {
            const verified = isItemVerified(item);
            return (
              <ProductRow
                accessibilityLabel={`${item.brand ?? ""} ${item.name}, SKU ${item.sku}, picked ${item.pickedQuantity} of ${item.requiredQuantity}, ${verified ? "verified" : "still to scan"}`}
                brand={item.brand ?? ""}
                detail={`SKU ${item.sku} · ${item.barcode}`}
                key={item.id}
                name={item.name}
                quantity={`${item.pickedQuantity} / ${item.requiredQuantity}`}
                seed={item.productId}
                swatch={productSwatch(item.productId)}
                testID={`order-item-${item.id}`}
                trailing={verified ? { kind: "verified" } : { kind: "toScan" }}
              />
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}
      >
        <Footer
          order={order}
          readyHint={readyHint}
          readyOk={readiness.ok}
          onMarkReady={openCompletion}
          onScan={() => openScanner()}
          onStartPicking={() =>
            report(startPicking(order.id), "Picking started")
          }
          onTypeCode={() => openScanner(true)}
        />
      </View>

      <OptionSheet
        options={staffOptions}
        selected={order.assigneeId}
        testID="assign-sheet"
        title={assignee ? "Reassign order" : "Assign order"}
        visible={assigning}
        onClose={() => setAssigning(false)}
        onSelect={handleAssign}
      />
      <ConfirmationModal
        destructive
        cancelLabel="Keep order"
        confirmLabel="Cancel order"
        message="The customer's order is cancelled and removed from the picking queue. This cannot be undone."
        title={`Cancel order #ORD-${number}?`}
        visible={confirmCancel}
        onCancel={onCloseCancel}
        onConfirm={() => {
          onCloseCancel();
          report(cancelOrder(order.id), `Order ${number} cancelled`);
        }}
      />
    </View>
  );
}

type FooterProps = {
  onMarkReady: () => void;
  onScan: () => void;
  onStartPicking: () => void;
  onTypeCode: () => void;
  order: Order;
  readyHint: string;
  readyOk: boolean;
};

function Footer({
  order,
  readyOk,
  readyHint,
  onStartPicking,
  onScan,
  onTypeCode,
  onMarkReady,
}: FooterProps) {
  switch (order.status) {
    case "NEW":
      return (
        <PrimaryButton
          accessibilityHint="Moves this order into picking"
          icon="play-outline"
          label="Start picking"
          testID="start-picking"
          onPress={onStartPicking}
        />
      );
    case "PICKING":
      return readyOk ? (
        <>
          <PrimaryButton
            accessibilityHint="Opens the completion check for this order"
            icon="checkmark-done-outline"
            label="Mark ready"
            testID="mark-ready"
            onPress={onMarkReady}
          />
          <AppText
            color="textMuted"
            style={styles.hint}
            testID="ready-helper"
            variant="supporting"
          >
            {readyHint}
          </AppText>
        </>
      ) : (
        <>
          <PrimaryButton
            accessibilityHint="Opens the barcode scanner to verify products"
            icon="barcode-outline"
            label="Scan product"
            testID="scan-product"
            onPress={onScan}
          />
          <View style={styles.footerRow}>
            <SecondaryButton
              disabled
              accessibilityHint={readyHint}
              icon="checkmark-done-outline"
              label="Mark ready"
              style={styles.flex}
              testID="mark-ready"
            />
            <SecondaryButton
              accessibilityHint="Enter a barcode by hand"
              icon="keypad-outline"
              label="Type code"
              testID="type-code"
              onPress={onTypeCode}
            />
          </View>
          <AppText
            color="textMuted"
            style={styles.hint}
            testID="ready-helper"
            variant="supporting"
          >
            {readyHint}
          </AppText>
        </>
      );
    case "READY":
      return (
        <InlineBanner
          message="Ready for collection. Hand-over flow arrives in a later milestone."
          tone="success"
        />
      );
    case "COLLECTED":
      return (
        <InlineBanner message="This order has been collected." tone="info" />
      );
    case "CANCELLED":
      return <InlineBanner message="This order was cancelled." tone="info" />;
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  iconButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    gap: 14,
  },
  hero: {
    gap: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  customerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  customer: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  overdue: { flexDirection: "row", alignItems: "center", gap: 5 },
  overdueText: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.errorText,
  },
  assignRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  small: { fontSize: 13, lineHeight: 18 },
  strong: { fontFamily: fontFamily.semibold, color: colors.text },
  textButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  textButtonLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    color: colors.accentText,
  },
  progress: { gap: spacing.sm },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  products: { gap: spacing.sm },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerRow: { flexDirection: "row", gap: spacing.sm },
  hint: { textAlign: "center" },
});
