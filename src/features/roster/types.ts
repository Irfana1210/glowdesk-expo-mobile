/** What the editor submits. Times are absolute ISO instants, so overnight and DST are explicit. */
export type ShiftDraft = {
  employeeId: string;
  endAt: string;
  startAt: string;
  unpaidBreakMinutes: number;
};

export type Shift = {
  /**
   * When the unpaid break is scheduled to start, if it has been planned. Optional: most shifts
   * only record the break length. Edits keep it because updates merge onto the existing shift.
   */
  breakStartAt?: string;
  id: string;
  storeId: string;
} & ShiftDraft;
