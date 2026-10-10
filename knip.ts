import { type KnipConfig } from "knip";

const config: KnipConfig = {
  $schema: "https://unpkg.com/knip@5/schema.json",
  entry: ["src/app/**/*.tsx", "src/**/__tests__/**/*.spec.ts?(x)"],
  project: ["src/**/*.{ts,tsx}", "test/**/*.{ts,tsx}"],
  ignore: ["scripts/**"],
  ignoreDependencies: [
    // Loaded by eslint.config.js by package name.
    "eslint-plugin-custom-eslint-plugins",
    // Required by react-native-reanimated 4's Babel plugin; never imported directly.
    "react-native-worklets",
    // Inferred by knip's Expo plugin from app.json; not installed. Revisit with EAS Build.
    "expo-updates",
    "expo-system-ui",
  ],
};

export default config;
