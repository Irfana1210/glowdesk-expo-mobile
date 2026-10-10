import Storage from "expo-sqlite/kv-store";

import {
  selectIsManager,
  SESSION_STORAGE_KEY,
  useSessionStore,
} from "@/features/auth/store/session.store";

import { signOutForTest, TEST_SESSIONS } from "@test/session-test-utils";

beforeEach(async () => {
  await Storage.removeItem(SESSION_STORAGE_KEY);
  signOutForTest();
});

describe("useSessionStore", () => {
  it("signs in, persists the session and exposes the manager flag", async () => {
    useSessionStore.getState().setSession(TEST_SESSIONS.manager);

    expect(useSessionStore.getState().status).toBe("signedIn");
    expect(selectIsManager(useSessionStore.getState())).toBe(true);

    const saved = JSON.parse(
      (await Storage.getItem(SESSION_STORAGE_KEY)) ?? "{}",
    );
    expect(saved.state.session.staffId).toBe("RO1001");
    expect(saved.state.status).toBeUndefined();
  });

  it("is not a manager for a shift leader, or when signed out", () => {
    useSessionStore.getState().setSession(TEST_SESSIONS.shiftLeader);
    expect(selectIsManager(useSessionStore.getState())).toBe(false);

    useSessionStore.getState().clear();
    expect(useSessionStore.getState()).toMatchObject({
      session: null,
      status: "signedOut",
    });
    expect(selectIsManager(useSessionStore.getState())).toBe(false);
  });

  it("migrates a saved Shift Runner session to Shift Leader", async () => {
    await Storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        state: {
          session: { ...TEST_SESSIONS.shiftLeader, role: "SHIFT_RUNNER" },
        },
        version: 1,
      }),
    );

    await useSessionStore.persist.rehydrate();

    expect(useSessionStore.getState().session?.role).toBe("SHIFT_LEADER");
  });

  it("keeps a valid session after hydration and drops an expired one", () => {
    useSessionStore.setState({
      session: TEST_SESSIONS.manager,
      status: "loading",
    });
    useSessionStore
      .getState()
      .finishHydration(new Date("2026-10-10T00:00:00Z"));
    expect(useSessionStore.getState().status).toBe("signedIn");

    useSessionStore.setState({
      session: {
        ...TEST_SESSIONS.manager,
        expiresAt: "2026-10-10T00:00:00.000Z",
      },
      status: "loading",
    });
    useSessionStore
      .getState()
      .finishHydration(new Date("2026-10-10T00:00:01Z"));
    expect(useSessionStore.getState()).toMatchObject({
      session: null,
      status: "signedOut",
    });
  });
});
