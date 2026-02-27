/**
 * Detail overlay — event/task detail popup.
 */

import { isNow, isLecture, extractModuleCode } from "../utils/eventUtils";
import { formatTime, fmtDuration } from "../utils/dateFormatUtils";
import styles from "../Homepage.module.css";

export function DetailOverlay({ item, icon, accentColor, onClose }) {
  const start = new Date(item.start_time);
  const end = item.end_time ? new Date(item.end_time) : null;
  const durationMins = end ? Math.round((end - start) / 60000) : null;
  const active = isNow(item.start_time, item.end_time);
  const lect = isLecture(item);
  const modCode = lect ? (item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description)) : null;

  return (
    <div className={styles.overlayBackdrop} onMouseDown={onClose}>
      <div className={styles.detailCard} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.detailTop} style={{ background: `${accentColor}14` }}>
          <div className={styles.detailIconLarge} style={{ background: `${accentColor}22` }}>{icon}</div>
          <div className={styles.detailTopText}>
            <div className={styles.detailMeta}>
              {active && <span className={styles.nowPill}>Now</span>}
              <span className={styles.detailTime}>
                {formatTime(item.start_time)}{end ? ` – ${formatTime(item.end_time)}` : ""}
              </span>
              {durationMins > 0 && <span className={styles.detailDur}>{fmtDuration(durationMins)}</span>}
            </div>
            <h2 className={styles.detailTitle}>{item.title}</h2>
          </div>
          <button className={styles.detailClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.detailBody}>
          {lect && (modCode || item.description) && (
            <div className={styles.detailRow}>
              <span className={styles.detailRowLabel}>Module</span>
              <span className={styles.detailRowText}>
                {modCode && <strong>{modCode}</strong>}
                {modCode && item.description && " · "}
                {item.description}
              </span>
            </div>
          )}
          {!lect && item.description && (
            <div className={styles.detailRow}>
              <span className={styles.detailRowLabel}>Notes</span>
              <span className={styles.detailRowText}>{item.description}</span>
            </div>
          )}
          {item.location && (
            <div className={styles.detailRow}>
              <span className={styles.detailRowLabel}>Where</span>
              <span className={styles.detailRowText}>{item.location}</span>
            </div>
          )}
          {!item.description && !item.location && (
            <p className={styles.detailEmpty}>No additional details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
