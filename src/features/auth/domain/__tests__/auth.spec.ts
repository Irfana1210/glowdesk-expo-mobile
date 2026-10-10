import { LOCALE } from "@/constants/locale";

import { AuthUtils } from "@/features/auth/domain/auth";
import { signInSchema } from "@/features/auth/domain/sign-in-form";
import { type Session } from "@/features/auth/types";

const L = LOCALE.auth.validation;

const session: Session = {
  employeeId: "emp-01",
  expiresAt: "2026-10-11T04:40:00.000Z",
  name: "Alex Morgan",
  role: "STORE_MANAGER",
  staffId: "RO1001",
  storeId: "store-melbourne-central",
  token: "t",
};

describe("AuthUtils", () => {
  it("treats a session as expired at or after its expiry, or when the expiry is unreadable", () => {
    expect(AuthUtils.isExpired(session, new Date("2026-10-11T04:39:59Z"))).toBe(
      false,
    );
    expect(AuthUtils.isExpired(session, new Date("2026-10-11T04:40:00Z"))).toBe(
      true,
    );
    expect(
      AuthUtils.isExpired({ ...session, expiresAt: "never" }, new Date()),
    ).toBe(true);
  });

  it("lets managers and assistant managers see pay information only", () => {
    expect(AuthUtils.canViewPayInformation("STORE_MANAGER")).toBe(true);
    expect(AuthUtils.canViewPayInformation("ASSISTANT_MANAGER")).toBe(true);
    expect(AuthUtils.canViewPayInformation("SHIFT_LEADER")).toBe(false);
    expect(AuthUtils.canViewPayInformation("BEAUTY_ADVISOR")).toBe(false);
  });

  it("derives first names, initials and normalised staff IDs", () => {
    expect(AuthUtils.firstName("Alex Morgan")).toBe("Alex");
    expect(AuthUtils.initials("Alex Morgan")).toBe("AM");
    expect(AuthUtils.initials("Cher")).toBe("C");
    expect(AuthUtils.normaliseStaffId("  ro1001 ")).toBe("RO1001");
  });
});

describe("signInSchema", () => {
  it("accepts a valid staff ID and PIN, uppercasing the staff ID", () => {
    const result = signInSchema.safeParse({ staffId: " ro1001 ", pin: "1111" });
    expect(result.success && result.data).toEqual({
      staffId: "RO1001",
      pin: "1111",
    });
  });

  it("reports helpful messages for a bad staff ID or PIN", () => {
    const result = signInSchema.safeParse({ staffId: "1001", pin: "11" });
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toEqual(expect.arrayContaining([L.staffId, L.pin]));
  });
});
