/**
 * Timeline event card — single event row with detail overlay and context menu.
 */

import { useState, useCallback, useRef } from "react";
import { useTags } from "../../../context/TagContext";
import {
  isNow,
  isPast,
  isLecture,
  isRoutineEvent,
  extractModuleCode,
  resolveEventIcon,
  eventAccentColor,
  scheduleCardBorderColor,
} from "../utils/eventUtils";
import { formatTime, fmtDuration } from "../utils/dateFormatUtils";
import { getNowLinePercent } from "../utils/timelineUtils";
import { isNightSlot } from "../utils/slotUtils";
import { DetailOverlay } from "./DetailOverlay";
import { ContextMenu } from "./ContextMenu";
import styles from "../Homepage.module.css";

export function TimelineRow({ item, isFirst, isLast, onDelete, onEdit, onReschedule, dayTasks, asPastBar }) {
  const { getTag } = useTags();
  const [showDetail, setShowDetail] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);

  const theme = getTag(item.tag) || { color: "#94A3B8", icon: "📅" };
  const icon = resolveEventIcon(item, theme.icon);
  const durationMins = item.end_time
    ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 60000)
    : null;
  const matchTask = dayTasks?.find((t) => (t.title || "").trim() === (item.title || "").trim());
  const accentColor = eventAccentColor(item, matchTask, theme.color);
  const borderColor = scheduleCardBorderColor(item, matchTask);
  const active = isNow(item.start_time, item.end_time);
  const past = !active && isPast(item.end_time);
  const routine = isRoutineEvent(item);
  const isOverdue = false;
  const lect = isLecture(item);
  const modCode = lect ? (item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description)) : null;
  const startTime = formatTime(item.start_time);

  const cardHeight = durationMins != null ? Math.max(40, Math.min(180, Math.round(durationMins * 1.8))) : undefined;
  const nightSlot = isNightSlot(item.start_time);

  const actionBtnRef = useRef(null);
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);
  const openActionMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionBtnRef.current) {
      const rect = actionBtnRef.current.getBoundingClientRect();
      setCtxMenu({ x: rect.left, y: rect.bottom + 4 });
    }
  }, []);

  const isThinBar = (asPastBar || past) && !isOverdue;
  const rowPastDim = past && routine;
  const startHour = item.start_time ? new Date(item.start_time).getHours() : 12;
  const timeOfDayClass = startHour < 12 ? styles.timeOfDayMorning : startHour >= 17 ? styles.timeOfDayEvening : null;
  const nowLineTop = active ? getNowLinePercent(item.start_time, item.end_time) : null;
  const tagLower = (item.tag || "").toString().toLowerCase();
  const categoryClass =
    /academic|study|lecture|seminar|tutorial|exam|coursework/.test(tagLower) ? styles.cardCategoryAcademic
    : /personal|life|wellbeing/.test(tagLower) ? styles.cardCategoryPersonal
    : /admin|misc|other/.test(tagLower) ? styles.cardCategoryAdmin
    : null;

  return (
    <>
      <div className={`${styles.timelineRow} ${past ? styles.rowPast : ""} ${rowPastDim ? styles.rowPastRoutine : ""} ${isThinBar ? styles.rowThinBar : ""} ${nightSlot ? styles.nightSlot : ""} ${isOverdue ? styles.rowOverdue : ""}`}>
        <div className={styles.gutter}>
          <span className={styles.gutterTime}>{startTime}</span>
          {durationMins > 0 && <span className={styles.gutterDur}>{fmtDuration(durationMins)}</span>}
        </div>

        {isThinBar ? (
          <div
            className={styles.pastBar}
            style={{ background: `linear-gradient(90deg, ${accentColor}40, ${accentColor}15)` }}
            onClick={() => setShowDetail(true)}
            onContextMenu={handleContextMenu}
            title={item.title}
          />
        ) : (
          <div
            className={`${styles.card} ${active ? styles.cardActive : ""} ${isOverdue ? styles.cardOverdue : ""} ${timeOfDayClass || ""} ${categoryClass || ""} ${styles.cardWithNowLine}`}
            style={{
              "--card-accent": borderColor,
              minHeight: cardHeight ? `${cardHeight}px` : undefined,
              "--now-line-top": nowLineTop != null ? `${nowLineTop}%` : undefined,
            }}
            onClick={() => setShowDetail(true)}
            onContextMenu={handleContextMenu}
          >
            {active && nowLineTop != null && <div className={styles.nowIndicatorLine} aria-hidden />}
            <div className={styles.cardIcon} style={{ background: `${accentColor}1A` }}>
              <span className={styles.cardIconEmoji}>{icon}</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardMeta}>
                {active && <span className={styles.nowBadge}>Now</span>}
                {isOverdue && <span className={styles.overdueBadge}>Overdue</span>}
              </div>
              <span className={styles.cardTitle}>{item.title}</span>
              {lect && modCode && <span className={styles.cardSub}>{modCode}</span>}
              {isOverdue && onReschedule && (
                <button
                  type="button"
                  className={styles.cardRescheduleBtn}
                  disabled={rescheduling}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (rescheduling) return;
                    setRescheduling(true);
                    try {
                      await onReschedule(item);
                    } finally {
                      setRescheduling(false);
                    }
                  }}
                  aria-label="Reschedule"
                >
                  {rescheduling ? "Rescheduling…" : "🔄 Reschedule"}
                </button>
              )}
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
        )}
      </div>

      {showDetail && (
        <DetailOverlay item={item} icon={icon} accentColor={accentColor} onClose={() => setShowDetail(false)} />
      )}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} item={item} onEdit={onEdit} onDelete={onDelete} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}
