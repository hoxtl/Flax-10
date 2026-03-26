/**
 * Profile achievements catalogue modal.
 */

import { useEffect } from "react";
import styles from "./AchievementsModal.module.css";
import StandardModal from "../../components/common/standard_modal/StandardModal";
import achievementTierColors from "./achievementTierColors.json";

const ALL_BADGES = [
  // Hours
  { id: '1hr', label: 'First Hour', emoji: '⏱️', description: 'Study for 1 hour total', tier: 'bronze', category: 'Hours' },
  { id: '10hr', label: 'Getting Started', emoji: '📖', description: 'Study for 10 hours total', tier: 'bronze', category: 'Hours' },
  { id: '50hr', label: 'Dedicated', emoji: '🔥', description: 'Study for 50 hours total', tier: 'silver', category: 'Hours' },
  { id: '100hr', label: 'Century', emoji: '💯', description: '100 hours of focused study', tier: 'gold', category: 'Hours' },
  { id: '250hr', label: 'Scholar', emoji: '🎓', description: '250 hours of focused study', tier: 'gold', category: 'Hours' },
  { id: '500hr', label: 'Legend', emoji: '👑', description: '500 hours — you are a legend', tier: 'gold', category: 'Hours' },
  // Sessions
  { id: 'sessions_1', label: 'First Step', emoji: '🎯', description: 'Complete your first study session', tier: 'bronze', category: 'Sessions' },
  { id: 'sessions_10', label: 'Regular', emoji: '🎖️', description: 'Complete 10 study sessions', tier: 'bronze', category: 'Sessions' },
  { id: 'sessions_50', label: 'Committed', emoji: '🏅', description: 'Complete 50 sessions', tier: 'silver', category: 'Sessions' },
  { id: 'sessions_100', label: 'Veteran', emoji: '🏆', description: 'Complete 100 sessions', tier: 'gold', category: 'Sessions' },
  // Streaks
  { id: 'streak_3', label: 'On a Roll', emoji: '🔥', description: 'Study 3 days in a row', tier: 'bronze', category: 'Streaks' },
  { id: 'streak_7', label: 'Week Warrior', emoji: '⚔️', description: '7-day study streak', tier: 'silver', category: 'Streaks' },
  { id: 'streak_14', label: 'Fortnight', emoji: '🏆', description: '14-day study streak', tier: 'gold', category: 'Streaks' },
  { id: 'streak_30', label: 'Iron Will', emoji: '💎', description: '30-day study streak', tier: 'gold', category: 'Streaks' },
  // Consistency
  { id: 'consistent_10', label: 'Steady Pace', emoji: '📅', description: 'Active 10 days this month', tier: 'bronze', category: 'Consistency' },
  { id: 'consistent_20', label: 'Month Grind', emoji: '🌟', description: 'Active 20 days this month', tier: 'silver', category: 'Consistency' },
  { id: 'consistent_28', label: 'Perfectionist', emoji: '✨', description: 'Active 28 days this month', tier: 'gold', category: 'Consistency' },
  // Time of day
  { id: 'early_bird', label: 'Early Bird', emoji: '🌅', description: 'Over half your sessions before 10am', tier: 'bronze', category: 'Style' },
  { id: 'night_owl', label: 'Night Owl', emoji: '🦉', description: 'Over half your sessions after 8pm', tier: 'bronze', category: 'Style' },
  { id: 'afternoon_peak', label: 'Afternoon Peak', emoji: '⚡', description: 'Over half your sessions 12–5pm', tier: 'bronze', category: 'Style' },
  // Session length
  { id: 'sprint_king', label: 'Sprint King', emoji: '⚡', description: '10+ sessions under 25 minutes', tier: 'bronze', category: 'Style' },
  { id: 'deep_focus', label: 'Deep Focus', emoji: '🧠', description: '10+ sessions over 90 minutes', tier: 'silver', category: 'Style' },
  // Modules
  { id: 'multi_module', label: 'Multi-Module', emoji: '🎓', description: 'Enrolled in 3 or more modules', tier: 'bronze', category: 'Modules' },
  { id: 'breadth', label: 'Breadth', emoji: '🌐', description: 'Enrolled in 5 or more modules', tier: 'silver', category: 'Modules' },
  // Goals
  { id: 'goal_getter', label: 'Goal Getter', emoji: '🎯', description: 'Hit your weekly study goal', tier: 'silver', category: 'Goals' },
  { id: 'consistent_goals', label: 'Consistent Goals', emoji: '📆', description: 'Hit your weekly goal 4 weeks running', tier: 'gold', category: 'Goals' },
];

const CATEGORIES = ['Hours', 'Sessions', 'Streaks', 'Consistency', 'Style', 'Modules', 'Goals'];

const TIER_COLOR = achievementTierColors;

const TIER_LABEL = { gold: '🥇 Gold', silver: '🥈 Silver', bronze: '🥉 Bronze' };

function BadgeTile({ badge, earned }) {
  const t = TIER_COLOR[badge.tier];
  const tooltip = earned ? badge.description : `Locked: ${badge.description}`;
  return (
    <div
      className={`${styles.tile} ${earned ? styles.tileEarned : styles.tileLocked}`}
      style={earned ? { background: t.bg, borderColor: t.border } : {}}
      data-tooltip={tooltip}
    >
      <span className={styles.tileEmoji} style={{ opacity: earned ? 1 : 0.25 }}>{earned ? badge.emoji : "🔒"}</span>
      <span className={styles.tileLabel} style={{ color: earned ? "var(--text)" : "var(--muted)" }}>{badge.label}</span>
      {earned && <span className={styles.tileTier} style={{ color: t.color }}>{TIER_LABEL[badge.tier]}</span>}
      {!earned && <span className={styles.tileLockHint}>{badge.description}</span>}
    </div>
  );
}

function AchievementsHeader({ totalEarned, totalBadges, onClose }) {
  const progressWidth = totalBadges > 0 ? `${(totalEarned / totalBadges) * 100}%` : "0%";
  return (
    <div className={styles.header}>
      <div>
        <h2 className={styles.title}>Achievements</h2>
        <p className={styles.subtitle}>{totalEarned} / {totalBadges} unlocked</p>
      </div>
      <div className={styles.progressWrap}>
        <div className={styles.progressBar} style={{ width: progressWidth }} />
      </div>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
    </div>
  );
}

function CategorySection({ cat, earnedIds }) {
  const catBadges = ALL_BADGES.filter(b => b.category === cat);
  const catEarned = catBadges.filter(b => earnedIds.has(b.id)).length;
  return (
    <div className={styles.category}>
      <div className={styles.catHeader}>
        <span className={`${styles.catName} ${cat === "Hours" ? styles.catNameEmphasis : ""}`}>{cat}</span>
        <span className={styles.catCount}>{catEarned}/{catBadges.length}</span>
      </div>
      <div className={styles.grid}>
        {catBadges.map(b => <BadgeTile key={b.id} badge={b} earned={earnedIds.has(b.id)} />)}
      </div>
    </div>
  );
}

function useCloseOnEscape(onClose) {
  useEffect(() => {
    const handler = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
}

function AchievementsBody({ earnedIds }) {
  return <div className={styles.body}>{CATEGORIES.map((cat) => <CategorySection key={cat} cat={cat} earnedIds={earnedIds} />)}</div>;
}

function buildEarnedIds(badges) {
  return new Set((badges || []).map((badge) => badge.id));
}

function countEarnedBadges(earnedIds) {
  return ALL_BADGES.filter((badge) => earnedIds.has(badge.id)).length;
}

export default function AchievementsModal({ badges, onClose }) {
  const earnedIds = buildEarnedIds(badges);
  useCloseOnEscape(onClose);
  return (
    <StandardModal
      onClose={onClose}
      hideHeader
      size="lg"
      backdropClassName={styles.modalBackdrop}
      modalClassName={styles.modalShell}
      contentClassName={styles.modalContent}
    >
      <AchievementsHeader totalEarned={countEarnedBadges(earnedIds)} totalBadges={ALL_BADGES.length} onClose={onClose} />
      <AchievementsBody earnedIds={earnedIds} />
    </StandardModal>
  );
}
