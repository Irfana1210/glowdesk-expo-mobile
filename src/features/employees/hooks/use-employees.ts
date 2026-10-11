import { EMPLOYEES_CACHE_KEY } from "@/services/cache-keys";

import { useSafeQuery } from "@/hooks/query/use-safe-query";

import { StaleTimeMs } from "@/types/enums";

import { EmployeesService } from "../services/employees.service";

/** Staff records, including inactive and other-store staff, so shift rules can explain them. */
export function useEmployees() {
  return useSafeQuery({
    queryKey: [EMPLOYEES_CACHE_KEY],
    queryFn: EmployeesService.fetchEmployees,
    staleTime: StaleTimeMs.ReferenceData,
  });
}
