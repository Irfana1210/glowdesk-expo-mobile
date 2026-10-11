import { useQueryClient } from "@tanstack/react-query";

import { LOCALE } from "@/constants/locale";

import { EMPLOYEES_CACHE_KEY } from "@/services/cache-keys";

import { useSafeMutation } from "@/hooks/query/use-safe-mutation";

import {
  selectStoreId,
  useSessionStore,
} from "@/features/auth/store/session.store";
import { type Employee } from "@/features/employees/types";

import { type ShiftErrors, ShiftUtils } from "../domain/shifts";
import { type Shift, type ShiftDraft } from "../types";
import {
  type CreateShiftVariables,
  type DeleteShiftVariables,
  ShiftMutations,
  type UpdateShiftVariables,
} from "./shift-mutations";

type SaveShiftResult =
  | { ok: true; shift: Shift }
  | { errors: ShiftErrors; ok: false };

/** The device picks the ID, so a shift made offline keeps the same ID once it syncs. */
function newShiftId(): string {
  return `shift-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Roster changes for screens. Each change is validated with the shared shift rules, shown
 * straight away and queued for the server, so the roster can be edited offline.
 */
export function useShiftActions() {
  const client = useQueryClient();
  const storeId = useSessionStore(selectStoreId);
  const create = useSafeMutation<Shift, Error, CreateShiftVariables>({
    mutationKey: ShiftMutations.CREATE_KEY,
  });
  const update = useSafeMutation<Shift, Error, UpdateShiftVariables>({
    mutationKey: ShiftMutations.UPDATE_KEY,
  });
  const remove = useSafeMutation<void, Error, DeleteShiftVariables>({
    mutationKey: ShiftMutations.DELETE_KEY,
  });

  const queryKey = ShiftMutations.shiftsQueryKey(storeId);
  const shifts = () => client.getQueryData<Array<Shift>>(queryKey) ?? [];
  const writeShifts = (next: Array<Shift>) => {
    void client.cancelQueries({ queryKey });
    client.setQueryData<Array<Shift>>(queryKey, next);
  };
  const validate = (draft: ShiftDraft, editingShiftId?: string, now?: Date) =>
    ShiftUtils.validateShift(draft, {
      editingShiftId,
      employees:
        client.getQueryData<Array<Employee>>([EMPLOYEES_CACHE_KEY]) ?? [],
      now,
      shifts: shifts(),
      storeId,
    });

  return {
    /** Adds a shift. It may not start before `now`. */
    addShift: (draft: ShiftDraft, now: Date = new Date()): SaveShiftResult => {
      const errors = validate(draft, undefined, now);
      if (ShiftUtils.hasErrors(errors)) {
        return { errors, ok: false };
      }
      const shift: Shift = { ...draft, id: newShiftId(), storeId };
      writeShifts([...shifts(), shift]);
      create.mutate({ shift });
      return { ok: true, shift };
    },
    removeShift: (shiftId: string): void => {
      writeShifts(shifts().filter((s) => s.id !== shiftId));
      remove.mutate({ shiftId, storeId });
    },
    updateShift: (shiftId: string, draft: ShiftDraft): SaveShiftResult => {
      const existing = shifts().find((s) => s.id === shiftId);
      if (!existing) {
        return {
          errors: { form: LOCALE.roster.validation.shiftMissing },
          ok: false,
        };
      }
      const errors = validate(draft, shiftId);
      if (ShiftUtils.hasErrors(errors)) {
        return { errors, ok: false };
      }
      const shift: Shift = { ...existing, ...draft };
      writeShifts(shifts().map((s) => (s.id === shiftId ? shift : s)));
      update.mutate({ draft, shiftId, storeId });
      return { ok: true, shift };
    },
  };
}
