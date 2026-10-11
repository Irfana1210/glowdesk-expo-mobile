/**
 * Staff at Glowdesk Melbourne Central, from the Roster mockup. Alex Morgan is the demo user
 * (Store Manager). Two extra records must never be rostered: one inactive, one at another store.
 */
import { type Employee } from "@/features/employees/types";

import { DEMO_STORE_ID } from "./store";

export const MOCK_EMPLOYEES: Array<Employee> = [
  {
    id: "emp-01",
    staffId: "RO1001",
    storeId: DEMO_STORE_ID,
    name: "Alex Morgan",
    role: "STORE_MANAGER",
    employmentType: "FULL_TIME",
    active: true,
  },
  {
    id: "emp-02",
    staffId: "RO1002",
    storeId: DEMO_STORE_ID,
    name: "Jordan Lee",
    role: "SHIFT_LEADER",
    employmentType: "FULL_TIME",
    active: true,
  },
  {
    id: "emp-03",
    staffId: "RO1003",
    storeId: DEMO_STORE_ID,
    name: "Grace Liu",
    role: "BEAUTY_ADVISOR",
    employmentType: "CASUAL",
    active: true,
  },
  {
    id: "emp-04",
    staffId: "RO1004",
    storeId: DEMO_STORE_ID,
    name: "Leo Martin",
    role: "BEAUTY_ADVISOR",
    employmentType: "CASUAL",
    active: true,
  },
  {
    id: "emp-05",
    staffId: "RO1005",
    storeId: DEMO_STORE_ID,
    name: "Aisha Rahman",
    role: "BEAUTY_ADVISOR",
    employmentType: "PART_TIME",
    active: true,
  },
  {
    id: "emp-06",
    staffId: "RO1006",
    storeId: DEMO_STORE_ID,
    name: "Tom Becker",
    role: "STOCK_ASSOCIATE",
    employmentType: "PART_TIME",
    active: true,
  },
  // Resigned: kept for history, must not be rostered.
  {
    id: "emp-07",
    staffId: "RO1007",
    storeId: DEMO_STORE_ID,
    name: "Sam Okafor",
    role: "BEAUTY_ADVISOR",
    employmentType: "CASUAL",
    active: false,
  },
  // Works at another store: must not be rostered here.
  {
    id: "emp-08",
    staffId: "RO1008",
    storeId: "store-chadstone",
    name: "Mei Tanaka",
    role: "BEAUTY_ADVISOR",
    employmentType: "PART_TIME",
    active: true,
  },
];
