/**
 * Zen Progress / Gamification Vault: XP and Level logic for Focus Power.
 * 1 seed (completed non-routine task) = 50 XP. Levels every 500 XP.
 * Used for Level Badge, progress ring, and Points-over-time display.
 */

export const XP_PER_SEED = 50;

/** Level thresholds in total XP. Level N = XP in [LEVEL_XP[n-1], LEVEL_XP[n]). */
export const LEVEL_XP = [0, 500, 1000, 1500, 2000, Infinity];

export const LEVEL_TITLES = {
  1: "Focus Novice",
  2: "Focus Builder",
  3: "Focus Grower",
  4: "Focus Master",
  5: "Focus Legend",
};

const PILLAR_ICON = "✦"; // Pillar of Light / star

/**
 * @param {number} totalSeedsGrown - Total seeds over last 35 days (or all-time)
 * @returns {{ totalXP: number, level: number, title: string, xpInLevel: number, xpToNextLevel: number, isMaxLevel: boolean }}
 */
export function getZenLevel(totalSeedsGrown) {
  const totalXP = Math.max(0, (totalSeedsGrown || 0) * XP_PER_SEED);
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length - 1; i++) {
    if (totalXP >= LEVEL_XP[i]) level = i + 1;
  }
  const isMaxLevel = level >= 5;
  const levelStartXP = LEVEL_XP[level - 1];
  const levelEndXP = LEVEL_XP[level];
  const xpInLevel = totalXP - levelStartXP;
  const xpToNextLevel = isMaxLevel ? 0 : levelEndXP - totalXP;
  const title = LEVEL_TITLES[level] || LEVEL_TITLES[1];
  return {
    totalXP,
    level,
    title,
    xpInLevel,
    xpToNextLevel,
    levelStartXP,
    levelEndXP,
    isMaxLevel,
    pillarIcon: PILLAR_ICON,
  };
}

/** Progress within current level (0–1) for ring fill. */
export function getZenLevelProgress(totalSeedsGrown) {
  const z = getZenLevel(totalSeedsGrown);
  if (z.isMaxLevel) return 1;
  const span = z.levelEndXP - z.levelStartXP;
  return span > 0 ? z.xpInLevel / span : 0;
}
