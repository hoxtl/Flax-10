/*
 * Helpers for identifying and parsing reading-list names.
 */

const READING_LIST_PATTERN = /^([a-z]{2,}\d+)\s*-\s*(.+)$/i;
const LEGACY_READING_LIST_PATTERN = /^reading list\s*-\s*(.+)$/i;
<<<<<<< HEAD
const TEACHING_LIST_PATTERN = /^Teaching\s*-\s*/i;

export function isTeachingList(list) {
  return TEACHING_LIST_PATTERN.test(list?.name || "");
}

export function getTeachingListDisplayName(list) {
  return (list?.name || "").replace(TEACHING_LIST_PATTERN, "");
}

export function isSocietyList(list) {
  return list?.category === "society" || Boolean(list?.society_id);
}

export function getSocietyDisplayName(list) {
  const label = list?.society_name || list?.name || "Society";
  return label.replace(/\s+Admin$/i, "").trim() || "Society";
}
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export function isReadingListName(name) {
  const normalized = String(name || "").trim();
  return READING_LIST_PATTERN.test(normalized) || LEGACY_READING_LIST_PATTERN.test(normalized);
}

export function isReadingList(list) {
  return isReadingListName(list?.name);
}

function buildParsedReadingList(normalized, moduleCode, moduleName) {
  return { moduleCode, moduleName, label: normalized };
}

function parseLegacyReadingList(normalized) {
  const legacyMatch = normalized.match(LEGACY_READING_LIST_PATTERN);
  return legacyMatch ? buildParsedReadingList(normalized, "", legacyMatch[1].trim()) : null;
}

export function parseReadingListName(name) {
  const normalized = String(name || "").trim();
  const readingMatch = normalized.match(READING_LIST_PATTERN);
  if (readingMatch) return buildParsedReadingList(normalized, readingMatch[1].toUpperCase(), readingMatch[2].trim());
  return parseLegacyReadingList(normalized) || buildParsedReadingList(normalized, "", normalized);
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

export function getReadingListLabel(activeList) {
  if (!activeList) return "this reading list";
  const parsed = parseReadingListName(activeList.name);
  return [parsed.moduleCode, parsed.moduleName].filter(Boolean).join(" ") || parsed.label || "this reading list";
}
