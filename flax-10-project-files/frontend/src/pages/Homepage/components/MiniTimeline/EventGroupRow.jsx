/**
 * Plan timeline event group row (overlapping events).
 */

import { Link } from "react-router-dom";
import { DAY_START_HOUR } from "../../utils/timelineUtils";
import { ConflictCard } from "./ConflictCard";
import { getTaskEmoji } from "../../../../utils/emojiMapping";

export function EventGroupRow({
  row,
  rows,
  taskLists,
  conflictPopoverRowId,
  conflictPopoverRef,
  setConflictPopoverRowId,
  onConflictAutoMove,
  onEdit,
  getTag,
  styles,
  selectedDate,
}) {
  const groupItems = row.items;

  return (
    <div key={row.id} className={styles.planTimelineRow} style={{ marginTop: row.spacingBeforePx || 0 }}>
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>
          {String(Math.floor(DAY_START_HOUR + row.startMins / 60)).padStart(2, "0")}:{String(row.startMins % 60).padStart(2, "0")}
        </span>
      </div>
      <div className={styles.planTimelineSpineCell}>
        {groupItems.map((r) => (
          <span key={`node-${r.id}-${getTaskEmoji(r.item.title, r.item.start_time)}`} className={styles.planTimelineNode} aria-hidden>
            {getTaskEmoji(r.item.title, r.item.start_time)}
          </span>
        ))}
      </div>
      <div className={styles.planTimelineConflictGroup}>
        {groupItems.map((r) => (
          <ConflictCard
            key={r.id}
            r={r}
            rows={rows}
            taskLists={taskLists}
            conflictPopoverRowId={conflictPopoverRowId}
            conflictPopoverRef={conflictPopoverRef}
            setConflictPopoverRowId={setConflictPopoverRowId}
            onConflictAutoMove={onConflictAutoMove}
            onEdit={onEdit}
            getTag={getTag}
            styles={styles}
            selectedDate={selectedDate}
          />
        ))}
      </div>
    </div>
  );
}
