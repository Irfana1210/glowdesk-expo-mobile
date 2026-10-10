import { type EmployeeRole } from "@/features/employees/types";

import { type Session } from "../types";

export namespace AuthUtils {
  export function isExpired(session: Session, now: Date): boolean {
    const expiresAt = Date.parse(session.expiresAt);
    return Number.isNaN(expiresAt) || expiresAt <= now.getTime();
  }

  /** Managers see pay information. In production the server enforces this too. */
  export function canViewPayInformation(role: EmployeeRole): boolean {
    return role === "STORE_MANAGER" || role === "ASSISTANT_MANAGER";
  }

  export function firstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0] ?? fullName;
  }

  /** "Alex Morgan" → "AM". */
  export function initials(fullName: string): string {
    return fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  /** Staff IDs are entered in any case; the record is uppercase. */
  export function normaliseStaffId(staffId: string): string {
    return staffId.trim().toUpperCase();
  }
}
