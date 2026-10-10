/** Employee reference data (brief §11 `employees` table). Shared by roster, labour and the planned Employees screen. */
type EmployeeRole =
  | "STORE_MANAGER"
  | "ASSISTANT_MANAGER"
  | "SHIFT_RUNNER"
  | "BEAUTY_ADVISOR"
  | "CASHIER"
  | "STOCK_ASSOCIATE";

type EmploymentType = "FULL_TIME" | "PART_TIME" | "CASUAL";

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  STORE_MANAGER: "Store Manager",
  ASSISTANT_MANAGER: "Assistant Manager",
  SHIFT_RUNNER: "Shift Runner",
  BEAUTY_ADVISOR: "Beauty Advisor",
  CASHIER: "Cashier",
  STOCK_ASSOCIATE: "Stock Associate",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CASUAL: "Casual",
};

export type Employee = {
  /** Inactive employees (for example, resigned) cannot be rostered. */
  active: boolean;
  employmentType: EmploymentType;
  id: string;
  name: string;
  role: EmployeeRole;
  storeId: string;
};
