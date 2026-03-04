/**
 * Garden / level-up and sapling celebration helpers.
 */

export function getLevelUpThresholdCrossed(prevSeeds, currentSeeds) {
  if (prevSeeds == null || currentSeeds == null) return null;
  const thresholds = [10, 25, 50, 100, 250, 500];
  const crossed = thresholds.find((t) => prevSeeds < t && currentSeeds >= t);
  return crossed ?? null;
}

export function getLevelUpMessageForThreshold(threshold) {
  return `Level up! ${threshold} seeds earned.`;
}

export function getSaplingCelebrationCrossed(prevSeeds, currentSeeds) {
  if (prevSeeds == null || currentSeeds == null) return false;
  return prevSeeds < 1 && currentSeeds >= 1;
}

export function getSaplingCelebrationMessage() {
  return "Your first seed! Your sapling is growing.";
}
