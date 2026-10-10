import { StyleSheet, View } from "react-native";
import {
  type BaseToastProps,
  type ToastConfig,
} from "react-native-toast-message";

import Ionicons from "@expo/vector-icons/Ionicons";

import { AppText } from "@/components/ui/app-text";

import { colors, radius, spacing } from "@/theme";
import { ToastTypes } from "@/types/enums";

export const toastConfig: ToastConfig = {
  [ToastTypes.Error]: ({ text1 }: BaseToastProps) => (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[styles.toastContainer, styles.errorToast]}
      testID="TOAST.ERROR"
    >
      <Ionicons color={colors.errorText} name="alert-circle" size={20} />
      <AppText color="errorText" style={styles.toastLabel} variant="bodyStrong">
        {text1}
      </AppText>
    </View>
  ),

  [ToastTypes.Info]: ({ text1 }: BaseToastProps) => (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.toastContainer, styles.infoToast]}
      testID="TOAST.INFO"
    >
      <AppText style={styles.toastLabel} variant="bodyStrong">
        {text1}
      </AppText>
    </View>
  ),

  [ToastTypes.Success]: ({ text1 }: BaseToastProps) => (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.toastContainer, styles.successToast]}
      testID="TOAST.SUCCESS"
    >
      <Ionicons color={colors.successDark} name="checkmark-circle" size={20} />
      <AppText style={styles.toastLabel} variant="bodyStrong">
        {text1}
      </AppText>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorToast: { backgroundColor: colors.errorSoft },
  infoToast: { backgroundColor: colors.surface },
  successToast: { backgroundColor: colors.successSoft },
  toastLabel: { flex: 1 },
});
