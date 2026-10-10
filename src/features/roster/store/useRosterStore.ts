/**
 * Roster state for the MVP: shifts are edited locally, so they live in a persisted Zustand
 * store (brief §9). Employees are reference data from mocks. Every write goes through the
 * pure validation rules again, so the store can never hold an invalid shift.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS, persistStorage } from '@/database/storage';
import type { Employee } from '@/features/employees/types';
import { MOCK_EMPLOYEES } from '@/mocks/employees';
import { createMockShifts } from '@/mocks/shifts';
import { DEMO_STORE_ID } from '@/mocks/store';

import { hasErrors, validateShift, type ShiftErrors } from '../domain/shifts';
import type { Shift, ShiftDraft } from '../types';

export type SaveShiftResult = { ok: true; shift: Shift } | { ok: false; errors: ShiftErrors };

interface RosterState {
  employees: Employee[];
  shifts: Shift[];
  addShift: (draft: ShiftDraft) => SaveShiftResult;
  updateShift: (shiftId: string, draft: ShiftDraft) => SaveShiftResult;
  removeShift: (shiftId: string) => void;
  resetDemoData: () => void;
}

export const ROSTER_STORAGE_KEY = STORAGE_KEYS.roster;

/**
 * v2: the demo team was replaced with the design-handoff cast, so old saved shifts point at
 * different people. They are dropped and the new demo week is used instead.
 */
export const ROSTER_STORAGE_VERSION = 2;

function newShiftId(): string {
  return `shift-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isPersistedShift(value: unknown): value is Shift {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.storeId === 'string' &&
    typeof s.employeeId === 'string' &&
    typeof s.startAt === 'string' &&
    !Number.isNaN(Date.parse(s.startAt)) &&
    typeof s.endAt === 'string' &&
    !Number.isNaN(Date.parse(s.endAt)) &&
    typeof s.unpaidBreakMinutes === 'number'
  );
}

export const useRosterStore = create<RosterState>()(
  persist(
    (set, get) => {
      const context = (editingShiftId?: string) => ({
        storeId: DEMO_STORE_ID,
        employees: get().employees,
        shifts: get().shifts,
        editingShiftId,
      });

      return {
        employees: MOCK_EMPLOYEES,
        shifts: createMockShifts(),

        addShift: (draft) => {
          const errors = validateShift(draft, context());
          if (hasErrors(errors)) return { ok: false, errors };
          const shift: Shift = { ...draft, id: newShiftId(), storeId: DEMO_STORE_ID };
          set({ shifts: [...get().shifts, shift] });
          return { ok: true, shift };
        },

        updateShift: (shiftId, draft) => {
          const existing = get().shifts.find((s) => s.id === shiftId);
          if (!existing) return { ok: false, errors: { form: 'This shift no longer exists.' } };
          const errors = validateShift(draft, context(shiftId));
          if (hasErrors(errors)) return { ok: false, errors };
          const shift: Shift = { ...existing, ...draft };
          set({ shifts: get().shifts.map((s) => (s.id === shiftId ? shift : s)) });
          return { ok: true, shift };
        },

        removeShift: (shiftId) => set({ shifts: get().shifts.filter((s) => s.id !== shiftId) }),

        resetDemoData: () => set({ shifts: createMockShifts() }),
      };
    },
    {
      name: ROSTER_STORAGE_KEY,
      version: ROSTER_STORAGE_VERSION,
      migrate: (persisted, fromVersion) => (fromVersion < ROSTER_STORAGE_VERSION ? {} : persisted) as never,
      storage: persistStorage,
      // Employees are reference data, so only shifts are saved.
      partialize: (state) => ({ shifts: state.shifts }),
      merge: (persisted, current) => {
        const saved = (persisted as { shifts?: unknown } | undefined)?.shifts;
        return Array.isArray(saved) ? { ...current, shifts: saved.filter(isPersistedShift) } : current;
      },
    },
  ),
);

export const selectActiveEmployees = (state: RosterState) => state.employees;
