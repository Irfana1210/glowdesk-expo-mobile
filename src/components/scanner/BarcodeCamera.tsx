import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radius, spacing } from '@/theme';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'itf14'] as const;

export interface BarcodeCameraProps {
  /** Pass undefined to pause scanning, for example once every item is verified. */
  onScan?: (barcode: string) => void;
}

/**
 * Camera viewfinder with every permission state handled. Manual entry lives outside this
 * component, so the scanner screen still works when the camera is denied or missing.
 */
export function BarcodeCamera({ onScan }: BarcodeCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mountError, setMountError] = useState<string | null>(null);

  if (!permission) {
    return (
      <View style={[styles.frame, styles.centered]} accessibilityLabel="Checking camera access">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.frame, styles.centered, styles.message]} testID="camera-permission">
        <Ionicons name="camera-outline" size={32} color={colors.accent} />
        <AppText variant="cardTitle" style={styles.center}>
          Camera access needed
        </AppText>
        <AppText color="textMuted" style={styles.center}>
          Allow the camera to scan product barcodes, or enter barcodes manually below.
        </AppText>
        {permission.canAskAgain ? (
          <PrimaryButton label="Allow camera" icon="camera" onPress={() => void requestPermission()} />
        ) : (
          <PrimaryButton label="Open Settings" icon="settings-outline" onPress={() => void Linking.openSettings()} />
        )}
      </View>
    );
  }

  if (mountError) {
    return (
      <View style={[styles.frame, styles.centered, styles.message]} testID="camera-error">
        <Ionicons name="videocam-off-outline" size={32} color={colors.accent} />
        <AppText variant="cardTitle" style={styles.center}>
          Camera unavailable
        </AppText>
        <AppText color="textMuted" style={styles.center}>
          {mountError} Use manual entry below.
        </AppText>
      </View>
    );
  }

  return (
    <View
      style={styles.frame}
      accessible
      accessibilityLabel={onScan ? 'Camera viewfinder. Point at a product barcode.' : 'Scanning paused.'}
    >
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={onScan ? (result: BarcodeScanningResult) => onScan(result.data) : undefined}
        onMountError={(event) => setMountError(event.message || 'The camera could not start.')}
      />
      <View style={styles.reticle} pointerEvents="none" />
      {!onScan ? (
        <View style={styles.paused} pointerEvents="none">
          <AppText variant="bodyStrong" color="textOnAccent">
            Scanning paused
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.text,
  },
  centered: { alignItems: 'center', justifyContent: 'center' },
  message: {
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: { textAlign: 'center' },
  reticle: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '32%',
    bottom: '32%',
    borderWidth: 2,
    borderColor: colors.accentSoft,
    borderRadius: radius.md,
  },
  paused: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
});
