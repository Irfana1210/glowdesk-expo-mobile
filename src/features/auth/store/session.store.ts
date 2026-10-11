/**
 * The signed-in session. Persisted so the app reopens signed in until the session expires.
 * Only the session itself is saved; `status` is derived when the store rehydrates.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { persistStorage, STORAGE_KEYS } from "@/utils/storage";

import { DEMO_STORE_ID } from "@/mocks/store";

import { AuthUtils } from "../domain/auth";
import { type Session, type SessionStatus } from "../types";

type States = {
  session: Session | null;
  status: SessionStatus;
};

type Actions = {
  clear: () => void;
  /** Called once persisted state is loaded; drops expired sessions. */
  finishHydration: (now?: Date) => void;
  setSession: (session: Session) => void;
};

export const SESSION_STORAGE_KEY = STORAGE_KEYS.session;

export const useSessionStore = create<States & Actions>()(
  persist(
    (set, get) => ({
      session: null,
      status: "loading",
      setSession: (session) => set({ session, status: "signedIn" }),
      clear: () => set({ session: null, status: "signedOut" }),
      finishHydration: (now = new Date()) => {
        const { session } = get();
        if (session && !AuthUtils.isExpired(session, now)) {
          set({ status: "signedIn" });
        } else {
          set({ session: null, status: "signedOut" });
        }
      },
    }),
    {
      name: SESSION_STORAGE_KEY,
      version: 2,
      storage: persistStorage,
      partialize: (s) => ({ session: s.session }),
      // v2 renamed the SHIFT_RUNNER role to SHIFT_LEADER.
      migrate: (persisted, version) => {
        const state = persisted as Pick<States, "session">;
        if (version < 2 && (state.session?.role as string) === "SHIFT_RUNNER") {
          return { session: { ...state.session, role: "SHIFT_LEADER" } };
        }
        return state;
      },
      onRehydrateStorage: () => (state) => state?.finishHydration(),
    },
  ),
);

export const selectSession = (s: States) => s.session;
export const selectSessionStatus = (s: States) => s.status;
/** Screens behind sign-in always have a session. The fallback keeps component tests simple. */
export const selectStoreId = (s: States) => s.session?.storeId ?? DEMO_STORE_ID;
export const selectIsManager = (s: States) =>
  s.session ? AuthUtils.canViewPayInformation(s.session.role) : false;
