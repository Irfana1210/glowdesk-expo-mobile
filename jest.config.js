module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  // The first screen render in a suite can pass 5s on a cold transform cache (always the case in CI).
  testTimeout: 15000,
  testMatch: ["<rootDir>/src/**/__tests__/**/*.spec.ts?(x)"],
  moduleNameMapper: {
    "^@test/(.*)$": "<rootDir>/test/utils/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
