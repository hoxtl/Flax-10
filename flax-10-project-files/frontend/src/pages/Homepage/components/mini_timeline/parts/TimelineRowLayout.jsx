/*
 * Shared layout wrappers for mini timeline rows.
 */

export function TimelineRowLayout({ row, styles, minHeight, children, rowClassName = "" }) {
  const rowStyle = { marginTop: row.spacingBeforePx || 0, minHeight };
  return (
    <div className={`${styles.planTimelineRow} ${rowClassName}`.trim()} style={rowStyle}>
      {children}
    </div>
  );
}

export function TimelineGutter({ row, styles, timeLabel }) {
  return (
    <div className={styles.planTimelineGutter}>
      {row.hideTimeLabel ? null : <span className={styles.planTimelineTime}>{timeLabel}</span>}
    </div>
  );
}

export function TimelineSpineCell({ styles }) {
  return <div className={styles.planTimelineSpineCell} aria-hidden />;
}
