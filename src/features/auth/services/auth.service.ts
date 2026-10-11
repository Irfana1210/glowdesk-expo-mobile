import { SESSION_DURATION_MS } from "@/constants/primitives";

import { MockServer } from "@/services/mock-api/mock-server";

import { AuthUtils } from "@/features/auth/domain/auth";

import { MOCK_CREDENTIALS } from "@/mocks/auth";
import { MOCK_EMPLOYEES } from "@/mocks/employees";
import { ApiError } from "@/types/api-error";

import { type Session, type SignInInput } from "../types";

/**
 * Mock auth API. Validates demo credentials and issues a session the way a backend would.
 * A real backend plugs in here; the screen and store do not change.
 */
export namespace AuthService {
  export function signIn(
    input: SignInInput,
    now: Date = new Date(),
  ): Promise<Session> {
    return MockServer.respond(() => issueSession(input, now));
  }

  function issueSession(input: SignInInput, now: Date): Session {
    const staffId = AuthUtils.normaliseStaffId(input.staffId);
    const credential = MOCK_CREDENTIALS.find(
      (c) => c.staffId === staffId && c.pin === input.pin,
    );
    const employee = credential
      ? MOCK_EMPLOYEES.find((e) => e.id === credential.employeeId)
      : undefined;
    if (!credential || !employee) {
      throw new ApiError(
        "INVALID_CREDENTIALS",
        "Staff ID or PIN is incorrect.",
        401,
      );
    }
    if (!employee.active) {
      throw new ApiError("ACCOUNT_INACTIVE", "This account is inactive.", 403);
    }
    return {
      employeeId: employee.id,
      expiresAt: new Date(now.getTime() + SESSION_DURATION_MS).toISOString(),
      name: employee.name,
      role: employee.role,
      staffId,
      storeId: employee.storeId,
      token: `demo-${employee.id}-${now.getTime().toString(36)}`,
    };
  }

  /** Invalidates the session server-side. The mock has nothing to revoke. */
  export function signOut(): Promise<void> {
    return MockServer.respond(() => undefined);
  }
}
