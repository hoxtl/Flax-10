/**
 * Empty slot: show gutter + "Free Window" label; ghost button "Autofill with Quick Win?".
 */

import { useState } from "react";
import { formatTime, fmtDuration } from "../utils/dateFormatUtils";
import { isNightSlot } from "../utils/slotUtils.js";
import styles from "../Homepage.module.css";

export function FreeWindowRow({
  minutes,
  gapStart,
  showFreeWindowLabel,
  suggestedTask,
  addEvent,
  onToast,
  onScheduled,
}) {
  const [scheduling, setScheduling] = useState(false);
  const [hidden, setHidden] = useState(false);

  const handleAutofill = async () => {
    if (!suggestedTask || scheduling) return;
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
      onScheduled?.();
      onToast?.(`"${suggestedTask.title}" added to your plan`);
      setHidden(true);
    } catch {
      onToast?.("Couldn't add — try again.");
    } finally {
      setScheduling(false);
    }
  };

  const gapStartTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
  const timeStr = formatTime(gapStartTime.toISOString());
  const nightSlot = isNightSlot(gapStartTime);

  if (hidden) return null;

  return (
    <div className={`${styles.freeWindowRow} ${nightSlot ? styles.nightSlot : ""}`}>
      <div className={styles.gutter}>
        <span className={styles.gutterTime}>{timeStr}</span>
        <span className={styles.gutterDur}>{fmtDuration(minutes)}</span>
        {showFreeWindowLabel && <span className={styles.freeWindowLabel}>Free Window</span>}
      </div>
      <div className={styles.freeWindowContent}>
        <button
          type="button"
          className={styles.timelineGapAutofillBtn}
          onClick={handleAutofill}
          disabled={scheduling || !suggestedTask}
          title={
            suggestedTask
              ? `Add "${suggestedTask.title}" (${(suggestedTask.estimated_blocks || 1) * 25}m) here`
              : "No short task fits this slot"
          }
          aria-label={suggestedTask ? `Autofill with quick win: ${suggestedTask.title}` : "No task fits this gap"}
        >
          {scheduling ? "Adding…" : "Autofill with Quick Win?"}
        </button>
      </div>
    </div>
  );
}
