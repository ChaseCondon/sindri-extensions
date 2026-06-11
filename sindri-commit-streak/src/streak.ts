/**
 * Compute the current consecutive-day commit streak from an array of ISO date
 * strings (YYYY-MM-DD). Accepts an optional `today` date for deterministic
 * testing — defaults to the current date.
 */
export function computeStreak(dates: string[], today = new Date()): number {
  const set = new Set(dates);
  let streak = 0;
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
