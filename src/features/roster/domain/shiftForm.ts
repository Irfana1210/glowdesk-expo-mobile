/**
 * Shift editor form model. Zod checks the shape of the input; the domain rules in
 * `validateShift` do the real validation, so the form and the store can never disagree.
 */
import { z } from "zod";

import { formatClockTime } from "@/lib/format";

import { type Shift, type ShiftDraft } from "../types";
import { addDays, atTime, fromDateKey, toDateKey, toTimeValue } from "./dates";
import { type ShiftValidationContext, validateShift } from "./shifts";

const TIME = /^\d{2}:\d{2}$/;

export const shiftFormSchema = z.object({
  employeeId: z.string().min(1, "Choose an employee."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  startTime: z.string().regex(TIME, "Choose a start time."),
  endTime: z.string().regex(TIME, "Choose an end time."),
  endsNextDay: z.boolean(),
  breakMinutes: z
    .number()
    .int("Break must be whole minutes.")
    .min(0, "Break cannot be negative."),
});

export type ShiftFormValues = z.infer<typeof shiftFormSchema>;

/** Form values to absolute instants. Overnight shifts get an explicit next-day end date. */
export function toShiftDraft(values: ShiftFormValues): ShiftDraft | null {
  const day = fromDateKey(values.date);
  if (!day) {
    return null;
  }
  const startAt = atTime(day, values.startTime);
  const endAt = atTime(
    values.endsNextDay ? addDays(day, 1) : day,
    values.endTime,
  );
  if (!startAt || !endAt) {
    return null;
  }
  return {
    employeeId: values.employeeId,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    unpaidBreakMinutes: values.breakMinutes,
  };
}

export function toFormValues(shift: Shift): ShiftFormValues {
  const start = new Date(shift.startAt);
  const end = new Date(shift.endAt);
  return {
    employeeId: shift.employeeId,
    date: toDateKey(start),
    startTime: toTimeValue(start),
    endTime: toTimeValue(end),
    endsNextDay: toDateKey(end) !== toDateKey(start),
    breakMinutes: shift.unpaidBreakMinutes,
  };
}

export function defaultFormValues(date: string): ShiftFormValues {
  return {
    employeeId: "",
    date,
    startTime: "09:00",
    endTime: "17:00",
    endsNextDay: false,
    breakMinutes: 30,
  };
}

const FIELD_FOR: Record<keyof ShiftDraft, keyof ShiftFormValues> = {
  employeeId: "employeeId",
  startAt: "startTime",
  endAt: "endTime",
  unpaidBreakMinutes: "breakMinutes",
};

/** Shape checks plus every domain rule, mapped onto form fields. Overlaps go to `root`. */
export function createShiftFormSchema(context: ShiftValidationContext) {
  return shiftFormSchema.superRefine((values, ctx) => {
    const draft = toShiftDraft(values);
    if (!draft) {
      return;
    }
    const errors = validateShift(draft, context);
    for (const [key, message] of Object.entries(errors)) {
      if (!message) {
        continue;
      }
      const path = key === "form" ? "root" : FIELD_FOR[key as keyof ShiftDraft];
      ctx.addIssue({ code: "custom", message, path: [path] });
    }
  });
}

/** Every quarter hour of the day, for the time pickers. */
export const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const value = `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`;
  const [h, m] = value.split(":").map(Number);
  return { value, label: formatClockTime(new Date(2000, 0, 1, h, m)) };
});

export const BREAK_OPTIONS = [0, 15, 30, 45, 60, 90].map((minutes) => ({
  value: minutes,
  label: minutes === 0 ? "No unpaid break" : `${minutes} minutes`,
}));
