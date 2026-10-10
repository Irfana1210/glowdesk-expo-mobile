import { type FC, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";

import { successHandler } from "@/utils/success-handler";

import {
  EMPLOYMENT_TYPE_LABELS,
  ROLE_LABELS,
} from "@/features/employees/types";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { ErrorState } from "@/components/ui/error-state";
import { InlineBanner } from "@/components/ui/inline-banner";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { SelectField } from "@/components/ui/select-field";

import { DEMO_STORE_ID } from "@/mocks/store";
import { colors, radius, spacing } from "@/theme";
import { MessageType } from "@/types/enums";

import { DateUtils } from "../domain/dates";
import { ShiftFormUtils, type ShiftFormValues } from "../domain/shift-form";
import { type ShiftErrors, ShiftUtils } from "../domain/shifts";
import { useRosterStore } from "../store/roster.store";
import { type Shift } from "../types";

export const ShiftEditorScreen: FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; shiftId?: string }>();
  const shift = useRosterStore((s) =>
    s.shifts.find((x) => x.id === params.shiftId),
  );

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else router.replace("/roster");
  };

  if (params.shiftId && !shift) {
    return (
      <Screen testID="shift-editor-screen">
        <AppHeader title="Edit Shift" onBack={close} />
        <ErrorState
          message="It may have been removed."
          retryLabel="Back to roster"
          title="Shift not found"
          onRetry={() => router.replace("/roster")}
        />
      </Screen>
    );
  }

  const initialDate =
    params.date && DateUtils.fromDateKey(params.date)
      ? params.date
      : DateUtils.toDateKey(new Date());
  return (
    <ShiftEditorForm initialDate={initialDate} shift={shift} onDone={close} />
  );
};

function ShiftEditorForm({
  shift,
  initialDate,
  onDone,
}: {
  initialDate: string;
  onDone: () => void;
  shift?: Shift;
}) {
  const insets = useSafeAreaInsets();
  const employees = useRosterStore((s) => s.employees);
  const shifts = useRosterStore((s) => s.shifts);
  const addShift = useRosterStore((s) => s.addShift);
  const updateShift = useRosterStore((s) => s.updateShift);
  const removeShift = useRosterStore((s) => s.removeShift);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = Boolean(shift);

  const schema = useMemo(
    () =>
      ShiftFormUtils.createShiftFormSchema({
        storeId: DEMO_STORE_ID,
        employees,
        shifts,
        editingShiftId: shift?.id,
      }),
    [employees, shifts, shift?.id],
  );
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(schema),
    defaultValues: shift
      ? ShiftFormUtils.toFormValues(shift)
      : ShiftFormUtils.defaultFormValues(initialDate),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const values = useWatch({ control }) as ShiftFormValues;

  // Only active staff at this store can be chosen; the rules reject anyone else regardless.
  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => e.active && e.storeId === DEMO_STORE_ID)
        .map((e) => ({
          value: e.id,
          label: e.name,
          description: `${ROLE_LABELS[e.role]} · ${EMPLOYMENT_TYPE_LABELS[e.employmentType]}`,
        })),
    [employees],
  );
  const formDay = DateUtils.fromDateKey(values.date) ?? new Date();
  const dayChoices = DateUtils.weekDays(DateUtils.startOfWeek(formDay));
  const draft = ShiftFormUtils.toShiftDraft(values);
  const duration = draft ? ShiftUtils.shiftDurationMinutes(draft) : 0;

  const applyErrors = (result: ShiftErrors) => {
    const map: Record<string, keyof ShiftFormValues | "root"> = {
      employeeId: "employeeId",
      startAt: "startTime",
      endAt: "endTime",
      unpaidBreakMinutes: "breakMinutes",
      form: "root",
    };
    for (const [key, message] of Object.entries(result)) {
      const field = map[key];
      if (field && message) {
        setError(field, { type: "domain", message });
      }
    }
  };

  const onSave = handleSubmit((formValues) => {
    const next = ShiftFormUtils.toShiftDraft(formValues);
    if (!next) {
      return;
    }
    const result = shift ? updateShift(shift.id, next) : addShift(next);
    if (!result.ok) {
      applyErrors(result.errors);
      return;
    }
    AccessibilityInfo.announceForAccessibility(
      isEditing ? "Shift updated" : "Shift added",
    );
    successHandler(isEditing ? MessageType.Update : MessageType.Create);
    onDone();
  });

  const errorMessages = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean);

  return (
    <Screen testID="shift-editor-screen">
      <AppHeader
        title={isEditing ? "Edit Shift" : "Add Shift"}
        onBack={onDone}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {isSubmitted && errorMessages.length > 0 ? (
            <InlineBanner
              message={
                errors.root?.message ??
                "Fix the highlighted fields before saving."
              }
              testID="form-errors"
              tone="error"
            />
          ) : null}

          <Controller
            control={control}
            name="employeeId"
            render={({ field, fieldState }) => (
              <SelectField
                error={fieldState.error?.message}
                label="Employee"
                options={employeeOptions}
                placeholder="Choose an employee"
                testID="field-employee"
                value={field.value || undefined}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <View style={styles.fieldGroup}>
                <AppText variant="label">Date</AppText>
                <View
                  accessibilityLabel="Shift date"
                  accessibilityRole="radiogroup"
                  style={styles.dayRow}
                >
                  {dayChoices.map((day) => {
                    const key = DateUtils.toDateKey(day);
                    const isSelected = key === field.value;
                    return (
                      <Pressable
                        accessibilityLabel={DateUtils.formatDayLabel(day)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        key={key}
                        style={[
                          styles.dayChip,
                          isSelected && styles.dayChipSelected,
                        ]}
                        testID={`field-date-${key}`}
                        onPress={() => field.onChange(key)}
                      >
                        <AppText
                          maxFontSizeMultiplier={1.2}
                          variant="supporting"
                        >
                          {DateUtils.weekdayShort(day)}
                        </AppText>
                        <AppText
                          maxFontSizeMultiplier={1.2}
                          variant={isSelected ? "bodyStrong" : "body"}
                        >
                          {day.getDate()}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Controller
                control={control}
                name="startTime"
                render={({ field, fieldState }) => (
                  <SelectField
                    error={fieldState.error?.message}
                    label="Start time"
                    options={ShiftFormUtils.TIME_OPTIONS}
                    testID="field-start"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </View>
            <View style={styles.flex}>
              <Controller
                control={control}
                name="endTime"
                render={({ field }) => (
                  <SelectField
                    label="End time"
                    options={ShiftFormUtils.TIME_OPTIONS}
                    testID="field-end"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </View>
          </View>
          {errors.endTime?.message ? (
            <AppText
              color="error"
              testID="field-end-error"
              variant="supporting"
            >
              {errors.endTime.message}
            </AppText>
          ) : null}

          <Controller
            control={control}
            name="endsNextDay"
            render={({ field }) => (
              <View style={styles.switchRow}>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">Ends next day</AppText>
                  <AppText color="textMuted" variant="supporting">
                    For overnight shifts, such as a stocktake.
                  </AppText>
                </View>
                <Switch
                  accessibilityLabel="Ends next day"
                  testID="field-next-day"
                  trackColor={{ true: colors.accent, false: colors.border }}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="breakMinutes"
            render={({ field, fieldState }) => (
              <SelectField
                error={fieldState.error?.message}
                label="Unpaid break"
                options={ShiftFormUtils.BREAK_OPTIONS}
                testID="field-break"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <View accessible style={styles.summary} testID="shift-summary">
            <AppText variant="cardTitle">Summary</AppText>
            <AppText color="textMuted">
              {draft && duration > 0
                ? `${ShiftUtils.formatHours(duration)} shift · ${ShiftUtils.formatHours(ShiftUtils.paidMinutes(draft))} paid`
                : "Choose a valid start and end time."}
            </AppText>
            {draft &&
            !DateUtils.isSameDay(
              new Date(draft.startAt),
              new Date(draft.endAt),
            ) ? (
              <AppText color="textMuted">
                Ends {DateUtils.formatDayLabel(new Date(draft.endAt))}
              </AppText>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <PrimaryButton
            icon="checkmark"
            label={isEditing ? "Save changes" : "Add shift"}
            testID="save-shift"
            onPress={onSave}
          />
          {isEditing ? (
            <SecondaryButton
              icon="trash-outline"
              label="Remove shift"
              testID="delete-shift"
              onPress={() => setConfirmDelete(true)}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <ConfirmationModal
        destructive
        confirmLabel="Remove shift"
        message="The shift is deleted from the roster. This cannot be undone."
        title="Remove this shift?"
        visible={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (shift) {
            removeShift(shift.id);
          }
          setConfirmDelete(false);
          AccessibilityInfo.announceForAccessibility("Shift removed");
          successHandler(MessageType.Delete);
          onDone();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  fieldGroup: { gap: spacing.xs },
  dayRow: { flexDirection: "row", gap: spacing.xs },
  dayChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  row: { flexDirection: "row", gap: spacing.md },
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  summary: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
