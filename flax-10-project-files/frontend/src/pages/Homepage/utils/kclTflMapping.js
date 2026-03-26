/**
 * KCL campus or location names mapped to the TFL lines likely needed for a commute.
 * Used to cross-reference next event location with TFL disruptions for smart travel alerts.
 */

import tflLineColors from '../../../api/tflLineColors.json';

/** Normalised location string mapped to TFL line names, as returned by the TFL API. */

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

/** Normalise a location for lookup by lowercasing, trimming, and collapsing spaces. */

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
  return Object.entries(LOCATION_TO_LINES).reduce(addMatchingLines(norm), []);
}

function addMatchingLines(norm) {
  return (lines, [key, lineList]) => {
    if (isMatchingLocation(norm, key)) return [...new Set([...lines, ...lineList])];
    return lines;
  };
}

function isMatchingLocation(norm, key) {
  return norm.includes(key) || key.includes(norm);
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

export const TFL_LINE_COLOURS = tflLineColors.lineColours;

/** Normalise an API display name to a TFL_LINE_COLOURS key, for example "Waterloo & City" to "waterloo-city". */

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
  return TFL_LINE_COLOURS[key] || TFL_LINE_COLOURS[lineName] || tflLineColors.fallbackPillColour.bg;
}

/** TfL line pill: bg + text (white or dark for light-coloured lines). */

export const TFL_LINE_PILL_COLOURS = tflLineColors.linePillColours;

export function getTflLinePillStyle(lineName) {
  const key = normalizeLineKey(lineName);
  const entry = TFL_LINE_PILL_COLOURS[key] || TFL_LINE_PILL_COLOURS[lineName];
  return entry || tflLineColors.fallbackPillColour;
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
