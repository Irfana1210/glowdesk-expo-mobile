/** Employees API. Calls the in-app mock server today; a real backend plugs in here. */
import { MockServer } from "@/services/mock-api/mock-server";

import { type Employee } from "../types";

export namespace EmployeesService {
  export function fetchEmployees(): Promise<Array<Employee>> {
    return MockServer.getEmployees();
  }
}
