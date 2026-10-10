import { type FC } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { LOCALE } from "@/constants/locale";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";
import { PrimaryButton } from "./primary-button";
import { SecondaryButton } from "./secondary-button";

const L = LOCALE.components.confirmationModal;

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
  cancelLabel = L.cancel,
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
          accessibilityLabel={L.dismiss}
          accessibilityRole="button"
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
        />
        <View
          accessibilityViewIsModal
          style={styles.card}
          testID="CONFIRMATION_MODAL"
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
              testID="CONFIRMATION_MODAL.CONFIRM_ACTION"
              onPress={onConfirm}
            />
            <SecondaryButton
              disabled={loading}
              label={cancelLabel}
              testID="CONFIRMATION_MODAL.CANCEL_ACTION"
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
