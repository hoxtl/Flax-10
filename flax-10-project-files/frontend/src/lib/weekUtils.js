// Pure helpers for WeekBar. No React, no storage.

export function buildWeekLabels(totalWeeks, hasReadingWeek, readingWeekAfterWeek) {
  const labels = [];
  for (let w = 1; w <= totalWeeks; w++) {
    labels.push(String(w));
    if (hasReadingWeek && w === readingWeekAfterWeek) labels.push("RW");
  }
  return labels;
}

export function getWeekIndexForDate(date, cfg) {
  const start = new Date(cfg.startDate);
  start.setHours(0, 0, 0, 0);

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const diffMs = d - start;
  if (diffMs < 0) return -1;

  // 1-based teaching week number
  const rawWeek = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

  const labels = buildWeekLabels(cfg.totalWeeks, cfg.hasReadingWeek, cfg.readingWeekAfterWeek);

  // If beyond last teaching week, clamp to end of labels
  if (rawWeek > cfg.totalWeeks) return labels.length - 1;

  // Convert teaching week number -> label index (account for RW slot)
  let idx = rawWeek - 1;
  if (cfg.hasReadingWeek && rawWeek > cfg.readingWeekAfterWeek) idx += 1;

  return idx;
}

/*
NEXT:
- If you want reading week by exact date range instead of "after week X",
  store rwStartDate + rwEndDate and update this function.
*/
