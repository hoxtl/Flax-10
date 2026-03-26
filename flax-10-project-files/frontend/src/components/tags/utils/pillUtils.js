/*
 * Aggregates counts for tag-based filtering.
 */

import { getEffectiveTagName } from "../../calendar/utils/eventUtils";

export function countByType(items = []) {
  const counts = { all: items.length };
  items.forEach((item) => applyItemCounts(item, counts));
  return counts;
}

function applyItemCounts(item, counts) {
  updateRatificationCount(item, counts);
  updateTagCount(item, counts);
}

function updateRatificationCount(item, counts) {
  if (item.is_ratified === true) counts.ratified = (counts.ratified || 0) + 1;
  if (item.is_ratified === false) counts.unratified = (counts.unratified || 0) + 1;
}

function updateTagCount(item, counts) {
  const key = getEffectiveTagName(item);
  if (key) counts[key] = (counts[key] || 0) + 1;
}
