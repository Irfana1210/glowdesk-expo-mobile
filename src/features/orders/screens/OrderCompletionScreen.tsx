import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { AppText, ErrorState, InlineBanner, LoadingState, PrimaryButton, SecondaryButton } from '@/components/ui';
import { formatOrderNumber } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { Order } from '@/types/order';

import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { canMarkReady, getPickingProgress, getTotalUnits } from '../domain/orderStateMachine';
import { spellInitials } from '../orderStatusMeta';
import { useEnsureOrdersLoaded } from '../hooks/useEnsureOrdersLoaded';
import { selectOrderById, useOrdersStore } from '../store/useOrdersStore';

export function OrderCompletionScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = useOrdersStore(selectOrderById(orderId));
  const loadStatus = useEnsureOrdersLoaded();

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/orders');
  }, [router]);

  return (
    <Screen edges={['top', 'left', 'right']} testID="completion-screen">
      <AppHeader title="Order Completion" onBack={goBack} />
      {order ? (
        <CompletionContent order={order} onBack={goBack} />
      ) : loadStatus === 'idle' || loadStatus === 'loading' ? (
        <LoadingState message="Loading order" />
      ) : (
        <ErrorState
          title="Order not found"
          message={`We couldn't find order ${orderId ?? ''}.`}
          onRetry={() => router.replace('/orders')}
          retryLabel="Back to orders"
        />
      )}
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText color="textMuted">{label}</AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function CompletionContent({ order, onBack }: { order: Order; onBack: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const markReady = useOrdersStore((s) => s.markReady);
  const [error, setError] = useState<string | null>(null);

  const progress = getPickingProgress(order);
  const totalUnits = getTotalUnits(order);
  const pickedUnits = order.items.reduce((sum, item) => sum + Math.min(item.pickedQuantity, item.requiredQuantity), 0);
  const readiness = canMarkReady(order);
  const isComplete = order.status === 'READY' || order.status === 'COLLECTED';

  const confirm = () => {
    const result = markReady(order.id);
    if (result.ok) {
      setError(null);
      AccessibilityInfo.announceForAccessibility(`${formatOrderNumber(order.id)} is ready for collection.`);
    } else {
      setError(result.message);
    }
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, isComplete ? styles.heroIconDone : styles.heroIconPending]}>
            <Ionicons
              name={isComplete ? 'checkmark-done' : 'clipboard-outline'}
              size={36}
              color={isComplete ? colors.success : colors.accent}
            />
          </View>
          <AppText variant="pageTitle" accessibilityRole="header" style={styles.center} testID="completion-title">
            {isComplete ? 'Ready for collection' : 'Confirm order is ready'}
          </AppText>
          <AppText color="textMuted" style={styles.center}>
            {isComplete
              ? `${formatOrderNumber(order.id)} can be handed to the customer.`
              : 'Check every product is bagged before confirming.'}
          </AppText>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <AppText variant="sectionTitle">{formatOrderNumber(order.id)}</AppText>
            <OrderStatusBadge status={order.status} />
          </View>
          <SummaryRow label="Customer" value={spellInitials(order.customerInitials)} />
          <SummaryRow
            label="Verified products"
            value={`${progress.verifiedItems} of ${progress.totalItems}`}
          />
          <SummaryRow label="Units picked" value={`${pickedUnits} of ${totalUnits}`} />
          <SummaryRow label="Final status" value={isComplete ? 'Ready' : 'Picking (not yet confirmed)'} />
        </View>

        {!isComplete && !readiness.ok ? (
          <InlineBanner
            tone="error"
            testID="completion-error"
            message={`This order can't be marked ready yet. ${readiness.message}`}
          />
        ) : null}
        {error ? <InlineBanner tone="error" testID="completion-action-error" message={error} /> : null}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {isComplete ? (
          <PrimaryButton
            testID="back-to-orders"
            label="Back to orders"
            icon="bag-handle-outline"
            onPress={() => router.dismissTo('/orders')}
          />
        ) : (
          <>
            <PrimaryButton
              testID="confirm-ready"
              label="Confirm ready for collection"
              icon="checkmark-done-outline"
              disabled={!readiness.ok}
              onPress={confirm}
              accessibilityHint={readiness.ok ? 'Moves the order to Ready' : readiness.message}
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
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroIconDone: { backgroundColor: colors.successSoft },
  heroIconPending: { backgroundColor: colors.accentSoft },
  center: { textAlign: 'center' },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
