import { useEffect, useState } from 'react';

/**
 * The current time, refreshed on an interval so time-based labels ("Overdue 53 min",
 * "3h 50m left") stay current without recalculating on every render.
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
