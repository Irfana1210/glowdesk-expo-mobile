import { type FC } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { LOCALE } from "@/constants/locale";

import { type Employee, ROLE_LABELS } from "@/features/employees/types";

import { AppText } from "@/components/ui/app-text";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { StatusBadge } from "@/components/ui/status-badge";

import { type MockCredential } from "@/mocks/auth";
import { colors, radius, spacing } from "@/theme";

import { AuthUtils } from "../domain/auth";

const L = LOCALE.auth.signIn;

type Props = {
  credential: MockCredential;
  disabled: boolean;
  employee: Employee;
  onPress: (credential: MockCredential) => void;
};

/** One-tap demo login. Shows the credentials because this is a demo, not a real account. */
export const QuickSignInCard: FC<Props> = ({
  credential,
  disabled,
  employee,
  onPress,
}) => {
  const role = ROLE_LABELS[employee.role];
  return (
    <Pressable
      accessibilityHint={L.quickHint}
      accessibilityLabel={L.quickLabel(employee.name, role, credential.staffId)}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      testID={`SIGN_IN.QUICK.${credential.staffId}`}
      onPress={() => onPress(credential)}
    >
      <InitialsAvatar initials={AuthUtils.initials(employee.name)} size={48} />
      <View style={styles.body}>
        <AppText variant="cardTitle">{employee.name}</AppText>
        <AppText color="textMuted" variant="supporting">
          {L.credentials(credential.staffId, credential.pin)}
        </AppText>
      </View>
      <StatusBadge icon="person-outline" label={role} tone="new" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1, gap: 2 },
});
