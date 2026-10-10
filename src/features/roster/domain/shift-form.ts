/**
 * Shift editor form model. Zod checks the shape of the input; the domain rules in
 * `validateShift` do the real validation, so the form and the store can never disagree.
 */
import { z } from "zod";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { type Shift, type ShiftDraft } from "../types";
import { DateUtils } from "./dates";
import { ShiftUtils, type ShiftValidationContext } from "./shifts";

export type ShiftFormValues = z.infer<typeof ShiftFormUtils.shiftFormSchema>;

export namespace ShiftFormUtils {
  const TIME = /^\d{2}:\d{2}$/;

  export const shiftFormSchema = z.object({
    employeeId: z.string().min(1, LOCALE.roster.shiftForm.chooseEmployee),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, LOCALE.roster.shiftForm.chooseDate),
    startTime: z.string().regex(TIME, LOCALE.roster.shiftForm.chooseStartTime),
    endTime: z.string().regex(TIME, LOCALE.roster.shiftForm.chooseEndTime),
    endsNextDay: z.boolean(),
    breakMinutes: z
      .number()
      .int(LOCALE.roster.shiftForm.breakWholeMinutes)
      .min(0, LOCALE.roster.shiftForm.breakNegative),
  });

  /** Form values to absolute instants. Overnight shifts get an explicit next-day end date. */
  export function toShiftDraft(values: ShiftFormValues): ShiftDraft | null {
    const day = DateUtils.fromDateKey(values.date);
    if (!day) {
      return null;
    }
    const startAt = DateUtils.atTime(day, values.startTime);
    const endAt = DateUtils.atTime(
      values.endsNextDay ? DateUtils.addDays(day, 1) : day,
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
      date: DateUtils.toDateKey(start),
      startTime: DateUtils.toTimeValue(start),
      endTime: DateUtils.toTimeValue(end),
      endsNextDay: DateUtils.toDateKey(end) !== DateUtils.toDateKey(start),
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
      const errors = ShiftUtils.validateShift(draft, context);
      for (const [key, message] of Object.entries(errors)) {
        if (!message) {
          continue;
        }
        const path =
          key === "form" ? "root" : FIELD_FOR[key as keyof ShiftDraft];
        ctx.addIssue({ code: "custom", message, path: [path] });
      }
    });
  }

  /** Every quarter hour of the day, for the time pickers. */
  export const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
    const value = `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`;
    const [h, m] = value.split(":").map(Number);
    return {
      value,
      label: FormatUtils.formatClockTime(new Date(2000, 0, 1, h, m)),
    };
  });

  export const BREAK_OPTIONS = [0, 15, 30, 45, 60, 90].map((minutes) => ({
    value: minutes,
    label:
      minutes === 0
        ? LOCALE.roster.shiftForm.noUnpaidBreak
        : LOCALE.roster.shiftForm.breakOption(minutes),
  }));
}
