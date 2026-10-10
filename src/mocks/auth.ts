/**
 * Demo sign-in credentials. Demo only: a real backend never stores PINs, let alone in
 * plaintext, and sign-in happens server-side. Both demo users are on the Roster mockup.
 */
export type MockCredential = {
  employeeId: string;
  pin: string;
  staffId: string;
};

export const MOCK_CREDENTIALS: Array<MockCredential> = [
  { staffId: "RO1001", pin: "1111", employeeId: "emp-01" },
  { staffId: "RO1002", pin: "2222", employeeId: "emp-02" },
];

/** Shown as one-tap cards on the sign-in screen. */
export const QUICK_SIGN_IN_STAFF_IDS: Array<string> = ["RO1001", "RO1002"];
