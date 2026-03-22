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

/** TfL line brand colours for line pills (slug-style keys). */
export const TFL_LINE_COLOURS = {
  bakerloo: "#B36305",
  central: "#E32017",
  circle: "#FFD300",
  district: "#00782A",
  "hammersmith-city": "#F3A9BB",
  jubilee: "#A0A5A9",
  metropolitan: "#9B0056",
  northern: "#000000",
  piccadilly: "#003688",
  victoria: "#0098D4",
  "waterloo-city": "#95CDBA",
  elizabeth: "#6950A1",
  dlr: "#00A4A7",
  overground: "#EE7C0E",
  tram: "#84B817",
};

/** Normalize API display name to TFL_LINE_COLOURS key (e.g. "Waterloo & City" → "waterloo-city"). */
function normalizeLineKey(lineName) {
  if (!lineName || typeof lineName !== "string") return "";
  const s = lineName
    .toLowerCase()
    .trim()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
  return s === "london-overground" ? "overground" : s;
}

export function getTflLineColor(lineName) {
  const key = normalizeLineKey(lineName);
  return TFL_LINE_COLOURS[key] || TFL_LINE_COLOURS[lineName] || "#78716c";
}

/** TfL line pill: bg + text (white or dark for light-coloured lines). */
export const TFL_LINE_PILL_COLOURS = {
  bakerloo: { bg: "#B36305", text: "#FFFFFF" },
  central: { bg: "#E32017", text: "#FFFFFF" },
  circle: { bg: "#FFD300", text: "#1A1A1A" },
  district: { bg: "#00782A", text: "#FFFFFF" },
  "hammersmith-city": { bg: "#F3A9BB", text: "#1A1A1A" },
  jubilee: { bg: "#A0A5A9", text: "#FFFFFF" },
  metropolitan: { bg: "#9B0056", text: "#FFFFFF" },
  northern: { bg: "#000000", text: "#FFFFFF" },
  piccadilly: { bg: "#003688", text: "#FFFFFF" },
  victoria: { bg: "#0098D4", text: "#FFFFFF" },
  "waterloo-city": { bg: "#95CDBA", text: "#1A1A1A" },
  elizabeth: { bg: "#6950A1", text: "#FFFFFF" },
  dlr: { bg: "#00A4A7", text: "#FFFFFF" },
  overground: { bg: "#EE7C0E", text: "#FFFFFF" },
  tram: { bg: "#84B817", text: "#FFFFFF" },
};

export function getTflLinePillStyle(lineName) {
  const key = normalizeLineKey(lineName);
  const entry = TFL_LINE_PILL_COLOURS[key] || TFL_LINE_PILL_COLOURS[lineName];
  return entry || { bg: "#78716c", text: "#FFFFFF" };
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
