/** Roster API. Calls the in-app mock server today; a real backend plugs in here. */
import { MockServer } from "@/services/mock-api/mock-server";

import { type Shift, type ShiftDraft } from "../types";

export namespace RosterService {
  export function fetchShifts(storeId: string): Promise<Array<Shift>> {
    return MockServer.getShifts(storeId);
  }

  export function createShift(shift: Shift): Promise<Shift> {
    return MockServer.createShift(shift);
  }

  export function updateShift(input: {
    draft: ShiftDraft;
    shiftId: string;
  }): Promise<Shift> {
    return MockServer.updateShift(input);
  }

  export function deleteShift(shiftId: string): Promise<void> {
    return MockServer.deleteShift(shiftId);
  }
}
