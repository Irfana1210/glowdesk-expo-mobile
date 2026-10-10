import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
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
} from '@/components/ui';
import { ROLE_LABELS } from '@/features/employees/types';
import { useRosterStore } from '@/features/roster/store/useRosterStore';
import { useNow } from '@/hooks/useNow';
import { formatClockTime, formatDuration } from '@/lib/format';
import { DEMO_STORE_ID } from '@/mocks/store';
import { productSwatch } from '@/mocks/products';
import { colors, fontFamily, radius, spacing, touchTarget } from '@/theme';
import type { Order } from '@/types/order';

import { canMarkReady, getUnitProgress, isItemVerified } from '../domain/orderStateMachine';
import { dueAt, isActive, isOverdue, minutesOverdue } from '../domain/schedule';
import { useEnsureOrdersLoaded } from '../hooks/useEnsureOrdersLoaded';
import { ORDER_STATUS_META, spellInitials } from '../orderStatusMeta';
import { orderNumber, placedLabel } from '../presentation';
import { selectOrderById, useOrdersStore } from '../store/useOrdersStore';

type Feedback = { tone: 'error' | 'success'; message: string } | null;

const UNASSIGN = '__unassign__';

export function OrderDetailsScreen({ now: fixedNow }: { now?: Date } = {}) {
  const router = useRouter();
  const liveNow = useNow();
  const now = fixedNow ?? liveNow;
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrdersStore(selectOrderById(id));
  const loadStatus = useEnsureOrdersLoaded();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/orders');
  }, [router]);

  let content;
  if (!order && (loadStatus === 'idle' || loadStatus === 'loading')) {
    content = <LoadingState message="Loading order" />;
  } else if (!order) {
    content = (
      <ErrorState
        title="Order not found"
        message={`We couldn't find order ${id ?? ''}. It may have been removed.`}
        onRetry={() => router.replace('/orders')}
        retryLabel="Back to orders"
      />
    );
  } else {
    content = (
      <OrderDetailsContent
        order={order}
        now={now}
        confirmCancel={confirmCancel}
        onCloseCancel={() => setConfirmCancel(false)}
      />
    );
  }

  const canCancel = order ? isActive(order) : false;

  return (
    <Screen edges={['top', 'left', 'right']} testID="order-details-screen">
      <AppHeader
        title="Order details"
        onBack={goBack}
        right={
          canCancel ? (
            <Pressable
              testID="more-actions"
              onPress={() => setConfirmCancel(true)}
              accessibilityRole="button"
              accessibilityLabel="More order actions"
              style={styles.iconButton}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
            </Pressable>
          ) : null
        }
      />
      {content}
    </Screen>
  );
}

interface ContentProps {
  order: Order;
  now: Date;
  confirmCancel: boolean;
  onCloseCancel: () => void;
}

function OrderDetailsContent({ order, now, confirmCancel, onCloseCancel }: ContentProps) {
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
        .map((e) => ({ value: e.id, label: e.name, description: ROLE_LABELS[e.role] })),
      { value: UNASSIGN, label: 'Unassign', description: 'Return the order to the unassigned queue' },
    ],
    [employees],
  );

  const report = (result: { ok: true } | { ok: false; message: string }, success: string) => {
    if (result.ok) {
      setFeedback(null);
      AccessibilityInfo.announceForAccessibility(success);
    } else {
      setFeedback({ tone: 'error', message: result.message });
    }
  };

  const handleAssign = (value: string) => {
    setAssigning(false);
    const employeeId = value === UNASSIGN ? undefined : value;
    const name = employees.find((e) => e.id === employeeId)?.name;
    report(assignOrder(order.id, employeeId), name ? `Assigned to ${name}` : 'Order unassigned');
  };

  const openScanner = (manual = false) =>
    router.push({ pathname: '/orders/scan', params: manual ? { orderId: order.id, manual: '1' } : { orderId: order.id } });
  const openCompletion = () => router.push({ pathname: '/orders/complete', params: { orderId: order.id } });

  const readyHint = readiness.ok
    ? 'All units verified.'
    : readiness.code === 'ITEMS_NOT_VERIFIED'
      ? `Scan ${units.remainingUnits} more ${units.remainingUnits === 1 ? 'unit' : 'units'} to mark this order ready`
      : readiness.message;

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        {feedback ? <InlineBanner tone={feedback.tone} message={feedback.message} testID="order-feedback" /> : null}

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <AppText variant="orderNumber" accessibilityRole="header" accessibilityLabel={`Order ${number}`}>
              #ORD-{number}
            </AppText>
            <StatusBadge {...ORDER_STATUS_META[order.status]} />
          </View>

          <View style={styles.customerRow}>
            <InitialsAvatar initials={order.customerInitials} />
            <View
              style={styles.flex}
              accessible
              accessibilityLabel={`Customer ${spellInitials(order.customerInitials)}, placed ${placedLabel(order, now)}, due ${formatClockTime(dueAt(order))}`}
            >
              <AppText style={styles.customer}>Customer {order.customerInitials}</AppText>
              <AppText variant="supporting" color="textMuted" testID="order-timing">
                Placed {placedLabel(order, now)}
                {isActive(order) ? ` · due ${formatClockTime(dueAt(order))}` : ''}
              </AppText>
            </View>
            {overdue ? (
              <View style={styles.overdue} testID="overdue-pill">
                <Ionicons name="alert-circle-outline" size={14} color={colors.errorText} />
                <AppText style={styles.overdueText}>Overdue {formatDuration(minutesOverdue(order, now))}</AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.assignRow}>
            <AppText style={[styles.flex, styles.small]} testID="assignee">
              {assignee ? (
                <>
                  <AppText color="textMuted" style={styles.small}>
                    {order.status === 'READY' || order.status === 'COLLECTED' ? 'Packed by ' : 'Assigned to '}
                  </AppText>
                  <AppText style={[styles.small, styles.strong]}>{assignee.name}</AppText>
                </>
              ) : (
                <AppText color="textMuted" style={styles.small}>
                  Not assigned yet
                </AppText>
              )}
            </AppText>
            {isActive(order) ? (
              <Pressable
                testID="reassign"
                onPress={() => setAssigning(true)}
                accessibilityRole="button"
                accessibilityLabel={assignee ? `Reassign, currently ${assignee.name}` : 'Assign this order'}
                style={styles.textButton}
              >
                <AppText style={styles.textButtonLabel}>{assignee ? 'Reassign' : 'Assign'}</AppText>
              </Pressable>
            ) : null}
          </View>

          <View
            style={styles.progress}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Picking progress: ${units.pickedUnits} of ${units.totalUnits} ${units.totalUnits === 1 ? 'unit' : 'units'} picked`}
            accessibilityValue={{ min: 0, max: 100, now: units.percent }}
          >
            <View style={styles.progressLabels}>
              <AppText style={[styles.small, styles.strong]}>
                {units.pickedUnits} of {units.totalUnits} {units.totalUnits === 1 ? 'unit' : 'units'} picked
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
          <AppText variant="cardTitle" accessibilityRole="header">
            Products · {order.items.length}
          </AppText>
          {order.items.map((item) => {
            const verified = isItemVerified(item);
            return (
              <ProductRow
                key={item.id}
                testID={`order-item-${item.id}`}
                seed={item.productId}
                swatch={productSwatch(item.productId)}
                brand={item.brand ?? ''}
                name={item.name}
                detail={`SKU ${item.sku} · ${item.barcode}`}
                quantity={`${item.pickedQuantity} / ${item.requiredQuantity}`}
                trailing={verified ? { kind: 'verified' } : { kind: 'toScan' }}
                accessibilityLabel={`${item.brand ?? ''} ${item.name}, SKU ${item.sku}, picked ${item.pickedQuantity} of ${item.requiredQuantity}, ${verified ? 'verified' : 'still to scan'}`}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Footer
          order={order}
          readyOk={readiness.ok}
          readyHint={readyHint}
          onStartPicking={() => report(startPicking(order.id), 'Picking started')}
          onScan={() => openScanner()}
          onTypeCode={() => openScanner(true)}
          onMarkReady={openCompletion}
        />
      </View>

      <OptionSheet
        testID="assign-sheet"
        visible={assigning}
        title={assignee ? 'Reassign order' : 'Assign order'}
        options={staffOptions}
        selected={order.assigneeId}
        onSelect={handleAssign}
        onClose={() => setAssigning(false)}
      />
      <ConfirmationModal
        visible={confirmCancel}
        title={`Cancel order #ORD-${number}?`}
        message="The customer's order is cancelled and removed from the picking queue. This cannot be undone."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        destructive
        onCancel={onCloseCancel}
        onConfirm={() => {
          onCloseCancel();
          report(cancelOrder(order.id), `Order ${number} cancelled`);
        }}
      />
    </View>
  );
}

interface FooterProps {
  order: Order;
  readyOk: boolean;
  readyHint: string;
  onStartPicking: () => void;
  onScan: () => void;
  onTypeCode: () => void;
  onMarkReady: () => void;
}

function Footer({ order, readyOk, readyHint, onStartPicking, onScan, onTypeCode, onMarkReady }: FooterProps) {
  switch (order.status) {
    case 'NEW':
      return (
        <PrimaryButton
          testID="start-picking"
          label="Start picking"
          icon="play-outline"
          onPress={onStartPicking}
          accessibilityHint="Moves this order into picking"
        />
      );
    case 'PICKING':
      return readyOk ? (
        <>
          <PrimaryButton
            testID="mark-ready"
            label="Mark ready"
            icon="checkmark-done-outline"
            onPress={onMarkReady}
            accessibilityHint="Opens the completion check for this order"
          />
          <AppText variant="supporting" color="textMuted" style={styles.hint} testID="ready-helper">
            {readyHint}
          </AppText>
        </>
      ) : (
        <>
          <PrimaryButton
            testID="scan-product"
            label="Scan product"
            icon="barcode-outline"
            onPress={onScan}
            accessibilityHint="Opens the barcode scanner to verify products"
          />
          <View style={styles.footerRow}>
            <SecondaryButton
              testID="mark-ready"
              label="Mark ready"
              icon="checkmark-done-outline"
              disabled
              accessibilityHint={readyHint}
              style={styles.flex}
            />
            <SecondaryButton
              testID="type-code"
              label="Type code"
              icon="keypad-outline"
              onPress={onTypeCode}
              accessibilityHint="Enter a barcode by hand"
            />
          </View>
          <AppText variant="supporting" color="textMuted" style={styles.hint} testID="ready-helper">
            {readyHint}
          </AppText>
        </>
      );
    case 'READY':
      return <InlineBanner tone="success" message="Ready for collection. Hand-over flow arrives in a later milestone." />;
    case 'COLLECTED':
      return <InlineBanner tone="info" message="This order has been collected." />;
    case 'CANCELLED':
      return <InlineBanner tone="info" message="This order was cancelled." />;
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xs, paddingBottom: spacing.lg, gap: 14 },
  hero: {
    gap: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  customer: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 19, color: colors.text },
  overdue: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  overdueText: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16, color: colors.errorText },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  small: { fontSize: 13, lineHeight: 18 },
  strong: { fontFamily: fontFamily.semibold, color: colors.text },
  textButton: { minHeight: 44, paddingHorizontal: spacing.md, justifyContent: 'center' },
  textButtonLabel: { fontFamily: fontFamily.semibold, fontSize: 13, color: colors.accentText },
  progress: { gap: spacing.sm },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  products: { gap: spacing.sm },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  hint: { textAlign: 'center' },
});
