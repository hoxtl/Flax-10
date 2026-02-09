export function buildWeekLabels(totalWeeks, hasReadingWeek, readingWeekAfterWeek) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => String(i + 1));
  if (!hasReadingWeek) return weeks;
  const idx = readingWeekAfterWeek;
  return [...weeks.slice(0, idx), "RW", ...weeks.slice(idx)];
}

export function getWeekIndexForDate(date, cfg) {
  const diffDays = daysBetween(cfg.startDate, date);
  if (diffDays < 0) return -1;

  const rawIdx = Math.floor(diffDays / 7);
  const maxIdx = cfg.totalWeeks + (cfg.hasReadingWeek ? 1 : 0) - 1;
  return Math.min(rawIdx, maxIdx);
}

function daysBetween(d1, d2) {
  const start = new Date(d1).setHours(0, 0, 0, 0);
  const end = new Date(d2).setHours(0, 0, 0, 0);
  return (end - start) / (24 * 60 * 60 * 1000);
}
