import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import {
  AppText,
  ConfirmationModal,
  ErrorState,
  InlineBanner,
  PrimaryButton,
  SecondaryButton,
  SelectField,
} from '@/components/ui';
import { EMPLOYMENT_TYPE_LABELS, ROLE_LABELS } from '@/features/employees/types';
import { DEMO_STORE_ID } from '@/mocks/store';
import { colors, radius, spacing } from '@/theme';

import { formatDayLabel, fromDateKey, isSameDay, startOfWeek, toDateKey, weekDays, weekdayShort } from '../domain/dates';
import {
  BREAK_OPTIONS,
  TIME_OPTIONS,
  createShiftFormSchema,
  defaultFormValues,
  toFormValues,
  toShiftDraft,
  type ShiftFormValues,
} from '../domain/shiftForm';
import { formatHours, paidMinutes, shiftDurationMinutes, type ShiftErrors } from '../domain/shifts';
import { useRosterStore } from '../store/useRosterStore';
import type { Shift } from '../types';

export function ShiftEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shiftId?: string; date?: string }>();
  const shift = useRosterStore((s) => s.shifts.find((x) => x.id === params.shiftId));

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/roster');
  };

  if (params.shiftId && !shift) {
    return (
      <Screen testID="shift-editor-screen">
        <AppHeader title="Edit Shift" onBack={close} />
        <ErrorState
          title="Shift not found"
          message="It may have been removed."
          onRetry={() => router.replace('/roster')}
          retryLabel="Back to roster"
        />
      </Screen>
    );
  }

  const initialDate = params.date && fromDateKey(params.date) ? params.date : toDateKey(new Date());
  return <ShiftEditorForm shift={shift} initialDate={initialDate} onDone={close} />;
}

function ShiftEditorForm({ shift, initialDate, onDone }: { shift?: Shift; initialDate: string; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const employees = useRosterStore((s) => s.employees);
  const shifts = useRosterStore((s) => s.shifts);
  const addShift = useRosterStore((s) => s.addShift);
  const updateShift = useRosterStore((s) => s.updateShift);
  const removeShift = useRosterStore((s) => s.removeShift);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = Boolean(shift);

  const schema = useMemo(
    () => createShiftFormSchema({ storeId: DEMO_STORE_ID, employees, shifts, editingShiftId: shift?.id }),
    [employees, shifts, shift?.id],
  );
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(schema),
    defaultValues: shift ? toFormValues(shift) : defaultFormValues(initialDate),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
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
  const formDay = fromDateKey(values.date) ?? new Date();
  const dayChoices = weekDays(startOfWeek(formDay));
  const draft = toShiftDraft(values);
  const duration = draft ? shiftDurationMinutes(draft) : 0;

  const applyErrors = (result: ShiftErrors) => {
    const map: Record<string, keyof ShiftFormValues | 'root'> = {
      employeeId: 'employeeId',
      startAt: 'startTime',
      endAt: 'endTime',
      unpaidBreakMinutes: 'breakMinutes',
      form: 'root',
    };
    for (const [key, message] of Object.entries(result)) {
      const field = map[key];
      if (field && message) setError(field, { type: 'domain', message });
    }
  };

  const onSave = handleSubmit((formValues) => {
    const next = toShiftDraft(formValues);
    if (!next) return;
    const result = shift ? updateShift(shift.id, next) : addShift(next);
    if (!result.ok) {
      applyErrors(result.errors);
      return;
    }
    AccessibilityInfo.announceForAccessibility(isEditing ? 'Shift updated' : 'Shift added');
    onDone();
  });

  const errorMessages = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean);

  return (
    <Screen testID="shift-editor-screen">
      <AppHeader title={isEditing ? 'Edit Shift' : 'Add Shift'} onBack={onDone} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {isSubmitted && errorMessages.length > 0 ? (
            <InlineBanner
              tone="error"
              testID="form-errors"
              message={errors.root?.message ?? 'Fix the highlighted fields before saving.'}
            />
          ) : null}

          <Controller
            control={control}
            name="employeeId"
            render={({ field, fieldState }) => (
              <SelectField
                testID="field-employee"
                label="Employee"
                placeholder="Choose an employee"
                value={field.value || undefined}
                options={employeeOptions}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <View style={styles.fieldGroup}>
                <AppText variant="label">Date</AppText>
                <View style={styles.dayRow} accessibilityRole="radiogroup" accessibilityLabel="Shift date">
                  {dayChoices.map((day) => {
                    const key = toDateKey(day);
                    const isSelected = key === field.value;
                    return (
                      <Pressable
                        key={key}
                        testID={`field-date-${key}`}
                        onPress={() => field.onChange(key)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={formatDayLabel(day)}
                        style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                      >
                        <AppText variant="supporting" maxFontSizeMultiplier={1.2}>
                          {weekdayShort(day)}
                        </AppText>
                        <AppText variant={isSelected ? 'bodyStrong' : 'body'} maxFontSizeMultiplier={1.2}>
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
                    testID="field-start"
                    label="Start time"
                    value={field.value}
                    options={TIME_OPTIONS}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View style={styles.flex}>
              <Controller
                control={control}
                name="endTime"
                render={({ field }) => (
                  <SelectField testID="field-end" label="End time" value={field.value} options={TIME_OPTIONS} onChange={field.onChange} />
                )}
              />
            </View>
          </View>
          {errors.endTime?.message ? (
            <AppText variant="supporting" color="error" testID="field-end-error">
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
                  <AppText variant="supporting" color="textMuted">
                    For overnight shifts, such as a stocktake.
                  </AppText>
                </View>
                <Switch
                  testID="field-next-day"
                  value={field.value}
                  onValueChange={field.onChange}
                  accessibilityLabel="Ends next day"
                  trackColor={{ true: colors.accent, false: colors.border }}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="breakMinutes"
            render={({ field, fieldState }) => (
              <SelectField
                testID="field-break"
                label="Unpaid break"
                value={field.value}
                options={BREAK_OPTIONS}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <View style={styles.summary} accessible testID="shift-summary">
            <AppText variant="cardTitle">Summary</AppText>
            <AppText color="textMuted">
              {draft && duration > 0
                ? `${formatHours(duration)} shift · ${formatHours(paidMinutes(draft))} paid`
                : 'Choose a valid start and end time.'}
            </AppText>
            {draft && !isSameDay(new Date(draft.startAt), new Date(draft.endAt)) ? (
              <AppText color="textMuted">Ends {formatDayLabel(new Date(draft.endAt))}</AppText>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <PrimaryButton testID="save-shift" label={isEditing ? 'Save changes' : 'Add shift'} icon="checkmark" onPress={onSave} />
          {isEditing ? (
            <SecondaryButton testID="delete-shift" label="Remove shift" icon="trash-outline" onPress={() => setConfirmDelete(true)} />
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={confirmDelete}
        title="Remove this shift?"
        message="The shift is deleted from the roster. This cannot be undone."
        confirmLabel="Remove shift"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (shift) removeShift(shift.id);
          setConfirmDelete(false);
          AccessibilityInfo.announceForAccessibility('Shift removed');
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
  dayRow: { flexDirection: 'row', gap: spacing.xs },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayChipSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  row: { flexDirection: 'row', gap: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
