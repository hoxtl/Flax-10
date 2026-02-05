// src/lib/termConfig.js
// Stores per-user term settings.
// For now: localStorage.
// when auth exists: replace load/save with backend API calls.

const KEY = "studyflax_term_config";

export const DEFAULT_TERM_CONFIG = {
  // each school has different dates, so startDate must be user-specific maybe ask when they create a profile.
  startDate: "2026-01-13",     // YYYY-MM-DD
  totalWeeks: 11,              // teaching weeks count (not including RW slot)
  hasReadingWeek: true,
  readingWeekAfterWeek: 5,     // RW appears after week 5 (between week 5 and 6)
};

export function loadTermConfig() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_TERM_CONFIG;

  try {
    return { ...DEFAULT_TERM_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TERM_CONFIG;
  }
}

export function saveTermConfig(cfg) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

/*
NEXT (when login exists):
- loadTermConfig() should fetch from API using the logged-in user id/token.
- saveTermConfig() should POST/PUT to API.
- Keep the same config shape so frontend components do not change.
*/
