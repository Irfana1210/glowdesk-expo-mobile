/**
 * Demo session. There is no authentication in the MVP (brief §5), so the role is a clearly
 * labelled demo setting. In production the role comes from Supabase Auth claims and pay data
 * is protected by Row Level Security, not by hiding it in the UI.
 */
import { create } from "zustand";

export type DemoRole = "MANAGER" | "TEAM_MEMBER";

type SessionState = {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
};

export const useSessionStore = create<SessionState>()((set) => ({
  role: "MANAGER",
  setRole: (role) => set({ role }),
}));

export const canViewPayInformation = (role: DemoRole) => role === "MANAGER";
