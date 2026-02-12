export function countByType(items = []) {
  const counts = { all: items.length };

  for (const it of items) {
    if (it.isRatified === true) counts.ratified = (counts.ratified || 0) + 1;
    if (it.isRatified === false) counts.unratified = (counts.unratified || 0) + 1;

    const tagName = it.tag_name?.toLowerCase();
    if (tagName) counts[tagName] = (counts[tagName] || 0) + 1;
  }
  return counts;
}
