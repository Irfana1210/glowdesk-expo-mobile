import { type FC, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";

import { AppText } from "@/components/ui/AppText";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

import { colors, radius, spacing } from "@/theme";

const BARCODE_TYPES = [
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "itf14",
] as const;

type Props = {
  /** Pass undefined to pause scanning, for example once every item is verified. */
  onScan?: (barcode: string) => void;
};

/**
 * Camera viewfinder with every permission state handled. Manual entry lives outside this
 * component, so the scanner screen still works when the camera is denied or missing.
 */
export const BarcodeCamera: FC<Props> = ({ onScan }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [mountError, setMountError] = useState<string | null>(null);

  if (!permission) {
    return (
      <View
        accessibilityLabel="Checking camera access"
        style={[styles.frame, styles.centered]}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[styles.frame, styles.centered, styles.message]}
        testID="camera-permission"
      >
        <Ionicons color={colors.accent} name="camera-outline" size={32} />
        <AppText style={styles.center} variant="cardTitle">
          Camera access needed
        </AppText>
        <AppText color="textMuted" style={styles.center}>
          Allow the camera to scan product barcodes, or enter barcodes manually
          below.
        </AppText>
        {permission.canAskAgain ? (
          <PrimaryButton
            icon="camera"
            label="Allow camera"
            onPress={() => void requestPermission()}
          />
        ) : (
          <PrimaryButton
            icon="settings-outline"
            label="Open Settings"
            onPress={() => void Linking.openSettings()}
          />
        )}
      </View>
    );
  }

  if (mountError) {
    return (
      <View
        style={[styles.frame, styles.centered, styles.message]}
        testID="camera-error"
      >
        <Ionicons color={colors.accent} name="videocam-off-outline" size={32} />
        <AppText style={styles.center} variant="cardTitle">
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
      accessible
      accessibilityLabel={
        onScan
          ? "Camera viewfinder. Point at a product barcode."
          : "Scanning paused."
      }
      style={styles.frame}
    >
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        facing="back"
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={
          onScan
            ? (result: BarcodeScanningResult) => onScan(result.data)
            : undefined
        }
        onMountError={(event) =>
          setMountError(event.message || "The camera could not start.")
        }
      />
      <View pointerEvents="none" style={styles.reticle} />
      {!onScan ? (
        <View pointerEvents="none" style={styles.paused}>
          <AppText color="textOnAccent" variant="bodyStrong">
            Scanning paused
          </AppText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    height: 220,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.text,
  },
  centered: { alignItems: "center", justifyContent: "center" },
  message: {
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: { textAlign: "center" },
  reticle: {
    position: "absolute",
    left: "12%",
    right: "12%",
    top: "32%",
    bottom: "32%",
    borderWidth: 2,
    borderColor: colors.accentSoft,
    borderRadius: radius.md,
  },
  paused: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlay,
  },
});
