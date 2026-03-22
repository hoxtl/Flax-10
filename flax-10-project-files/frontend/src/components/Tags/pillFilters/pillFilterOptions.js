/*
 * Helpers for tag filter dropdown data.
 */

export function getUniqueTags(tags = []) {
  return Array.from(new Map(tags.map((tag) => [tag.label.toLowerCase(), tag])).values());
}

export function createPillFilterOptions(tags, counts) {
  return [
    createAllOption(counts),
    ...getUniqueTags(tags).map((tag) => createTagOption(tag, counts)),
  ];
}

function createAllOption(counts) {
  return { value: "all", label: `All (${counts.all || 0})` };
}

function createTagOption(tag, counts) {
  const key = tag.label.toLowerCase();
  return { value: key, label: `${tag.label} (${counts[key] || 0})` };
}

export function getActiveFilterLabel(active, options) {
  return options.find((option) => option.value === active)?.label || "Filter";
}
