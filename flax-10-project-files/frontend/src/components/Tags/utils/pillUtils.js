import { getEffectiveTagName } from "../../Calendar/utils/eventUtils";

export function countByType(items = []) {
  const counts = { all: items.length };
  for (const it of items) {
    countRatificationStatus(it, counts);
    countByTagOrSource(it, counts);
  }
  return counts;
}

function countRatificationStatus(item, counts) {
  if (item.is_ratified === true) counts.ratified = (counts.ratified || 0) + 1;
  if (item.is_ratified === false) counts.unratified = (counts.unratified || 0) + 1;
}

function countByTagOrSource(item, counts) {
  const key = getEffectiveTagName(item);
  if (key) counts[key] = (counts[key] || 0) + 1;
}
