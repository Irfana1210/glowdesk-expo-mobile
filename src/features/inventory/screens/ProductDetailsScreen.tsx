import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { AppText, ErrorState, InlineBanner, LoadingState, ProductThumbnail, StatusBadge } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { CATEGORY_LABELS } from '@/types/product';

import { itemStockStatus } from '../domain/stock';
import { useInventory } from '../hooks/useInventory';
import { STOCK_STATUS_META } from '../stockStatusMeta';
import type { InventoryItem } from '../types';

export function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const inventory = useInventory();
  const item = inventory.data?.find((i) => i.product.id === id);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/inventory');
  }, [router]);

  let content;
  if (inventory.isPending) content = <LoadingState message="Loading product" />;
  else if (inventory.isError)
    content = (
      <ErrorState
        title="Couldn't load product"
        message={inventory.error.message}
        onRetry={() => void inventory.refetch()}
      />
    );
  else if (!item)
    content = (
      <ErrorState
        title="Product not found"
        message={`No product with ID ${id ?? ''} in this store.`}
        onRetry={() => router.replace('/inventory')}
        retryLabel="Back to inventory"
      />
    );
  else content = <ProductDetailsContent item={item} />;

  return (
    <Screen testID="product-details-screen">
      <AppHeader title="Product Details" onBack={goBack} />
      {content}
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText color="textMuted">{label}</AppText>
      <AppText variant="bodyStrong" style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

function stockMessage(item: InventoryItem): { tone: 'error' | 'info' | 'success'; message: string } {
  switch (itemStockStatus(item)) {
    case 'OUT_OF_STOCK':
      return { tone: 'error', message: 'Out of stock. Reorder now and remove from Click & Collect availability.' };
    case 'LOW_STOCK':
      return {
        tone: 'error',
        message: `Low stock. ${item.availableQuantity} left, at or below the reorder point of ${item.reorderPoint}.`,
      };
    default:
      return { tone: 'success', message: `Healthy stock. Reorder point is ${item.reorderPoint}.` };
  }
}

function ProductDetailsContent({ item }: { item: InventoryItem }) {
  const insets = useSafeAreaInsets();
  const { product } = item;
  const status = STOCK_STATUS_META[itemStockStatus(item)];
  const message = stockMessage(item);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.hero}>
        <ProductThumbnail seed={product.id} label={product.brand} size={88} />
        <AppText variant="supporting" color="textMuted">
          {product.brand}
        </AppText>
        <AppText variant="sectionTitle" accessibilityRole="header" style={styles.center}>
          {product.name}
        </AppText>
        <AppText color="textMuted">
          {product.size} · {CATEGORY_LABELS[product.category]}
        </AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.stockTop}>
          <View accessible accessibilityLabel={`${item.availableQuantity} available`}>
            <AppText variant="supporting" color="textMuted">
              Available
            </AppText>
            <AppText variant="pageTitle" testID="available-quantity">
              {item.availableQuantity}
            </AppText>
          </View>
          <StatusBadge {...status} />
        </View>
        <InlineBanner tone={message.tone} message={message.message} testID="stock-message" />
      </View>

      <View style={styles.card}>
        <AppText variant="cardTitle" accessibilityRole="header">
          Product information
        </AppText>
        <DetailRow label="SKU" value={product.sku} />
        <DetailRow label="Barcode" value={product.barcode} />
        <DetailRow label="Category" value={CATEGORY_LABELS[product.category]} />
        <DetailRow label="Price" value={formatCurrency(product.price, { cents: true })} />
        <DetailRow label="Reorder point" value={String(item.reorderPoint)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  center: { textAlign: 'center' },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stockTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowValue: { flexShrink: 1, textAlign: 'right' },
});
