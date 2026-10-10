import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signalScanError } from '@/features/settings/usePreferencesStore';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import {
  AppText,
  ErrorState,
  LoadingState,
  InlineBanner,
  PrimaryButton,
  ProgressBar,
  SecondaryButton,
} from '@/components/ui';
import { formatOrderNumber, pluralise } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { Order } from '@/types/order';

import { BarcodeCamera } from '@/components/scanner/BarcodeCamera';
import { ManualBarcodeEntry } from '@/components/scanner/ManualBarcodeEntry';
import { getPickingProgress } from '../domain/orderStateMachine';
import { remainingQuantity, type PickResult } from '../domain/picking';
import { useEnsureOrdersLoaded } from '../hooks/useEnsureOrdersLoaded';
import { selectOrderById, useOrdersStore } from '../store/useOrdersStore';

/** The camera reports the same code many times a second. Ignore repeats inside this window. */
export const SAME_CODE_COOLDOWN_MS = 2000;

type Feedback = { tone: 'success' | 'error'; message: string };

function feedbackFor(result: PickResult): Feedback {
  if (result.ok) {
    const { item } = result;
    return {
      tone: 'success',
      message: `Verified ${item.name}. ${item.pickedQuantity} of ${item.requiredQuantity} picked.`,
    };
  }
  return { tone: 'error', message: result.message };
}

export function BarcodeScannerScreen() {
  const router = useRouter();
  const { orderId, manual } = useLocalSearchParams<{ orderId: string; manual?: string }>();
  const order = useOrdersStore(selectOrderById(orderId));
  const loadStatus = useEnsureOrdersLoaded();

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/orders');
  }, [router]);

  return (
    <Screen edges={['top', 'left', 'right']} testID="scanner-screen">
      <AppHeader
        title={order ? `Scan ${formatOrderNumber(order.id)}` : 'Scan products'}
        onBack={close}
      />
      {order ? (
        <ScannerContent order={order} onDone={close} manualFirst={manual === '1'} />
      ) : loadStatus === 'idle' || loadStatus === 'loading' ? (
        <LoadingState message="Loading order" />
      ) : (
        <ErrorState
          title="Order not found"
          message="Open an order and start picking before scanning."
          onRetry={() => router.replace('/orders')}
          retryLabel="Back to orders"
        />
      )}
    </Screen>
  );
}

function ScannerContent({ order, onDone, manualFirst = false }: { order: Order; onDone: () => void; manualFirst?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scanItem = useOrdersStore((s) => s.scanItem);

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [manualCode, setManualCode] = useState('');
  const lastScan = useRef<{ code: string; at: number } | null>(null);

  const progress = getPickingProgress(order);
  const allVerified = progress.totalItems > 0 && progress.verifiedItems === progress.totalItems;
  const remainingItems = order.items.filter((item) => remainingQuantity(item) > 0);

  const submit = useCallback(
    (code: string): PickResult => {
      const result = scanItem(order.id, code);
      const next = feedbackFor(result);
      setFeedback(next);
      AccessibilityInfo.announceForAccessibility(next.message);
      if (!result.ok) signalScanError();
      return result;
    },
    [order.id, scanItem],
  );

  const handleCameraScan = useCallback(
    (code: string) => {
      const now = Date.now();
      const previous = lastScan.current;
      if (previous && previous.code === code && now - previous.at < SAME_CODE_COOLDOWN_MS) return;
      lastScan.current = { code, at: now };
      submit(code);
    },
    [submit],
  );


  if (order.status !== 'PICKING') {
    return (
      <View style={styles.padded}>
        <InlineBanner
          tone="error"
          message={
            order.status === 'NEW'
              ? 'Start picking this order before scanning products.'
              : 'This order is no longer being picked, so scanning is closed.'
          }
        />
        <SecondaryButton label="Back to order" onPress={onDone} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        keyboardShouldPersistTaps="handled"
      >
        <BarcodeCamera onScan={allVerified ? undefined : handleCameraScan} />

        {feedback ? <InlineBanner tone={feedback.tone} message={feedback.message} testID="scan-feedback" /> : null}

        <ProgressBar
          ratio={progress.ratio}
          label={`${progress.verifiedItems} of ${pluralise(progress.totalItems, 'item')} verified`}
        />

        {allVerified ? (
          <View style={styles.doneBlock}>
            <InlineBanner tone="success" message="All items verified. Review the order and mark it ready." />
            <PrimaryButton
              testID="review-complete"
              label="Review and complete"
              icon="checkmark-done-outline"
              onPress={() => router.replace({ pathname: '/orders/complete', params: { orderId: order.id } })}
            />
          </View>
        ) : (
          <>
            <ManualBarcodeEntry
              value={manualCode}
              onChangeValue={setManualCode}
              onSubmit={(code) => submit(code).ok}
              autoFocus={manualFirst}
            />

            <AppText variant="cardTitle" accessibilityRole="header">
              Still to pick
            </AppText>
            {__DEV__ ? (
              <AppText variant="supporting" color="textMuted">
                Development build: tap an item to fill its barcode.
              </AppText>
            ) : null}
            <View style={styles.remainingList}>
              {remainingItems.map((item) => (
                <Pressable
                  key={item.id}
                  testID={`remaining-${item.id}`}
                  disabled={!__DEV__}
                  onPress={() => setManualCode(item.barcode)}
                  accessibilityRole={__DEV__ ? 'button' : 'text'}
                  accessibilityLabel={`${item.name}, ${remainingQuantity(item)} still to pick, barcode ${item.barcode}`}
                  style={styles.remainingRow}
                >
                  <Ionicons name="ellipse-outline" size={18} color={colors.disabled} />
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{item.name}</AppText>
                    <AppText variant="supporting" color="textMuted">
                      {item.barcode}
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong">×{remainingQuantity(item)}</AppText>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: spacing.lg, gap: spacing.lg },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg },
  doneBlock: { gap: spacing.md },
  remainingList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
