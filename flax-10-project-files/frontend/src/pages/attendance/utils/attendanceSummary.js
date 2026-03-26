/*
 * Attendance summary helpers.
 */

const emptyOverall = { attended: 0, missed: 0 };

export function getOverallStats(stats) {
  return stats?.overall ?? emptyOverall;
}

export function getByTypeStats(stats) {
  return stats?.by_type ?? {};
}

export function getTotalMarked(overall) {
  return overall.attended + overall.missed;
}

export function computeAttendancePct(overall) {
  const total = getTotalMarked(overall);
  return total > 0 ? Math.round((overall.attended / total) * 100) : 100;
}

export function buildAttendanceSummary(overall, unmarkedCount) {
  const totalMarked = getTotalMarked(overall);
  const pct = totalMarked > 0 ? computeAttendancePct(overall) : null;
  return { ...overall, pct, totalMarked, unmarkedCount };
}
