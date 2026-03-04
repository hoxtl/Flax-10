/**
 * KCL campus / location → TFL lines likely needed for commute.
 * Used to cross-reference next event location with TFL disruptions for smart travel alerts.
 */

/** Location string (normalized) → TFL line names (as returned by TFL API, e.g. "Northern", "Jubilee") */
const LOCATION_TO_LINES = {
  strand: ["Northern", "District", "Circle", "Central", "Bakerloo"],
  "kcl strand": ["Northern", "District", "Circle", "Central", "Bakerloo"],
  "strand campus": ["Northern", "District", "Circle", "Central", "Bakerloo"],
  waterloo: ["Northern", "Jubilee", "Bakerloo", "Waterloo & City"],
  "kcl waterloo": ["Northern", "Jubilee", "Bakerloo", "Waterloo & City"],
  "waterloo campus": ["Northern", "Jubilee", "Bakerloo", "Waterloo & City"],
  guys: ["Northern", "London Overground"],
  "guy's": ["Northern", "London Overground"],
  "guys campus": ["Northern", "London Overground"],
  "guy's campus": ["Northern", "London Overground"],
  "guy's hospital": ["Northern", "London Overground"],
  "denmark hill": ["London Overground", "Thameslink"],
  "denmark hill campus": ["London Overground", "Thameslink"],
  "st thomas": ["Northern", "Jubilee", "Bakerloo", "Waterloo & City"],
  "st thomas'": ["Northern", "Jubilee", "Bakerloo", "Waterloo & City"],
  temple: ["District", "Circle"],
  "aldwych": ["Central"], // closed but keep for future
  bank: ["Northern", "Central", "Waterloo & City", "District", "Circle"],
  "london bridge": ["Northern", "Jubilee"],
  "charing cross": ["Northern", "Bakerloo"],
  "elephant & castle": ["Northern", "Bakerloo"],
  "borough": ["Northern"],
  "canary wharf": ["Jubilee", "Elizabeth"],
};

/** Normalize location for lookup: lowercase, trim, collapse spaces */
function normalizeLocation(loc) {
  if (!loc || typeof loc !== "string") return "";
  return loc
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/’/g, "'");
}

/**
 * Get TFL line names that are typically needed to reach this location.
 * @param {string} location - Event location string (e.g. "Strand Campus", "Guy's")
 * @returns {string[]} Line names that might be used for this commute
 */
export function getTflLinesForLocation(location) {
  const norm = normalizeLocation(location);
  if (!norm) return [];

  const lines = new Set();
  for (const [key, lineList] of Object.entries(LOCATION_TO_LINES)) {
    if (norm.includes(key) || key.includes(norm)) {
      lineList.forEach((l) => lines.add(l));
    }
  }
  return [...lines];
}

/**
 * Filter TFL delays to those relevant to the given event (by location).
 * @param {object} nextEvent - { location?, title?, start_time? }
 * @param {Array} delays - From tflService.getTfLDelays() { lineName, severityDescription, severity, ... }
 * @returns {Array} Delays that affect lines needed for this event
 */
export function getRelevantDelays(nextEvent, delays) {
  if (!delays?.length || !nextEvent) return [];
  const locationLines = getTflLinesForLocation(nextEvent.location || "");
  const titleLines = getTflLinesForLocation(nextEvent.title || ""); // e.g. "Lecture at Strand"
  const relevantLineNames = new Set([...locationLines, ...titleLines]);
  if (relevantLineNames.size === 0) return [];
  return delays.filter((d) => relevantLineNames.has(d.lineName));
}

/** TFL line display name → hex color (official TFL). */
export const TFL_LINE_COLORS = {
  Northern: "#000000",
  Victoria: "#0098D4",
  Central: "#E32017",
  Jubilee: "#A0A5A9",
  Bakerloo: "#B36305",
  Piccadilly: "#003688",
  District: "#00782A",
  Circle: "#FFD300",
  "Hammersmith & City": "#F3A9BB",
  Metropolitan: "#9B0056",
  "Waterloo & City": "#95CDBA",
  Elizabeth: "#6950A1",
  "London Overground": "#EE7C0E",
  DLR: "#00A4A7",
  Tram: "#84B817",
};

export function getTflLineColor(lineName) {
  return TFL_LINE_COLORS[lineName] || "#78716c";
}

/** Severity: 1–4 = severe (suspension, part closure etc), 5–9 = minor delays */
export function isSevereDisruption(severityDescription) {
  if (!severityDescription) return false;
  const s = severityDescription.toLowerCase();
  return (
    s.includes("suspension") ||
    s.includes("part closure") ||
    s.includes("closure") ||
    s.includes("severe") ||
    s.includes("part suspended")
  );
}
