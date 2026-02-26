/**
 * Garden evolution stages by seeds grown today.
 * Used for Now banner and any Garden Status display.
 */
const STAGES = [
  { min: 0, max: 5, icon: "🌱", status: "Just Rooting", nextLabel: "Sapling" },
  { min: 6, max: 15, icon: "🌿", status: "Branching Out", nextLabel: "Tree" },
  { min: 16, max: 30, icon: "🌳", status: "Academic Forest", nextLabel: "Garden Master" },
  { min: 31, max: Infinity, icon: "🌲✨", status: "Garden Master", nextLabel: null },
];

const THRESHOLDS = [6, 16, 31];
const SAPLING_CELEBRATION_THRESHOLD = 10;
const LEVEL_UP_MESSAGES = {
  6: "Hooray! Your garden evolved into a Sapling! 🌿",
  16: "Hooray! Your garden evolved into a Tree! 🌳",
  31: "Hooray! You're a Garden Master! 🌲✨",
};

export function getSaplingCelebrationCrossed(prevCount, newCount) {
  return prevCount < SAPLING_CELEBRATION_THRESHOLD && newCount >= SAPLING_CELEBRATION_THRESHOLD;
}

export function getSaplingCelebrationMessage() {
  return "Hooray! Your garden evolved into a Sapling! 🌿";
}

export function getGardenStatus(seedsCount) {
  const n = Math.max(0, Number(seedsCount) || 0);
  const stage = STAGES.find((s) => n >= s.min && n <= s.max) || STAGES[0];
  const nextStage = STAGES[STAGES.indexOf(stage) + 1];
  const seedsToNext = nextStage
    ? Math.max(0, nextStage.min - n)
    : 0;
  const isMaxLevel = !nextStage;
  return {
    icon: stage.icon,
    status: stage.status,
    seedsToNextStage: seedsToNext,
    isMaxLevel,
    tooltip: isMaxLevel
      ? "You've reached the highest stage!"
      : `You need ${seedsToNext} more seed${seedsToNext === 1 ? "" : "s"} to reach the next stage!`,
  };
}

export function getLevelUpMessageForThreshold(threshold) {
  return LEVEL_UP_MESSAGES[threshold] || null;
}

export function getLevelUpThresholdCrossed(prevCount, newCount) {
  for (const t of THRESHOLDS) {
    if (prevCount < t && newCount >= t) return t;
  }
  return null;
}
