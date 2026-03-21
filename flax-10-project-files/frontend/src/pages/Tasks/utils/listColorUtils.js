/*
 * Resolve task list accent colours with local storage fallback.
 */

import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";

function getStoredListColor(list) {
  const key = list?.id && typeof window !== "undefined" ? "listColor:" + list.id : null;
  if (!key) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getListColor(list, idx = 0) {
  if (list?.color) return list.color;
  const stored = getStoredListColor(list);
  if (stored) return stored;
  return FOCUS_BLOCK_COLOURS_HEX[(idx ?? 0) % FOCUS_BLOCK_COLOURS_HEX.length];
}
