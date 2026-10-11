export const MS_IN_SECOND = 1000;
export const MS_IN_MINUTE = MS_IN_SECOND * 60;
export const MS_IN_DAY = MS_IN_MINUTE * 60 * 24;

/** Delay the mock services add so loading states are real until Supabase lands. */
export const MOCK_LATENCY_MS = 500;

/** Mock latency while the "Slow network" developer switch is on. */
export const SLOW_NETWORK_LATENCY_MS = 2500;

/** How long a demo sign-in stays valid before the user must sign in again. */
export const SESSION_DURATION_MS = MS_IN_MINUTE * 60 * 12;

/** Queued changes retry a temporary failure this many times before rolling back. */
export const QUEUED_CHANGE_RETRIES = 3;
/** First retry delay; each retry doubles it, up to `QUEUED_CHANGE_MAX_RETRY_MS`. */
export const QUEUED_CHANGE_RETRY_MS = MS_IN_SECOND / 2;
export const QUEUED_CHANGE_MAX_RETRY_MS = MS_IN_SECOND * 8;
