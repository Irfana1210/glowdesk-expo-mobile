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

import { LOCALE } from "@/constants/locale";

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

const L = LOCALE.roster.shiftEditor;

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
      <Screen testID="SHIFT_EDITOR.SCREEN">
        <AppHeader title={L.editTitle} onBack={close} />
        <ErrorState
          message={L.notFoundMessage}
          retryLabel={L.backToRoster}
          title={L.notFoundTitle}
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
      isEditing ? L.shiftUpdated : L.shiftAdded,
    );
    successHandler(isEditing ? MessageType.Update : MessageType.Create);
    onDone();
  });

  const errorMessages = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean);

  return (
    <Screen testID="SHIFT_EDITOR.SCREEN">
      <AppHeader title={isEditing ? L.editTitle : L.addTitle} onBack={onDone} />
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
              message={errors.root?.message ?? L.fixFields}
              testID="SHIFT_EDITOR.FORM_ERRORS"
              tone="error"
            />
          ) : null}

          <Controller
            control={control}
            name="employeeId"
            render={({ field, fieldState }) => (
              <SelectField
                error={fieldState.error?.message}
                label={L.employeeLabel}
                options={employeeOptions}
                placeholder={L.employeePlaceholder}
                testID="SHIFT_EDITOR.FIELD_EMPLOYEE"
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
                <AppText variant="label">{L.dateLabel}</AppText>
                <View
                  accessibilityLabel={L.shiftDate}
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
                        testID={`SHIFT_EDITOR.FIELD_DATE.${key}`}
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
                    label={L.startTimeLabel}
                    options={ShiftFormUtils.TIME_OPTIONS}
                    testID="SHIFT_EDITOR.FIELD_START"
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
                    label={L.endTimeLabel}
                    options={ShiftFormUtils.TIME_OPTIONS}
                    testID="SHIFT_EDITOR.FIELD_END"
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
              testID="SHIFT_EDITOR.FIELD_END_ERROR"
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
                  <AppText variant="bodyStrong">{L.endsNextDay}</AppText>
                  <AppText color="textMuted" variant="supporting">
                    {L.endsNextDayHint}
                  </AppText>
                </View>
                <Switch
                  accessibilityLabel={L.endsNextDay}
                  testID="SHIFT_EDITOR.FIELD_NEXT_DAY"
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
                label={L.unpaidBreakLabel}
                options={ShiftFormUtils.BREAK_OPTIONS}
                testID="SHIFT_EDITOR.FIELD_BREAK"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <View accessible style={styles.summary} testID="SHIFT_EDITOR.SUMMARY">
            <AppText variant="cardTitle">{L.summaryTitle}</AppText>
            <AppText color="textMuted">
              {draft && duration > 0
                ? L.summaryHours(
                    ShiftUtils.formatHours(duration),
                    ShiftUtils.formatHours(ShiftUtils.paidMinutes(draft)),
                  )
                : L.summaryInvalid}
            </AppText>
            {draft &&
            !DateUtils.isSameDay(
              new Date(draft.startAt),
              new Date(draft.endAt),
            ) ? (
              <AppText color="textMuted">
                {L.endsOn(DateUtils.formatDayLabel(new Date(draft.endAt)))}
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
            label={isEditing ? L.saveChanges : L.addShift}
            testID="SHIFT_EDITOR.SAVE_SHIFT"
            onPress={onSave}
          />
          {isEditing ? (
            <SecondaryButton
              icon="trash-outline"
              label={L.removeShift}
              testID="SHIFT_EDITOR.DELETE_SHIFT"
              onPress={() => setConfirmDelete(true)}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <ConfirmationModal
        destructive
        confirmLabel={L.removeShift}
        message={L.removeConfirmMessage}
        title={L.removeConfirmTitle}
        visible={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (shift) {
            removeShift(shift.id);
          }
          setConfirmDelete(false);
          AccessibilityInfo.announceForAccessibility(L.shiftRemoved);
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
