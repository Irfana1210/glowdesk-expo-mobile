import { SESSION_DURATION_MS } from "@/constants/primitives";

import { AuthService } from "@/features/auth/services/auth.service";

import { ApiError } from "@/types/api-error";

jest.mock("@/utils/mock-utils", () => ({
  MockUtils: { simulateLatency: () => Promise.resolve() },
}));

const NOW = new Date("2026-10-10T16:40:00+11:00");

describe("AuthService.signIn", () => {
  it("issues a session for valid demo credentials", async () => {
    const session = await AuthService.signIn(
      { staffId: "RO1001", pin: "1111" },
      NOW,
    );

    expect(session).toMatchObject({
      employeeId: "emp-01",
      name: "Alex Morgan",
      role: "STORE_MANAGER",
      staffId: "RO1001",
    });
    expect(Date.parse(session.expiresAt)).toBe(
      NOW.getTime() + SESSION_DURATION_MS,
    );
    expect(session.token).not.toHaveLength(0);
  });

  it("accepts a lowercase staff ID with spaces around it", async () => {
    const session = await AuthService.signIn(
      { staffId: " ro1002 ", pin: "2222" },
      NOW,
    );
    expect(session.staffId).toBe("RO1002");
    expect(session.role).toBe("SHIFT_LEADER");
  });

  it.each([
    ["RO1001", "9999"],
    ["RO9999", "1111"],
    ["", ""],
  ])("rejects %s / %s with INVALID_CREDENTIALS", async (staffId, pin) => {
    await expect(
      AuthService.signIn({ staffId, pin }, NOW),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS", status: 401 });
  });

  it("throws an ApiError, not a plain Error", async () => {
    await expect(
      AuthService.signIn({ staffId: "RO1001", pin: "0000" }, NOW),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("AuthService.signOut", () => {
  it("resolves", async () => {
    await expect(AuthService.signOut()).resolves.toBeUndefined();
  });
});
