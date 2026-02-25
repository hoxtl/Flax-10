/**
 * 21 distinct colours for focus blocks (no duplicates or near-duplicates).
 * Used in CreateListModal palette, list sidebar, and task modals.
 */
export const FOCUS_BLOCK_COLOURS = [
  "#6366f1", // Indigo
  "#059669", // Emerald
  "#dc2626", // Red
  "#ea580c", // Orange
  "#ca8a04", // Yellow/Amber
  "#65a30d", // Lime
  "#0d9488", // Teal
  "#0891b2", // Cyan
  "#2563eb", // Blue
  "#7c3aed", // Violet
  "#9333ea", // Purple
  "#c026d3", // Fuchsia
  "#db2777", // Pink
  "#e11d48", // Rose
  "#0f766e", // Dark teal
  "#1e40af", // Dark blue
  "#4f46e5", // Indigo (darker)
  "#6d28d9", // Purple (darker)
  "#be185d", // Pink (darker)
  "#b45309", // Amber (darker)
  "#475569", // Slate
];

/** Hex only, for fallback lookups by index */
export const FOCUS_BLOCK_COLOURS_HEX = FOCUS_BLOCK_COLOURS;

/** Palette entries with labels for the create modal */
export const FOCUS_BLOCK_PALETTE = FOCUS_BLOCK_COLOURS.map((hex, i) => ({
  hex,
  label: ["Indigo", "Emerald", "Red", "Orange", "Amber", "Lime", "Teal", "Cyan", "Blue", "Violet", "Purple", "Fuchsia", "Pink", "Rose", "Dark teal", "Dark blue", "Indigo dark", "Purple dark", "Pink dark", "Amber dark", "Slate"][i] || `Colour ${i + 1}`,
}));
