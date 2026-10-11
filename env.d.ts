declare namespace NodeJS {
  // Declaration merging with Expo's ProcessEnv needs an interface.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ProcessEnv {
    /** Supabase project URL. Unused until the backend milestone. */
    EXPO_PUBLIC_API_URL?: string;
    /** development | preview | production, set per EAS build profile. */
    EXPO_PUBLIC_ENV?: string;
  }
}
