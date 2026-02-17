export function countByType(items) {
  return items.reduce((counts, it) => {
    const tag = it.tag_name?.toLowerCase();
    if (tag) counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, { all: items.length });
}