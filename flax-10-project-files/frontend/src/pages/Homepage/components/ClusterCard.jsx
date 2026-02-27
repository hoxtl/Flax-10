/**
 * Cluster card — single event within an overlap cluster.
 */

import { useState, useCallback, useRef } from "react";
import { isNow, isPast } from "../utils/eventUtils";
import { DetailOverlay } from "./DetailOverlay";
import { ContextMenu } from "./ContextMenu";
import styles from "../Homepage.module.css";

export function ClusterCard({ item, icon, accentColor, borderColor, durationMins, onDelete, onEdit }) {
  const [showDetail, setShowDetail] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const actionBtnRef = useRef(null);
  const active = isNow(item.start_time, item.end_time);
  const past = !active && isPast(item.end_time);
  const barColor = borderColor ?? accentColor;

  const openActionMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionBtnRef.current) {
      const rect = actionBtnRef.current.getBoundingClientRect();
      setCtxMenu({ x: rect.left, y: rect.bottom + 4 });
    }
  }, []);

  return (
    <>
      <div
        className={`${styles.card} ${styles.clusterCard} ${past ? styles.cardPast : ""} ${active ? styles.cardActive : ""}`}
        style={{ "--card-accent": barColor }}
        onClick={() => setShowDetail(true)}
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
      >
        <div className={styles.cardIcon} style={{ background: `${accentColor}1A` }}>
          <span className={styles.cardIconEmoji}>{icon}</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>{active && <span className={styles.nowBadge}>Now</span>}</div>
          <span className={styles.cardTitle}>{item.title}</span>
        </div>
        <div className={styles.cardActionBar}>
          <button
            ref={actionBtnRef}
            type="button"
            className={styles.cardActionBtn}
            onClick={openActionMenu}
            aria-label="Schedule options"
            aria-haspopup="menu"
          >
            <svg className={styles.cardActionKebab} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
          </button>
        </div>
      </div>
      {showDetail && <DetailOverlay item={item} icon={icon} accentColor={accentColor} onClose={() => setShowDetail(false)} />}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} item={item} onEdit={onEdit} onDelete={onDelete} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}
