/*
 * Shared helpers for normalising and grouping module codes.
 */

export function normalizeModuleCode(value) {
  return String(value || "").trim().toUpperCase();
}

export function getModuleCodePrefix(code = "") {
  return code.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || "Other";
}
