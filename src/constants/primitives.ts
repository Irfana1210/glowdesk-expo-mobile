export const MS_IN_SECOND = 1000;
export const MS_IN_MINUTE = MS_IN_SECOND * 60;

/** Delay the mock services add so loading states are real until Supabase lands. */
export const MOCK_LATENCY_MS = 500;

/** How long a demo sign-in stays valid before the user must sign in again. */
export const SESSION_DURATION_MS = MS_IN_MINUTE * 60 * 12;
