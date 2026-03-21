/*
 * Muted list colours for a softer task-page palette.
 * Used in CreateListModal palette, list sidebar, and task modals.
 * 21 colours = 3 rows × 7 for a full grid.
 */
const FOCUS_BLOCK_COLOURS = [
  "#6F89B8", "#8B79B5", "#B46F6F", "#6F9A79", "#6FA4B8", "#B5799D", "#BE9A68",
  "#6FA8A0", "#9A7DB8", "#C08B63", "#7EAD88", "#7C95C6", "#C48282", "#C8AE70",
  "#74A894", "#A186C1", "#6FAFC0", "#9DB66D", "#C37B8F", "#7F86C1", "#C08AAE",
];

/* Hex only, for fallback lookups by index. */
export const FOCUS_BLOCK_COLOURS_HEX = FOCUS_BLOCK_COLOURS;

/* Palette entries with labels for the create modal. */
export const FOCUS_BLOCK_PALETTE = FOCUS_BLOCK_COLOURS.map((hex, i) => ({
  hex,
  label: `Colour ${i + 1}`,
}));
