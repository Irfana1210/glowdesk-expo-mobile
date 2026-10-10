import { type FC, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { zodResolver } from "@hookform/resolvers/zod";

import { LOCALE } from "@/constants/locale";

import { AppText } from "@/components/ui/app-text";
import { InlineBanner } from "@/components/ui/inline-banner";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";

import { MOCK_CREDENTIALS, QUICK_SIGN_IN_STAFF_IDS } from "@/mocks/auth";
import { MOCK_EMPLOYEES } from "@/mocks/employees";
import { DEMO_STORE_SHORT_NAME } from "@/mocks/store";
import { colors, spacing } from "@/theme";
import { isApiError } from "@/types/api-error";

import { BrandMark } from "../components/brand-mark";
import { PatternBackdrop } from "../components/pattern-backdrop";
import { QuickSignInCard } from "../components/quick-sign-in-card";
import {
  DEFAULT_SIGN_IN_VALUES,
  type SignInFormValues,
  signInSchema,
} from "../domain/sign-in-form";
import { useSignIn } from "../hooks/use-sign-in";

const L = LOCALE.auth.signIn;

const QUICK_SIGN_INS = QUICK_SIGN_IN_STAFF_IDS.flatMap((staffId) => {
  const credential = MOCK_CREDENTIALS.find((c) => c.staffId === staffId);
  const employee = credential
    ? MOCK_EMPLOYEES.find((e) => e.id === credential.employeeId)
    : undefined;
  return credential && employee ? [{ credential, employee }] : [];
});

function errorMessage(error: Error | null): string | null {
  if (!error) {
    return null;
  }
  if (isApiError(error)) {
    return LOCALE.errors.byCode[error.code] ?? LOCALE.errors.generic;
  }
  return LOCALE.errors.generic;
}

export const SignInScreen: FC = () => {
  const insets = useSafeAreaInsets();
  const pinRef = useRef<TextInput>(null);
  const signIn = useSignIn();
  const { control, handleSubmit, setValue } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: DEFAULT_SIGN_IN_VALUES,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const submit = handleSubmit((values) => signIn.mutate(values));
  const quickSignIn = (credential: { pin: string; staffId: string }) => {
    setValue("staffId", credential.staffId);
    setValue("pin", credential.pin);
    signIn.mutate({ pin: credential.pin, staffId: credential.staffId });
  };
  const failure = errorMessage(signIn.error);

  return (
    <View style={styles.screen} testID="SIGN_IN.SCREEN">
      <PatternBackdrop />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: insets.bottom + spacing.xl,
              paddingTop: insets.top + spacing.xxl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <BrandMark eyebrow={DEMO_STORE_SHORT_NAME} />

          <View style={styles.intro}>
            <AppText
              accessibilityRole="header"
              style={styles.title}
              variant="hero"
            >
              {L.title}
            </AppText>
            <AppText color="textMuted" variant="bodyLarge">
              {L.subtitle}
            </AppText>
          </View>

          {failure ? (
            <InlineBanner
              message={failure}
              testID="SIGN_IN.ERROR"
              tone="error"
            />
          ) : null}

          <View style={styles.form}>
            <Controller
              control={control}
              name="staffId"
              render={({ field, fieldState }) => (
                <TextField
                  autoCapitalize="characters"
                  autoComplete="username"
                  autoCorrect={false}
                  editable={!signIn.isPending}
                  error={fieldState.error?.message}
                  label={L.staffId}
                  placeholder={L.staffIdPlaceholder}
                  returnKeyType="next"
                  testID="SIGN_IN.FORM.STAFF_ID"
                  textContentType="username"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  onSubmitEditing={() => pinRef.current?.focus()}
                />
              )}
            />
            <Controller
              control={control}
              name="pin"
              render={({ field, fieldState }) => (
                <TextField
                  secureTextEntry
                  autoComplete="password"
                  editable={!signIn.isPending}
                  error={fieldState.error?.message}
                  keyboardType="number-pad"
                  label={L.pin}
                  maxLength={4}
                  placeholder="••••"
                  ref={pinRef}
                  returnKeyType="done"
                  testID="SIGN_IN.FORM.PIN"
                  textContentType="password"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  onSubmitEditing={() => void submit()}
                />
              )}
            />
            <PrimaryButton
              accessibilityHint={L.submitHint}
              label={L.submit}
              loading={signIn.isPending}
              style={styles.submit}
              testID="SIGN_IN.FORM.SUBMIT"
              onPress={() => void submit()}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <AppText color="textMuted" variant="eyebrow">
              {L.quickSignIn}
            </AppText>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.quickList}>
            {QUICK_SIGN_INS.map(({ credential, employee }) => (
              <QuickSignInCard
                credential={credential}
                disabled={signIn.isPending}
                employee={employee}
                key={credential.staffId}
                onPress={quickSignIn}
              />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.xl, paddingHorizontal: spacing.xl },
  intro: { gap: spacing.xs, marginTop: spacing.sm },
  title: { fontSize: 44, lineHeight: 50 },
  form: { gap: spacing.lg },
  submit: { marginTop: spacing.sm },
  dividerRow: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  dividerLine: { backgroundColor: colors.border, flex: 1, height: 1 },
  quickList: { gap: spacing.md },
});
