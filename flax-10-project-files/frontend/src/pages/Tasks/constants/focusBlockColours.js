/**
 * Muted list colours for a softer task-page palette.
 * Used in CreateListModal palette, list sidebar, and task modals.
 * 21 colours = 3 rows × 7 for a full grid.
 */
const FOCUS_BLOCK_COLOURS = [
  "#6F89B8", // muted blue
  "#8B79B5", // muted violet
  "#B46F6F", // muted red
  "#6F9A79", // muted green
  "#6FA4B8", // muted sky
  "#B5799D", // muted pink
  "#BE9A68", // muted amber
  "#6FA8A0", // muted teal
  "#9A7DB8", // soft purple
  "#C08B63", // soft orange
  "#7EAD88", // soft emerald
  "#7C95C6", // dusty blue
  "#C48282", // dusty red
  "#C8AE70", // soft yellow
  "#74A894", // muted mint
  "#A186C1", // soft lavender
  "#6FAFC0", // soft cyan
  "#9DB66D", // soft lime
  "#C37B8F", // dusty rose
  "#7F86C1", // muted indigo
  "#C08AAE", // soft fuchsia
];

/** Hex only, for fallback lookups by index */
export const FOCUS_BLOCK_COLOURS_HEX = FOCUS_BLOCK_COLOURS;

/** Palette entries with labels for the create modal */
export const FOCUS_BLOCK_PALETTE = FOCUS_BLOCK_COLOURS.map((hex, i) => ({
  hex,
  label: `Colour ${i + 1}`,
}));
