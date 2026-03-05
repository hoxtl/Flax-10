/**
 * Vibrant, classy list colours.
 * Used in CreateListModal palette, list sidebar, and task modals.
 * 21 colours = 3 rows × 7 for a full grid.
 */
export const FOCUS_BLOCK_COLOURS = [
  "#2563eb", // vivid blue
  "#7c3aed", // purple
  "#dc2626", // red
  "#16a34a", // green
  "#0ea5e9", // sky
  "#db2777", // pink
  "#f59e0b", // amber
  "#14b8a6", // teal
  "#9333ea", // violet
  "#f97316", // orange
  "#22c55e", // emerald
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#eab308", // yellow
  "#10b981", // emerald-500
  "#a855f7", // purple-500
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f43f5e", // rose
  "#6366f1", // indigo
  "#ec4899", // fuchsia
];

/** Hex only, for fallback lookups by index */
export const FOCUS_BLOCK_COLOURS_HEX = FOCUS_BLOCK_COLOURS;

/** Palette entries with labels for the create modal */
export const FOCUS_BLOCK_PALETTE = FOCUS_BLOCK_COLOURS.map((hex, i) => ({
  hex,
  label: `Colour ${i + 1}`,
}));
