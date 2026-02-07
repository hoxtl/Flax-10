export function countByType(items) {
  const counts = { all: items.length };
  for (const it of items) counts[it.type] = (counts[it.type] || 0) + 1;
  return counts;
}
