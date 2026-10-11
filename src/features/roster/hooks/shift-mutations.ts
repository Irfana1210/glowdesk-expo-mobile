/**
 * How roster changes reach the server. Registered once on the QueryClient by mutation key, so a
 * change made offline can be resumed after the app restarts. Changes are shown straight away and
 * sent one at a time, in order. Temporary failures are retried before rolling back.
 */
import { type QueryClient } from "@tanstack/react-query";

import { handleError } from "@/utils/handle-api-error";
import { MutationRetryUtils } from "@/utils/mutation-retry-utils";

import { SHIFT_MUTATION_KEY, SHIFTS_CACHE_KEY } from "@/services/cache-keys";

import { RosterService } from "../services/roster.service";
import { type Shift, type ShiftDraft } from "../types";

export type CreateShiftVariables = { shift: Shift };
export type UpdateShiftVariables = {
  draft: ShiftDraft;
  shiftId: string;
  storeId: string;
};
export type DeleteShiftVariables = { shiftId: string; storeId: string };

export namespace ShiftMutations {
  export const CREATE_KEY = [SHIFT_MUTATION_KEY, "create"];
  export const UPDATE_KEY = [SHIFT_MUTATION_KEY, "update"];
  export const DELETE_KEY = [SHIFT_MUTATION_KEY, "delete"];

  export function shiftsQueryKey(storeId: string) {
    return [SHIFTS_CACHE_KEY, storeId];
  }

  export function register(client: QueryClient): void {
    const refetchWhenIdle = async (storeId: string) => {
      if (client.isMutating({ mutationKey: [SHIFT_MUTATION_KEY] }) <= 1) {
        await client.invalidateQueries({ queryKey: shiftsQueryKey(storeId) });
      }
    };
    const onError = async (error: Error, storeId: string) => {
      handleError(error);
      // Reload even if no screen is showing the roster, so the rejected change is undone.
      await client.invalidateQueries({
        queryKey: shiftsQueryKey(storeId),
        refetchType: "all",
      });
    };
    const scope = { id: SHIFT_MUTATION_KEY };
    const { retry, retryDelay } = MutationRetryUtils.queued;

    client.setMutationDefaults<Shift, Error, CreateShiftVariables>(CREATE_KEY, {
      mutationFn: ({ shift }) => RosterService.createShift(shift),
      onError: (error, v) => onError(error, v.shift.storeId),
      onSettled: (_s, _e, v) => refetchWhenIdle(v.shift.storeId),
      retry,
      retryDelay,
      scope,
    });
    client.setMutationDefaults<Shift, Error, UpdateShiftVariables>(UPDATE_KEY, {
      mutationFn: ({ draft, shiftId }) =>
        RosterService.updateShift({ draft, shiftId }),
      onError: (error, v) => onError(error, v.storeId),
      onSettled: (_s, _e, v) => refetchWhenIdle(v.storeId),
      retry,
      retryDelay,
      scope,
    });
    client.setMutationDefaults<void, Error, DeleteShiftVariables>(DELETE_KEY, {
      mutationFn: ({ shiftId }) => RosterService.deleteShift(shiftId),
      onError: (error, v) => onError(error, v.storeId),
      onSettled: (_s, _e, v) => refetchWhenIdle(v.storeId),
      retry,
      retryDelay,
      scope,
    });
  }
}
