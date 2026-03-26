/*
 * Shared layout wrappers for mini timeline rows.
 */

export function TimelineRowLayout({ row, styles, minHeight, children, rowClassName = "" }) {
<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Homepage/components/mini_timeline/parts/TimelineRowLayout.jsx
  const rowStyle = { marginTop: row.spacingBeforePx || 0, minHeight };
  return (
    <div className={`${styles.planTimelineRow} ${rowClassName}`.trim()} style={rowStyle}>
=======
  return (
    <div className={`${styles.planTimelineRow} ${rowClassName}`.trim()} style={{ marginTop: row.spacingBeforePx || 0, minHeight }}>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/pages/Homepage/components/MiniTimeline/parts/TimelineRowLayout.jsx
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
