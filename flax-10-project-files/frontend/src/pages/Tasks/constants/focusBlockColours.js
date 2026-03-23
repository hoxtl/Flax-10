/*
 * Muted list colours for a softer task-page palette.
 * Used in CreateListModal palette, list sidebar, and task modals.
 * 21 colours = 3 rows × 7 for a full grid.
 */

import focusBlockColourValues from './focusBlockColourValues.json';

const FOCUS_BLOCK_COLOURS = focusBlockColourValues;

/* Hex only, for fallback lookups by index. */
export const FOCUS_BLOCK_COLOURS_HEX = FOCUS_BLOCK_COLOURS;

/* Palette entries with labels for the create modal. */
export const FOCUS_BLOCK_PALETTE = FOCUS_BLOCK_COLOURS.map((hex, i) => ({
  hex,
  label: `Colour ${i + 1}`,
}));
