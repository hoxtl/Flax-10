/**
 * Muted, on-brand list colours.
 * Used in CreateListModal palette, list sidebar, and task modals.
 */
export const FOCUS_BLOCK_COLOURS = [
  "#4a3728",
  "#6b5f57",
  "#8a6d30",
  "#c49a4b",
  "#a89890",
  "#4a8f7a",
  "#6b8f71",
  "#5a7d9a",
  "#7c6aad",
  "#c4574b",
  "#9bb5a0",
  "#a8b4c4",
  "#b8a0c8",
  "#c4a882",
  "#d4918a",
];

/** Hex only, for fallback lookups by index */
export const FOCUS_BLOCK_COLOURS_HEX = FOCUS_BLOCK_COLOURS;

/** Palette entries with labels for the create modal */
export const FOCUS_BLOCK_PALETTE = FOCUS_BLOCK_COLOURS.map((hex, i) => ({
  hex,
  label: `Colour ${i + 1}`,
}));
