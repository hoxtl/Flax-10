/**
 * Quick Win Opportunity card for 30–60 min gaps.
 */

import { useState } from "react";
import { formatTime, fmtDuration } from "../utils/dateFormatUtils";
import { isNightSlot } from "../utils/slotUtils";
import styles from "../Homepage.module.css";

export function QuickWinGap({ minutes, gapStart, suggestedTask, onTaskScheduled, addEvent, onToast }) {
  const [scheduling, setScheduling] = useState(false);
  const [hidden, setHidden] = useState(false);

  const shortName = suggestedTask
    ? (suggestedTask.title.length > 32 ? suggestedTask.title.slice(0, 29) + "…" : suggestedTask.title)
    : "a short task";

  const scheduleTask = async () => {
    if (!suggestedTask || scheduling || hidden) return;
    setScheduling(true);
    try {
      const estMins = (suggestedTask.estimated_blocks || 1) * 25;
      const startTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
      const endTime = new Date(startTime.getTime() + estMins * 60000);
      await addEvent({
        title: suggestedTask.title,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        description: suggestedTask.description || "",
      });
      onTaskScheduled?.(suggestedTask.id);
      onToast?.(`"${suggestedTask.title}" added to your plan`);
      setHidden(true);
    } catch {
      onTaskScheduled?.(suggestedTask.id);
      setHidden(true);
    } finally {
      setScheduling(false);
    }
  };

  if (hidden) return null;

  const gapStartTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
  const timeStr = formatTime(gapStartTime.toISOString());
  const nightSlot = isNightSlot(gapStartTime);

  return (
    <div className={`${styles.quickWinRow} ${nightSlot ? styles.nightSlot : ""}`}>
      <div className={styles.gutter}>
        <span className={styles.gutterTime}>{timeStr}</span>
        <span className={styles.gutterDur}>{fmtDuration(minutes)}</span>
      </div>
      <div className={styles.quickWinCard}>
        <p className={styles.quickWinText}>
          🌱 Quick Win Opportunity. Do you want to tackle <strong>{shortName}</strong> here?
        </p>
        <button
          type="button"
          className={styles.quickWinBtn}
          onClick={scheduleTask}
          disabled={scheduling || !suggestedTask}
        >
          {scheduling ? "Adding…" : "Quick Add"}
        </button>
      </div>
    </div>
  );
}
