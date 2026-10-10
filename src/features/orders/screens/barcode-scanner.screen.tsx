import { type FC, useCallback, useRef, useState } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { FormatUtils } from "@/utils/format-utils";

import { signalScanError } from "@/features/settings/preferences.store";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { BarcodeCamera } from "@/components/scanner/barcode-camera";
import { ManualBarcodeEntry } from "@/components/scanner/manual-barcode-entry";
import { AppText } from "@/components/ui/app-text";
import { ErrorState } from "@/components/ui/error-state";
import { InlineBanner } from "@/components/ui/inline-banner";
import { LoadingState } from "@/components/ui/loading-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SecondaryButton } from "@/components/ui/secondary-button";

import { colors, radius, spacing } from "@/theme";
import { type Order } from "@/types/order";

import { OrderStateMachine } from "../domain/order-state-machine";
import { PickingUtils, type PickResult } from "../domain/picking";
import { useEnsureOrdersLoaded } from "../hooks/use-ensure-orders-loaded";
import { selectOrderById, useOrdersStore } from "../store/orders.store";

/** The camera reports the same code many times a second. Ignore repeats inside this window. */
export const SAME_CODE_COOLDOWN_MS = 2000;

type Feedback = { message: string; tone: "success" | "error" };

function feedbackFor(result: PickResult): Feedback {
  if (result.ok) {
    const { item } = result;
    return {
      tone: "success",
      message: `Verified ${item.name}. ${item.pickedQuantity} of ${item.requiredQuantity} picked.`,
    };
  }
  return { tone: "error", message: result.message };
}

export const BarcodeScannerScreen: FC = () => {
  const router = useRouter();
  const { orderId, manual } = useLocalSearchParams<{
    manual?: string;
    orderId: string;
  }>();
  const order = useOrdersStore(selectOrderById(orderId));
  const loadStatus = useEnsureOrdersLoaded();

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else router.replace("/orders");
  }, [router]);

  return (
    <Screen edges={["top", "left", "right"]} testID="scanner-screen">
      <AppHeader
        title={
          order
            ? `Scan ${FormatUtils.formatOrderNumber(order.id)}`
            : "Scan products"
        }
        onBack={close}
      />
      {order ? (
        <ScannerContent
          manualFirst={manual === "1"}
          order={order}
          onDone={close}
        />
      ) : loadStatus === "idle" || loadStatus === "loading" ? (
        <LoadingState message="Loading order" />
      ) : (
        <ErrorState
          message="Open an order and start picking before scanning."
          retryLabel="Back to orders"
          title="Order not found"
          onRetry={() => router.replace("/orders")}
        />
      )}
    </Screen>
  );
};

function ScannerContent({
  order,
  onDone,
  manualFirst = false,
}: {
  manualFirst?: boolean;
  onDone: () => void;
  order: Order;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scanItem = useOrdersStore((s) => s.scanItem);

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [manualCode, setManualCode] = useState("");
  const lastScan = useRef<{ at: number; code: string } | null>(null);

  const progress = OrderStateMachine.getPickingProgress(order);
  const allVerified =
    progress.totalItems > 0 && progress.verifiedItems === progress.totalItems;
  const remainingItems = order.items.filter(
    (item) => PickingUtils.remainingQuantity(item) > 0,
  );

  const submit = useCallback(
    (code: string): PickResult => {
      const result = scanItem(order.id, code);
      const next = feedbackFor(result);
      setFeedback(next);
      AccessibilityInfo.announceForAccessibility(next.message);
      if (!result.ok) {
        signalScanError();
      }
      return result;
    },
    [order.id, scanItem],
  );

  const handleCameraScan = useCallback(
    (code: string) => {
      const now = Date.now();
      const previous = lastScan.current;
      if (
        previous &&
        previous.code === code &&
        now - previous.at < SAME_CODE_COOLDOWN_MS
      ) {
        return;
      }
      lastScan.current = { code, at: now };
      submit(code);
    },
    [submit],
  );

  if (order.status !== "PICKING") {
    return (
      <View style={styles.padded}>
        <InlineBanner
          message={
            order.status === "NEW"
              ? "Start picking this order before scanning products."
              : "This order is no longer being picked, so scanning is closed."
          }
          tone="error"
        />
        <SecondaryButton label="Back to order" onPress={onDone} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <BarcodeCamera onScan={allVerified ? undefined : handleCameraScan} />

        {feedback ? (
          <InlineBanner
            message={feedback.message}
            testID="scan-feedback"
            tone={feedback.tone}
          />
        ) : null}

        <ProgressBar
          label={`${progress.verifiedItems} of ${FormatUtils.pluralise(progress.totalItems, "item")} verified`}
          ratio={progress.ratio}
        />

        {allVerified ? (
          <View style={styles.doneBlock}>
            <InlineBanner
              message="All items verified. Review the order and mark it ready."
              tone="success"
            />
            <PrimaryButton
              icon="checkmark-done-outline"
              label="Review and complete"
              testID="review-complete"
              onPress={() =>
                router.replace({
                  pathname: "/orders/complete",
                  params: { orderId: order.id },
                })
              }
            />
          </View>
        ) : (
          <>
            <ManualBarcodeEntry
              autoFocus={manualFirst}
              value={manualCode}
              onChangeValue={setManualCode}
              onSubmit={(code) => submit(code).ok}
            />

            <AppText accessibilityRole="header" variant="cardTitle">
              Still to pick
            </AppText>
            {__DEV__ ? (
              <AppText color="textMuted" variant="supporting">
                Development build: tap an item to fill its barcode.
              </AppText>
            ) : null}
            <View style={styles.remainingList}>
              {remainingItems.map((item) => (
                <Pressable
                  accessibilityLabel={`${item.name}, ${PickingUtils.remainingQuantity(item)} still to pick, barcode ${item.barcode}`}
                  accessibilityRole={__DEV__ ? "button" : "text"}
                  disabled={!__DEV__}
                  key={item.id}
                  style={styles.remainingRow}
                  testID={`remaining-${item.id}`}
                  onPress={() => setManualCode(item.barcode)}
                >
                  <Ionicons
                    color={colors.disabled}
                    name="ellipse-outline"
                    size={18}
                  />
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{item.name}</AppText>
                    <AppText color="textMuted" variant="supporting">
                      {item.barcode}
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong">
                    ×{PickingUtils.remainingQuantity(item)}
                  </AppText>
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  doneBlock: { gap: spacing.md },
  remainingList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  remainingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
