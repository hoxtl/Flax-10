// Pure helpers for WeekBar. No React, no storage.

// Builds an array of week labels, inserting "RW" after the specified week if needed.
export function buildWeekLabels(totalWeeks, hasReadingWeek, readingWeekAfterWeek) {
  const labels = [];
  for (let w = 1; w <= totalWeeks; w++) {
    labels.push(String(w));
    if (hasReadingWeek && w === readingWeekAfterWeek) labels.push("RW");
  }
  return labels;
}

// Given a date and term config, returns the corresponding week index (0-based) or -1 if before term start.
export function getWeekIndexForDate(date, cfg) {
  const start = new Date(cfg.startDate);
  start.setHours(0, 0, 0, 0);

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const diffMs = d - start;
  if (diffMs < 0) return -1;

  const rawWeek = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  const labels = buildWeekLabels(cfg.totalWeeks, cfg.hasReadingWeek, cfg.readingWeekAfterWeek);

  let idx = rawWeek - 1;
  if (cfg.hasReadingWeek && rawWeek > cfg.readingWeekAfterWeek) idx += 1;
  if (idx >= labels.length) idx = labels.length - 1;

  return idx;
}

/*
NEXT:
- If you want reading week by exact date range instead of "after week X",
  store rwStartDate + rwEndDate and update this function.
*/
