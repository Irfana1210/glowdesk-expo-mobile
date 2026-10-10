import { type EmployeeRole } from "@/features/employees/types";

/** A signed-in user. Issued by the auth service and persisted on the device. */
export type Session = {
  employeeId: string;
  /** ISO timestamp after which the session is no longer valid. */
  expiresAt: string;
  name: string;
  role: EmployeeRole;
  staffId: string;
  storeId: string;
  token: string;
};

export type SignInInput = {
  pin: string;
  staffId: string;
};

export type SessionStatus = "loading" | "signedIn" | "signedOut";
