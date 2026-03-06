const DEFAULT_ESTIMATED_MINUTES = 25;
const MIN_ESTIMATED_MINUTES = 5;
const MAX_ESTIMATED_MINUTES = 600;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeEstimatedMinutes(value, fallback = DEFAULT_ESTIMATED_MINUTES) {
  const n = toNumber(value);
  if (n == null || n <= 0) return fallback;
  const clamped = Math.max(MIN_ESTIMATED_MINUTES, Math.min(MAX_ESTIMATED_MINUTES, n));
  return Math.round(clamped / 5) * 5;
}

export function getEstimatedMinutes(taskOrMinutes) {
  if (typeof taskOrMinutes === "number" || typeof taskOrMinutes === "string") {
    return normalizeEstimatedMinutes(taskOrMinutes);
  }
  const task = taskOrMinutes || {};
  if (task.estimated_minutes != null) {
    return normalizeEstimatedMinutes(task.estimated_minutes);
  }
  const blocks = toNumber(task.estimated_blocks);
  if (blocks != null && blocks > 0) {
    return normalizeEstimatedMinutes(blocks * 25);
  }
  return DEFAULT_ESTIMATED_MINUTES;
}

export function deriveEstimatedBlocksFromMinutes(minutes) {
  const normalized = normalizeEstimatedMinutes(minutes);
  return Math.max(1, Math.ceil(normalized / 25));
}

export function splitEstimatedMinutes(minutes) {
  const totalMinutes = normalizeEstimatedMinutes(minutes);
  if (totalMinutes % 25 === 0) {
    return {
      sessionCount: Math.max(1, totalMinutes / 25),
      workMinutes: 25,
      totalMinutes,
    };
  }
  return {
    sessionCount: 1,
    workMinutes: totalMinutes,
    totalMinutes,
  };
}

export function formatEstimatedTime(minutes) {
  const split = splitEstimatedMinutes(minutes);
  return `${split.sessionCount} session${split.sessionCount === 1 ? "" : "s"} · ${split.totalMinutes}m`;
}

