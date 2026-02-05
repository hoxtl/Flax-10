// src/lib/termConfig.js
// Stores per-user term settings.
// For now: localStorage.
// when auth exists: replace load/save with backend API calls.
import { DEFAULT_TERM_CONFIG } from "./termDefaults";

const KEY = "studyflax_term_config";

export function loadTermConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_TERM_CONFIG, ...JSON.parse(raw) } : DEFAULT_TERM_CONFIG;
  } catch {
    return DEFAULT_TERM_CONFIG;
  }
}

export function saveTermConfig(cfg) {
  localStorage.setItem(KEY, JSON.stringify({ ...DEFAULT_TERM_CONFIG, ...cfg }));
}

/*
NEXT (when login exists):
- loadTermConfig() should fetch from API using the logged-in user id/token.
- saveTermConfig() should POST/PUT to API.
- Keep the same config shape so frontend components do not change.
*/
