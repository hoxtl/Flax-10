/**
 * Plan timeline component — events, gaps, hour marks, NOW line.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";

import { isToday } from "../../../../components/Calendar/utils/dateUtils";
import { DAY_START_HOUR, DAY_END_HOUR } from "../../utils/timelineUtils";
import { formatTime } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { isNow } from "../../utils/eventUtils";
import { computePlanTimelineRows } from "../../utils/planTimelineRows";

import { HourMarkRow } from "./HourMarkRow";
import { TinyGapRow } from "./TinyGapRow";
import { NowRow } from "./NowRow";
import { PlanFreeRow } from "./PlanFreeRow";
import { EventGroupRow } from "./EventGroupRow";
import { PlanEventRow } from "./PlanEventRow";

export function MiniTimeline({
  sortedEvents,
  selectedDate,
  now,
  dayTasks,
  tasksDueToday = [],
  suggestableTasks = [],
  taskLists = [],
  onQuickStart,
  onHarvestToggle,
  onCardClick,
  onEdit,
  onConflictAutoMove,
  onDelete,
  onReschedule,
  getTag = null,
  completedEventIds = new Set(),
  onToggleComplete,
  hasTimerSession,
  timerTask,
  timeLeft,
  timerMode,
  styles,
}) {
  const [conflictPopoverRowId, setConflictPopoverRowId] = useState(null);
  const [slotPopoverRowId, setSlotPopoverRowId] = useState(null);
  const conflictPopoverRef = useRef(null);
  const slotPopoverRef = useRef(null);
  const timelineScrollRef = useRef(null);

  useEffect(() => {
    if (!conflictPopoverRowId) return;
    const handleClickOutside = (e) => {
      if (conflictPopoverRef.current && !conflictPopoverRef.current.contains(e.target)) {
        setConflictPopoverRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [conflictPopoverRowId]);

  useEffect(() => {
    if (!slotPopoverRowId) return;
    const handleClickOutside = (e) => {
      if (slotPopoverRef.current && !slotPopoverRef.current.contains(e.target)) setSlotPopoverRowId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [slotPopoverRowId]);

  const dayStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(DAY_START_HOUR, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const dayEnd = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(DAY_END_HOUR, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const rows = useMemo(
    () => computePlanTimelineRows(sortedEvents, selectedDate, dayStart, dayEnd, now, dayTasks, tasksDueToday, isToday),
    [sortedEvents, selectedDate, dayStart, dayEnd, now, dayTasks, tasksDueToday]
  );

  const currentBlock = useMemo(
    () => (!hasTimerSession && isToday(selectedDate)) ? (sortedEvents || []).find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time)) : null,
    [hasTimerSession, selectedDate, sortedEvents]
  );

  const renderRow = useCallback(
    (row) => {
      if (row.type === "hourMark") return <HourMarkRow key={row.id} row={row} styles={styles} />;
      if (row.type === "tinyGap") return <TinyGapRow key={row.id} row={row} styles={styles} />;
      if (row.type === "now") return <NowRow key={row.id} row={row} styles={styles} />;
      if (row.type === "free") {
        return (
          <PlanFreeRow
            key={row.id}
            row={row}
            suggestableTasks={suggestableTasks}
            onQuickStart={onQuickStart}
            selectedDate={selectedDate}
            taskLists={taskLists}
            styles={styles}
            slotPopoverRef={slotPopoverRef}
            slotPopoverRowId={slotPopoverRowId}
            setSlotPopoverRowId={setSlotPopoverRowId}
          />
        );
      }
      if (row.type === "eventGroup") {
        return (
          <EventGroupRow
            key={row.id}
            row={row}
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
        );
      }
      return (
        <PlanEventRow
          key={row.id}
          row={row}
          rows={rows}
          taskLists={taskLists}
          conflictPopoverRowId={conflictPopoverRowId}
          conflictPopoverRef={conflictPopoverRef}
          setConflictPopoverRowId={setConflictPopoverRowId}
          onConflictAutoMove={onConflictAutoMove}
          onEdit={onEdit}
          onCardClick={onCardClick}
          onHarvestToggle={onHarvestToggle}
          onToggleComplete={onToggleComplete}
          onReschedule={onReschedule}
          completedEventIds={completedEventIds}
          selectedDate={selectedDate}
          isToday={isToday}
          getTag={getTag}
          styles={styles}
        />
      );
    },
    [rows, conflictPopoverRowId, slotPopoverRowId, suggestableTasks, onQuickStart, onEdit, onCardClick, onHarvestToggle, onToggleComplete, onReschedule, onConflictAutoMove, completedEventIds, taskLists, getTag, selectedDate, isToday, styles]
  );

  return (
    <div className={styles.planTimelineWrap} ref={timelineScrollRef}>
      {hasTimerSession && isToday(selectedDate) && (
        <div className={styles.planTimelineNowStrip}>
          <span className={styles.planTimelineNowStripDot} aria-hidden />
          <span className={styles.planTimelineNowStripLabel}>{timerMode === "break" ? "Break" : "Focus"}</span>
          <span className={styles.planTimelineNowStripTask}>{timerTask || "Session in progress"}</span>
          <span className={styles.planTimelineNowStripTimer}>
            {String(Math.floor((timeLeft || 0) / 60)).padStart(2, "0")}:{String((timeLeft || 0) % 60).padStart(2, "0")}
          </span>
        </div>
      )}
      {!hasTimerSession && isToday(selectedDate) && currentBlock && (
        <div className={styles.planTimelineNowStrip}>
          <span className={styles.planTimelineNowStripDot} aria-hidden />
          <span className={styles.planTimelineNowStripLabel}>Now</span>
          <span className={styles.planTimelineNowStripTask}>{stripEmojiFromTitle(currentBlock.title)}</span>
          <span className={styles.planTimelineNowStripTimer}>{formatTime(currentBlock.end_time)}</span>
        </div>
      )}
      <div className={`${styles.planTimelineList} ${rows.some((r) => r.type === "eventGroup" || (r.type === "event" && r.isOverlap)) ? styles.planTimelineListHasConflict : ""}`}>
        {rows.length === 0 && (
          <div className={styles.planTimelineEmpty}>
            <span className={styles.planTimelineEmptyText}>No events scheduled for this day.</span>
          </div>
        )}
        {rows.map(renderRow)}
      </div>
    </div>
  );
}
