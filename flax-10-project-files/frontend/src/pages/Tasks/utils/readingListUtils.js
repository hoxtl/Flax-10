const READING_LIST_PATTERN = /^([a-z]{2,}\d+)\s*-\s*(.+)$/i;
const LEGACY_READING_LIST_PATTERN = /^reading list\s*-\s*(.+)$/i;

export function isReadingListName(name) {
  const normalized = String(name || "").trim();
  return READING_LIST_PATTERN.test(normalized) || LEGACY_READING_LIST_PATTERN.test(normalized);
}

export function isReadingList(list) {
  return isReadingListName(list?.name);
}

export function parseReadingListName(name) {
  const normalized = String(name || "").trim();
  const readingMatch = normalized.match(READING_LIST_PATTERN);
  if (readingMatch) {
    return {
      moduleCode: readingMatch[1].toUpperCase(),
      moduleName: readingMatch[2].trim(),
      label: normalized,
    };
  }

  const legacyMatch = normalized.match(LEGACY_READING_LIST_PATTERN);
  if (legacyMatch) {
    return {
      moduleCode: "",
      moduleName: legacyMatch[1].trim(),
      label: normalized,
    };
  }

  return {
    moduleCode: "",
    moduleName: normalized,
    label: normalized,
  };
}

export function matchesReadingList(reading, list) {
  if (!isReadingList(list)) return false;
  const parsed = parseReadingListName(list?.name);
  const readingCode = String(reading?.module_code || "").trim().toUpperCase();
  const readingName = String(reading?.module_name || "").trim().toLowerCase();

  if (parsed.moduleCode && readingCode) {
    return parsed.moduleCode === readingCode;
  }

  if (parsed.moduleName && readingName) {
    return parsed.moduleName.toLowerCase() === readingName;
  }

  return false;
}
