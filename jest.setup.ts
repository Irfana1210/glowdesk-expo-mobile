// Roster maths depends on local time and daylight saving. Pin the store's timezone so
// tests behave the same on every machine and in CI.
import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";

process.env.TZ = "Australia/Melbourne";

jest.mock("react-native-safe-area-context", () => mockSafeAreaContext);
