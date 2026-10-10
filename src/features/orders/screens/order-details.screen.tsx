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

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { useNow } from "@/hooks/use-now";

import { ROLE_LABELS } from "@/features/employees/types";
import { useRosterStore } from "@/features/roster/store/roster.store";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { ErrorState } from "@/components/ui/error-state";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { InlineBanner } from "@/components/ui/inline-banner";
import { LoadingState } from "@/components/ui/loading-state";
import { OptionSheet } from "@/components/ui/option-sheet";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ProductRow } from "@/components/ui/product-row";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { StatusBadge } from "@/components/ui/status-badge";

import { productSwatch } from "@/mocks/products";
import { DEMO_STORE_ID } from "@/mocks/store";
import { colors, fontFamily, radius, spacing, touchTarget } from "@/theme";
import { type Order } from "@/types/order";

import { OrderStateMachine } from "../domain/order-state-machine";
import { ScheduleUtils } from "../domain/schedule";
import { useEnsureOrdersLoaded } from "../hooks/use-ensure-orders-loaded";
import { ORDER_STATUS_META } from "../order-status-meta";
import { OrderPresentationUtils } from "../presentation";
import { selectOrderById, useOrdersStore } from "../store/orders.store";

type Feedback = { message: string; tone: "error" | "success" } | null;

const UNASSIGN = "__unassign__";

const L = LOCALE.orders.details;
const C = LOCALE.orders.common;

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
    content = <LoadingState message={C.loadingOrder} />;
  } else if (!order) {
    content = (
      <ErrorState
        message={L.notFoundMessage(id ?? "")}
        retryLabel={C.backToOrders}
        title={C.orderNotFound}
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

  const canCancel = order ? ScheduleUtils.isActive(order) : false;

  return (
    <Screen edges={["top", "left", "right"]} testID="order-details-screen">
      <AppHeader
        right={
          canCancel ? (
            <Pressable
              accessibilityLabel={L.moreActions}
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
        title={L.title}
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

  const units = useMemo(
    () => OrderStateMachine.getUnitProgress(order),
    [order],
  );
  const readiness = useMemo(
    () => OrderStateMachine.canMarkReady(order),
    [order],
  );
  const assignee = employees.find((e) => e.id === order.assigneeId);
  const overdue = ScheduleUtils.isOverdue(order, now);
  const number = OrderPresentationUtils.orderNumber(order);

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
        label: L.unassign,
        description: L.unassignDescription,
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
      name ? L.assignedAnnouncement(name) : L.unassignedAnnouncement,
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
    ? L.allUnitsVerified
    : readiness.code === "ITEMS_NOT_VERIFIED"
      ? L.scanMoreUnits(units.remainingUnits)
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
              accessibilityLabel={L.orderNumberAccessibilityLabel(number)}
              accessibilityRole="header"
              variant="orderNumber"
            >
              {L.orderNumber(number)}
            </AppText>
            <StatusBadge {...ORDER_STATUS_META[order.status]} />
          </View>

          <View style={styles.customerRow}>
            <InitialsAvatar initials={order.customerInitials} />
            <View
              accessible
              accessibilityLabel={L.customerAccessibilityLabel(
                OrderPresentationUtils.spellInitials(order.customerInitials),
                OrderPresentationUtils.placedLabel(order, now),
                FormatUtils.formatClockTime(ScheduleUtils.dueAt(order)),
              )}
              style={styles.flex}
            >
              <AppText style={styles.customer}>
                {L.customer(order.customerInitials)}
              </AppText>
              <AppText
                color="textMuted"
                testID="order-timing"
                variant="supporting"
              >
                {L.placed(OrderPresentationUtils.placedLabel(order, now))}
                {ScheduleUtils.isActive(order)
                  ? L.due(
                      FormatUtils.formatClockTime(ScheduleUtils.dueAt(order)),
                    )
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
                  {L.overdue(
                    FormatUtils.formatDuration(
                      ScheduleUtils.minutesOverdue(order, now),
                    ),
                  )}
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
                      ? L.packedByPrefix
                      : L.assignedToPrefix}
                  </AppText>
                  <AppText style={[styles.small, styles.strong]}>
                    {assignee.name}
                  </AppText>
                </>
              ) : (
                <AppText color="textMuted" style={styles.small}>
                  {L.notAssigned}
                </AppText>
              )}
            </AppText>
            {ScheduleUtils.isActive(order) ? (
              <Pressable
                accessibilityLabel={
                  assignee
                    ? L.reassignAccessibilityLabel(assignee.name)
                    : L.assignAccessibilityLabel
                }
                accessibilityRole="button"
                style={styles.textButton}
                testID="reassign"
                onPress={() => setAssigning(true)}
              >
                <AppText style={styles.textButtonLabel}>
                  {assignee ? L.reassign : L.assign}
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <View
            accessible
            accessibilityLabel={L.progressAccessibilityLabel(
              units.pickedUnits,
              units.totalUnits,
            )}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: units.percent }}
            style={styles.progress}
          >
            <View style={styles.progressLabels}>
              <AppText style={[styles.small, styles.strong]}>
                {L.progress(units.pickedUnits, units.totalUnits)}
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
            {L.productsHeading(order.items.length)}
          </AppText>
          {order.items.map((item) => {
            const verified = OrderStateMachine.isItemVerified(item);
            return (
              <ProductRow
                accessibilityLabel={L.productAccessibilityLabel(
                  item.brand ?? "",
                  item.name,
                  item.sku,
                  item.pickedQuantity,
                  item.requiredQuantity,
                  verified,
                )}
                brand={item.brand ?? ""}
                detail={L.productDetail(item.sku, item.barcode)}
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
            report(startPicking(order.id), L.pickingStartedAnnouncement)
          }
          onTypeCode={() => openScanner(true)}
        />
      </View>

      <OptionSheet
        options={staffOptions}
        selected={order.assigneeId}
        testID="assign-sheet"
        title={assignee ? L.reassignOrderTitle : L.assignOrderTitle}
        visible={assigning}
        onClose={() => setAssigning(false)}
        onSelect={handleAssign}
      />
      <ConfirmationModal
        destructive
        cancelLabel={L.cancel.cancelLabel}
        confirmLabel={L.cancel.confirmLabel}
        message={L.cancel.message}
        title={L.cancel.title(number)}
        visible={confirmCancel}
        onCancel={onCloseCancel}
        onConfirm={() => {
          onCloseCancel();
          report(cancelOrder(order.id), L.cancel.doneAnnouncement(number));
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
          accessibilityHint={L.footer.startPickingHint}
          icon="play-outline"
          label={L.footer.startPicking}
          testID="start-picking"
          onPress={onStartPicking}
        />
      );
    case "PICKING":
      return readyOk ? (
        <>
          <PrimaryButton
            accessibilityHint={L.footer.markReadyHint}
            icon="checkmark-done-outline"
            label={L.footer.markReady}
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
            accessibilityHint={L.footer.scanProductHint}
            icon="barcode-outline"
            label={L.footer.scanProduct}
            testID="scan-product"
            onPress={onScan}
          />
          <View style={styles.footerRow}>
            <SecondaryButton
              disabled
              accessibilityHint={readyHint}
              icon="checkmark-done-outline"
              label={L.footer.markReady}
              style={styles.flex}
              testID="mark-ready"
            />
            <SecondaryButton
              accessibilityHint={L.footer.typeCodeHint}
              icon="keypad-outline"
              label={L.footer.typeCode}
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
      return <InlineBanner message={L.footer.readyBanner} tone="success" />;
    case "COLLECTED":
      return <InlineBanner message={L.footer.collectedBanner} tone="info" />;
    case "CANCELLED":
      return <InlineBanner message={L.footer.cancelledBanner} tone="info" />;
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
