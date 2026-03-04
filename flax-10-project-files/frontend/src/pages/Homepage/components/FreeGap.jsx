/**
 * Empty slot with Quick Add dropdown.
 */

import { useState, useEffect, useRef } from "react";
import { formatTime, fmtDuration } from "../utils/dateFormatUtils";
import { isNightSlot } from "../utils/slotUtils.js";
import styles from "../Homepage.module.css";

export function FreeGap({ minutes, gapStart, suggestedTask, quickAddTasks = [], onTaskScheduled, addEvent, onToast }) {
  const [scheduling, setScheduling] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const menuRef = useRef(null);

  const topTasks = (quickAddTasks && quickAddTasks.length > 0) ? quickAddTasks.slice(0, 3) : (suggestedTask ? [suggestedTask] : []);

  const scheduleTask = async (task) => {
    if (!task || scheduling || hidden) return;
    setScheduling(true);
    try {
      const estMins = (task.estimated_blocks || 1) * 25;
      const startTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
      const endTime = new Date(startTime.getTime() + estMins * 60000);
      await addEvent({
        title: task.title,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        description: task.description || "",
      });
      onTaskScheduled?.(task.id);
      onToast?.(`"${task.title}" added to your plan`);
      setHidden(true);
      setQuickOpen(false);
    } catch {
      onTaskScheduled?.(task.id);
      setHidden(true);
      setQuickOpen(false);
    } finally {
      setScheduling(false);
    }
  };

  useEffect(() => {
    if (!quickOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setQuickOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [quickOpen]);

  if (hidden) return null;

  const nightSlot = isNightSlot(gapStart);
  const gapStartTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
  const timeStr = formatTime(gapStartTime.toISOString());

  return (
    <div className={`${styles.gapRow} ${nightSlot ? styles.nightSlot : ""}`} ref={menuRef}>
      <div className={styles.gutter}>
        <span className={styles.gutterTime}>{timeStr}</span>
        <span className={styles.gutterDur}>{fmtDuration(minutes)}</span>
      </div>
      <div className={styles.gapAddBlockWrap}>
        <div
          className={styles.gapAddBlockBox}
          onClick={() => setQuickOpen((o) => !o)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setQuickOpen((o) => !o); } }}
          role="button"
          tabIndex={0}
          title={`${fmtDuration(minutes)} free — add task`}
          aria-label="Add block"
        >
          <span className={styles.gapAddBlockLabel}>+ Add Block</span>
        </div>
        {quickOpen && topTasks.length > 0 && (
          <div className={styles.quickAddMenu}>
            <span className={styles.quickAddTitle}>Quick add</span>
            {topTasks.map((t) => (
              <button
                key={t.id}
                type="button"
                className={styles.quickAddItem}
                onClick={() => scheduleTask(t)}
                disabled={scheduling}
              >
                {t.title}
              </button>
            ))}
          </div>
        )}
        {quickOpen && topTasks.length === 0 && (
          <div className={styles.quickAddMenu}>
            <span className={styles.quickAddEmptyIcon} aria-hidden>🪴</span>
            <span className={styles.quickAddEmpty}>No tasks to add</span>
          </div>
        )}
      </div>
    </div>
  );
}
