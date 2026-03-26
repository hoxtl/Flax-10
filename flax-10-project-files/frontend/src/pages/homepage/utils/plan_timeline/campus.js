/*
 * Campus detection and transit helpers for plan timeline rows.
 */

import { KCL_CAMPUS_KEYWORDS, TRANSIT_MINS } from "./constants";

export function getCampusKey(location) {
  const normalized = location?.toLowerCase();
  if (!normalized) return null;
  const match = Object.entries(KCL_CAMPUS_KEYWORDS).find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)));
  return match?.[0] || null;
}

export function getTransitMins(locationA, locationB) {
  const campusA = getCampusKey(locationA);
  const campusB = getCampusKey(locationB);
  if (!campusA || !campusB || campusA === campusB) return 0;
  return TRANSIT_MINS[`${campusA}-${campusB}`] || 0;
}
