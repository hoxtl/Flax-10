/*
 * Loads and saves academic term configuration from localStorage.
 */

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
