<<<<<<< HEAD
import Badge from "../../../../components/common/badge/Badge";
=======
import Badge from "../../../../components/common/Badge/Badge";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import ProfileWidget from "./ProfileWidget";
import widgetStyles from "./ProfileWidgets.module.css";
import badgeStyles from "./ProfileBadgesModules.module.css";
const styles = { ...widgetStyles, ...badgeStyles };

function badgeClassName(tier) {
  const key = tier ? `badge${tier[0].toUpperCase()}${tier.slice(1)}` : "";
  return `${styles.badge} ${styles[key] || ""}`;
}

function BadgeGrid({ badges }) {
  return (
    <div className={styles.badgesGrid}>
      {badges.slice(0, 6).map(b => (
        <Badge key={b.id} className={badgeClassName(b.tier)} tone="muted" title={b.description}>
          <span className={styles.badgeEmoji}>{b.emoji}</span>
          {b.label}
        </Badge>
      ))}
      {badges.length > 6 && (
        <Badge className={styles.badgesMore} tone="muted">+{badges.length - 6} more</Badge>
      )}
    </div>
  );
}

export function BadgesSection({ badges, onOpen }) {
  const viewAll = <span className={styles.badgesViewAll}>View all →</span>;
  return (
    <ProfileWidget title="ACHIEVEMENTS" action={viewAll} onClick={onOpen}>
      <div className={styles.badgesSummary}>
        <span className={styles.badgesCount}>{badges?.length || 0}</span>
        <span className={styles.badgesCountLabel}> / 26 unlocked</span>
      </div>
      <BadgeGrid badges={badges || []} />
    </ProfileWidget>
  );
}

function BannerBadgeList({ badges }) {
  return (
    <div className={styles.badgesBannerScroll}>
      {badges.map(b => (
        <Badge key={b.id} className={badgeClassName(b.tier)} tone="muted" title={b.description}>
          <span className={styles.badgeEmoji}>{b.emoji}</span>
          {b.label}
        </Badge>
      ))}
    </div>
  );
}

export function BadgesBanner({ badges, onOpen }) {
  if (!badges?.length) return null;
  const handleKey = (e) => (e.key === "Enter" || e.key === " ") && onOpen?.();
  return (
    <div
      className={`${styles.glassCard} ${styles.badgesBanner}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={handleKey}
    >
      <div className={styles.badgesBannerLeft}>
        <span className={styles.badgesBannerCount}>{badges.length}</span>
        <span className={styles.badgesBannerLabel}>/ 26{"\n"}unlocked</span>
      </div>
      <BannerBadgeList badges={badges.slice(0, 10)} />
      <span className={styles.badgesBannerViewAll}>View all →</span>
    </div>
  );
}
