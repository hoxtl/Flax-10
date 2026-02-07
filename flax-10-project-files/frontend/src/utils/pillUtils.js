export function countByType(items) {
  const counts = { all: items.length };
  for (const it of items) {
    const tagName = it.tag_name?.toLowerCase();
    if (tagName) counts[tagName] = (counts[tagName] || 0) + 1;
  }
  return counts;
}
