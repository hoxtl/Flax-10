/**
 * Plan timeline component — events, gaps, hour marks, NOW line.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

import { getUserSettings } from "../../../../api/userService";
import { isToday } from "../../../../components/Calendar/utils/dateUtils";
import { isReadOnlyEvent } from "../../../../components/Calendar/utils/eventUtils";
import { DAY_START_HOUR, DAY_END_HOUR } from "../../utils/timelineUtils";
import { formatTime } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { isNow } from "../../utils/eventUtils";
import { computePlanTimelineRows } from "../../utils/planTimelineRows";
import { getTasksThatFitGap, taskDurationMins } from "../../utils/taskUtils";

import { HourMarkRow } from "./HourMarkRow";
import { TinyGapRow } from "./TinyGapRow";
import { NowRow } from "./NowRow";
import { PlanFreeRow } from "./PlanFreeRow";

import { PlanEventRow } from "./PlanEventRow";
import { ConflictPairRow } from "./ConflictPairRow";
import { EventContextMenu } from "./EventContextMenu";

export function MiniTimeline({
  sortedEvents,
  selectedDate,
  now,
  dayTasks,
  tasksDueToday = [],
  suggestableTasks = [],
  deadlineSuggestions = [],
  taskLists = [],
  onQuickStart,
  onTaskToggle,
  onCardClick,
  onEdit,
  onConflictAutoMove,
  onDelete,
  onPushTomorrow,
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
  const [eventCtxMenu, setEventCtxMenu] = useState(null);
  const [sleepWindow, setSleepWindow] = useState({ sleepTime: "23:00", wakeTime: "07:00" });
  const [skippedGapTasks, setSkippedGapTasks] = useState({}); // { [rowId]: Set<taskId> }
  const conflictPopoverRef = useRef(null);
  const slotPopoverRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const nowRowRef = useRef(null);

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

  useEffect(() => {
    let cancelled = false;
    getUserSettings()
      .then((data) => {
        if (cancelled) return;
        setSleepWindow({
          sleepTime: data?.sleep_time?.slice(0, 5) || "23:00",
          wakeTime: data?.wake_time?.slice(0, 5) || "07:00",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSleepWindow({ sleepTime: "23:00", wakeTime: "07:00" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Removed auto-scroll the NOW line into view on mount because it scrolls the entire Homepage down.

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

  const bestFreeRowId = useMemo(() => {
    const freeRows = rows.filter((r) => r.type === "free");
    if (!freeRows.length) return null;
    let best = null;
    let bestScore = -Infinity;
    for (const r of freeRows) {
      const { suggested } = getTasksThatFitGap(suggestableTasks || [], r.minutes || 0);
      const due = suggested?.due_date ? new Date(suggested.due_date) : null;
      const overdueBoost = due && due < now ? 240 : 0;
      const urgentBoost = suggested?.priority === "urgent" ? 140 : suggested?.priority === "high" ? 70 : 0;
      const score = (r.minutes || 0) + overdueBoost + urgentBoost;
      if (score > bestScore) {
        bestScore = score;
        best = r.id;
      }
    }
    return best;
  }, [rows, suggestableTasks, now]);

  const assignedGapTasks = useMemo(() => {
    const freeRows = rows
      .filter((r) => r.type === "free")
      .sort((a, b) => (a.gapStartMins ?? a.startMins ?? 0) - (b.gapStartMins ?? b.startMins ?? 0));

    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const queue = [...(suggestableTasks || [])]
      .filter((t) => !t?.completed)
      .sort((a, b) => {
        const aDue = a?.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b?.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        if (aDue !== bDue) return aDue - bDue;
        return (priorityOrder[a?.priority] ?? 2) - (priorityOrder[b?.priority] ?? 2);
      });

    const used = new Set();
    const map = {};

    const rankForGap = (task, gapMins) => {
      const due = task?.due_date ? new Date(task.due_date) : null;
      const isOverdue = !!(due && due < now);
      const priorityRank = priorityOrder[task?.priority] ?? 2;
      const duration = taskDurationMins(task);
      const durationFit = Math.abs((gapMins || 0) - duration);
      return [
        isOverdue ? 0 : 1,
        priorityRank,
        durationFit,
        -(duration || 0), // prefer longer focused work when urgency is tied
      ];
    };

    const compareRank = (a, b) => {
      for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return a[i] - b[i];
      }
      return 0;
    };

    for (const row of freeRows) {
      const mins = row.minutes || 0;
      const skipped = skippedGapTasks[row.id];
      const candidates = queue.filter((t) => !used.has(t.id) && !(skipped && skipped.has(t.id)) && getTasksThatFitGap([t], mins).suggested);
      const pick = candidates
        .sort((a, b) => compareRank(rankForGap(a, mins), rankForGap(b, mins)))[0];
      if (!pick) continue;
      map[row.id] = pick;
      used.add(pick.id);
    }

    // Build a map of each row → the next free row's assigned task
    const nextMap = {};
    for (let i = 0; i < freeRows.length - 1; i++) {
      const nextTask = map[freeRows[i + 1].id] || null;
      if (nextTask) nextMap[freeRows[i].id] = nextTask;
    }

    return { map, nextMap };
  }, [rows, suggestableTasks, now, skippedGapTasks]);

  const currentBlock = useMemo(
    () => (!hasTimerSession && isToday(selectedDate)) ? (sortedEvents || []).find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time)) : null,
    [hasTimerSession, selectedDate, sortedEvents]
  );

  const onSkipGapTask = useCallback((rowId, taskId) => {
    setSkippedGapTasks((prev) => {
      const next = { ...prev };
      const set = new Set(prev[rowId] || []);
      set.add(taskId);
      next[rowId] = set;
      return next;
    });
  }, []);

  const renderRow = useCallback(
    (row) => {
      if (row.type === "hourMark") return <HourMarkRow key={row.id} row={row} styles={styles} />;
      if (row.type === "tinyGap") return <TinyGapRow key={row.id} row={row} styles={styles} />;
      if (row.type === "now") return <NowRow key={row.id} row={row} styles={styles} nowRowRef={nowRowRef} />;
      if (row.type === "free") {
        return (
          <PlanFreeRow
            key={row.id}
            row={row}
            suggestableTasks={suggestableTasks}
            deadlineSuggestions={deadlineSuggestions}
            onQuickStart={onQuickStart}
            selectedDate={selectedDate}
            taskLists={taskLists}
            styles={styles}
            slotPopoverRef={slotPopoverRef}
            slotPopoverRowId={slotPopoverRowId}
            setSlotPopoverRowId={setSlotPopoverRowId}
            isBestGap={row.id === bestFreeRowId}
            assignedTask={assignedGapTasks.map[row.id] || null}
            nextAssignedTask={assignedGapTasks.nextMap[row.id] || null}
            onSkipTask={(taskId) => onSkipGapTask(row.id, taskId)}
          />
        );
      }
      if (row.type === "eventGroup") {
        return (
          <ConflictPairRow
            key={row.id}
            row={row}
            rows={rows}
            onConflictAutoMove={onConflictAutoMove}
            onDelete={onDelete}
            onPushTomorrow={onPushTomorrow}
            onCardClick={onCardClick}
            onEventContextMenu={(eventItem, x, y) => setEventCtxMenu({ eventItem, x, y })}
            onEdit={onEdit}
            getTag={getTag}
            styles={styles}
            selectedDate={selectedDate}
            sleepWindow={sleepWindow}
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
          onPushTomorrow={onPushTomorrow}
          onEdit={onEdit}
          onCardClick={onCardClick}
          onEventContextMenu={(eventItem, x, y) => setEventCtxMenu({ eventItem, x, y })}
          onTaskToggle={onTaskToggle}
          onToggleComplete={onToggleComplete}
          onReschedule={onReschedule}
          completedEventIds={completedEventIds}
          selectedDate={selectedDate}
          isToday={isToday}
          getTag={getTag}
          styles={styles}
          sleepWindow={sleepWindow}
        />
      );
    },
    [rows, conflictPopoverRowId, slotPopoverRowId, suggestableTasks, deadlineSuggestions, onQuickStart, onEdit, onCardClick, onTaskToggle, onToggleComplete, onReschedule, onConflictAutoMove, onPushTomorrow, onDelete, completedEventIds, taskLists, getTag, selectedDate, isToday, styles, nowRowRef, sleepWindow, onSkipGapTask, assignedGapTasks]
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
      <div
        className={`${styles.planTimelineList} ${rows.some((r) => r.type === "eventGroup") ? styles.planTimelineListHasConflict : ""}`}
      >
        {rows.length === 0 && (
          <div className={styles.planTimelineEmpty}>
            <span className={styles.planTimelineEmptyText}>No events scheduled for this day.</span>
          </div>
        )}
        {rows.map((row) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            {renderRow(row)}
          </motion.div>
        ))}
        {eventCtxMenu && !isReadOnlyEvent(eventCtxMenu.eventItem) && (
          <EventContextMenu
            eventItem={eventCtxMenu.eventItem}
            pos={{ x: eventCtxMenu.x, y: eventCtxMenu.y }}
            styles={styles}
            onClose={() => setEventCtxMenu(null)}
            onEdit={(ev) => onEdit?.(ev, ev?.tag)}
            onDelete={async (ev) => {
              await onDelete?.(ev);
            }}
          />
        )}
      </div>
    </div>
  );
}
