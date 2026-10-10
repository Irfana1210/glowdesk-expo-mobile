import { useSessionStore } from "@/features/auth/store/session.store";
import { type Session } from "@/features/auth/types";

import { DEMO_STORE_ID } from "@/mocks/store";

/** Sessions that match the two demo logins. Expiry is far in the future so tests never race it. */
export const TEST_SESSIONS: Record<"manager" | "shiftLeader", Session> = {
  manager: {
    employeeId: "emp-01",
    expiresAt: "2099-01-01T00:00:00.000Z",
    name: "Alex Morgan",
    role: "STORE_MANAGER",
    staffId: "RO1001",
    storeId: DEMO_STORE_ID,
    token: "test-token-alex",
  },
  shiftLeader: {
    employeeId: "emp-02",
    expiresAt: "2099-01-01T00:00:00.000Z",
    name: "Jordan Lee",
    role: "SHIFT_LEADER",
    staffId: "RO1002",
    storeId: DEMO_STORE_ID,
    token: "test-token-jordan",
  },
};

export function signInAs(kind: keyof typeof TEST_SESSIONS): Session {
  const session = TEST_SESSIONS[kind];
  useSessionStore.setState({ session, status: "signedIn" });
  return session;
}

export function signOutForTest(): void {
  useSessionStore.setState({ session: null, status: "signedOut" });
}
