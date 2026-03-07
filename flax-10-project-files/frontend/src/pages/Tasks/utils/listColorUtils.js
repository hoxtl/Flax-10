/**
 * Utilities for resolving list accent colours.
 * Falls back to localStorage then a deterministic palette index.
 */

import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";

/**
 * Resolves the display colour for a task list.
 *
 * @param {object|null} list - Task list object (may have .color and .id).
 * @param {number} [idx=0] - Palette fallback index.
 * @returns {string} A CSS colour string.
 */
export function getListColor(list, idx = 0) {
  if (list?.color) return list.color;
  try {
    if (list?.id && typeof window !== "undefined") {
      const stored = localStorage.getItem("listColor:" + list.id);
      if (stored) return stored;
    }
  } catch (_) {}
  return FOCUS_BLOCK_COLOURS_HEX[(idx ?? 0) % FOCUS_BLOCK_COLOURS_HEX.length];
}
