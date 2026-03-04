/**
 * Vibrant, classy list colours.
 * Used in CreateListModal palette, list sidebar, and task modals.
 */
export const FOCUS_BLOCK_COLOURS = [
  "#4a3728",
  "#6b5344",
  "#b8860b",
  "#d4a017",
  "#a0522d",
  "#2e8b7a",
  "#3a9d5e",
  "#2f7ab7",
  "#6c5ce7",
  "#d63031",
  "#7fbc8c",
  "#5b9bd5",
  "#9b6dcc",
  "#e8a838",
  "#e07575",
];

/** Hex only, for fallback lookups by index */
export const FOCUS_BLOCK_COLOURS_HEX = FOCUS_BLOCK_COLOURS;

/** Palette entries with labels for the create modal */
export const FOCUS_BLOCK_PALETTE = FOCUS_BLOCK_COLOURS.map((hex, i) => ({
  hex,
  label: `Colour ${i + 1}`,
}));
