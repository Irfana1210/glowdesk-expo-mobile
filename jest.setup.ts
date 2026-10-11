// Roster maths depends on local time and daylight saving. Pin the store's timezone so
// tests behave the same on every machine and in CI.
import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";

process.env.TZ = "Australia/Melbourne";

jest.mock("react-native-safe-area-context", () => mockSafeAreaContext);

jest.mock("@react-native-community/netinfo", () =>
  jest.requireActual("@react-native-community/netinfo/jest/netinfo-mock.js"),
);

// The mock API waits like a network round trip in the app. Tests skip the wait.
jest.mock("@/utils/mock-utils", () => ({
  MockUtils: { simulateLatency: () => Promise.resolve() },
}));
