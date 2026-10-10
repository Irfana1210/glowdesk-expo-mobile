// See docs/coding-standards.md for the standards these rules enforce.
const { defineConfig, globalIgnores } = require("eslint/config");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const eslintPluginImport = require("eslint-plugin-import");
const perfectionist = require("eslint-plugin-perfectionist");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const prettier = require("eslint-plugin-prettier");
const react = require("eslint-plugin-react");
const unusedImports = require("eslint-plugin-unused-imports");
const testingLibrary = require("eslint-plugin-testing-library");
const customEslintPlugins = require("eslint-plugin-custom-eslint-plugins");
const { fixupPluginRules } = require("@eslint/compat");
const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");
const expoConfig = require("eslint-config-expo/flat");

const compat = new FlatCompat({
  // eslint-disable-next-line no-undef
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  expoConfig,
  {
    plugins: {
      "eslint-plugin-import": fixupPluginRules(eslintPluginImport),
      prettier,
      "custom-eslint-plugins": customEslintPlugins,
    },
    rules: {
      "custom-eslint-plugins/inline-if-to-scoped": "error",
      "comma-dangle": [2, "only-multiline"],
      "no-multiple-empty-lines": "error",
      quotes: [2, "double", { avoidEscape: true }],
      "comma-spacing": ["error", { before: false, after: true }],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
      perfectionist,
      "simple-import-sort": simpleImportSort,
      react,
      "unused-imports": unusedImports,
      "testing-library": testingLibrary,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "no-restricted-exports": [
        "error",
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
      "custom-eslint-plugins/no-object-exports": "error",
      "require-await": "off",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/require-await": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-deprecated": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["default"],
              message: "Do not import React, use import deconstruction instead",
            },
          ],
        },
      ],
      "no-warning-comments": "warn",
      "eslint-plugin-import/consistent-type-specifier-style": [
        "error",
        "prefer-inline",
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "warn",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "simple-import-sort/exports": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^(react/(.*)$)|^(react$)|^(react-native(.*)$)|^(react-.*)"],
            ["<THIRD_PARTY_MODULES>"],
            [""],
            ["^@/constants/(.*)$"],
            ["^@/utils/(.*)$"],
            ["^@/services/(.*)$"],
            ["^@/hooks/(.*)$"],
            ["^@/features/(.*)$"],
            ["^@/components/(.*)$"],
            ["^@/(.*)$"],
            ["^@test/(.*)$"],
            ["^[./]"],
          ],
        },
      ],
      "perfectionist/sort-object-types": [
        "error",
        { type: "alphabetical", order: "asc" },
      ],
      "react/jsx-sort-props": [
        "error",
        { callbacksLast: true, shorthandFirst: true, ignoreCase: false },
      ],
      "react/no-children-prop": "off",
      "max-len": [
        "error",
        {
          code: 120,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
    },
  },
  {
    // expo-router discovers routes through their default export.
    files: ["src/app/**/*.tsx", "*.config.ts", "knip.ts"],
    rules: {
      "no-restricted-exports": "off",
    },
  },
  globalIgnores([
    "assets/*",
    "**/node_modules/",
    "**/__mocks__/",
    "dist/",
    ".expo/",
    "coverage/",
    // Custom rule implementations, linted separately.
    "scripts/plugins/",
  ]),
  {
    files: [
      "**/__tests__/**/*.[jt]s?(x)",
      "**/?(*.)+(spec|test).[jt]s?(x)",
      "test/**/*.[jt]s?(x)",
      "jest.setup.ts",
    ],
    extends: compat.extends("plugin:testing-library/react"),
    rules: {
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "react/display-name": "off",
      // RNTL 14 made render/fireEvent async, so awaiting them is correct.
      "testing-library/no-await-sync-events": "off",
      // `await act(async () => {...})` flushes effects even when the callback is synchronous.
      "@typescript-eslint/require-await": "off",
    },
  },
]);
