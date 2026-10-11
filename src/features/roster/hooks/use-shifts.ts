import { useSafeQuery } from "@/hooks/query/use-safe-query";

import {
  selectStoreId,
  useSessionStore,
} from "@/features/auth/store/session.store";

import { StaleTimeMs } from "@/types/enums";

import { RosterService } from "../services/roster.service";
import { ShiftMutations } from "./shift-mutations";

/** Every rostered shift for the store. Screens filter by day or week with ShiftUtils. */
export function useShifts() {
  const storeId = useSessionStore(selectStoreId);
  return useSafeQuery({
    queryKey: ShiftMutations.shiftsQueryKey(storeId),
    queryFn: () => RosterService.fetchShifts(storeId),
    staleTime: StaleTimeMs.Shifts,
  });
}
