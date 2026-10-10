import { type FC } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";
import { PrimaryButton } from "./primary-button";
import { SecondaryButton } from "./secondary-button";

type Props = {
  cancelLabel?: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export const ConfirmationModal: FC<Props> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      statusBarTranslucent
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
        />
        <View
          accessibilityViewIsModal
          style={styles.card}
          testID="confirmation-modal"
        >
          <AppText accessibilityRole="header" variant="sectionTitle">
            {title}
          </AppText>
          <AppText color="textMuted">{message}</AppText>
          <View style={styles.actions}>
            <PrimaryButton
              icon={destructive ? "warning-outline" : undefined}
              label={confirmLabel}
              loading={loading}
              testID="confirm-action"
              onPress={onConfirm}
            />
            <SecondaryButton
              disabled={loading}
              label={cancelLabel}
              testID="cancel-action"
              onPress={onCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.overlay,
  },
  card: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
