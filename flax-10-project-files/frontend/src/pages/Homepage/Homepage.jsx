import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useCountUp } from "../../hooks/useCountUp";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";

import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
import {
  useCalendar,
  useCalendarDispatch,
  useEventModal,
} from "../../context/CalendarContext";
import {
  useCalendarEvents,
  useEventActions,
} from "../../components/Calendar/hooks/useCalendarEvents";
import { fetchTasks, updateTask, createTask, fetchTaskLists, createTaskList, deleteTask } from "../../api/taskService";
import { useTags } from "../../context/TagContext";
import { extractBaseEventId } from "../../components/Calendar/utils/eventUtils";
import { getModules, getEnrollments } from "../../api/moduleApi";
import { getUpcomingDeadlines } from "../../api/deadlineApi";
import { isEnrolledIn } from "../../components/Modules/utils/moduleUtils";
import { useTimerContext } from "../../context/TimerContext";
import { useTaskCompletion } from "../../context/TaskCompletionContext";
import { getCompletionMessage, isRoutineTask } from "../../lib/completionMessages";
import { getLevelUpThresholdCrossed, getLevelUpMessageForThreshold, getSaplingCelebrationCrossed, getSaplingCelebrationMessage } from "../../lib/gardenStatus";
import { getSeedsPerDayThisWeek } from "../../lib/weeklySeedCount";
import { playCompletionChime } from "../../lib/sounds";
import analyticsService from "../../api/analyticsService";

import EmptyStateCard from "../../components/EmptyStateCard";
import CreateTaskModal from "../Tasks/components/CreateTaskModal";
import CreateListModal from "../Tasks/components/CreateListModal";
import { EditTaskModal } from "../Tasks/components/TaskCard";
import IntelligenceRow from "../../components/Homepage/IntelligenceRow";
import styles from "./Homepage.module.css";
import taskWidgetStyles from "./styles/TaskWidget.module.css";

import {
  formatTime,
  isNow,
  isLecture,
  isRoutineEvent,
  getNavigatorContext,
  getMotivationMessage,
  getPeakHours,
  getUrgencyLevel,
  computeTimelineWithGaps,
  getNextFreeSlotToday,
  getAllFreeWindowsToday,
  isRoutineOrEventTask,
  isAutoPassedTask,
} from "./utils/index";
import { DAY_START_HOUR, DAY_END_HOUR } from "./utils/timelineUtils";
import { formatScheduleCountdown } from "./utils/dateFormatUtils";
import { useHomeData } from "./hooks/useHomeData";
import { useScheduleCountdown } from "./hooks/useScheduleCountdown";
import { TaskWidgetSlot } from "./components/TaskWidgetSlot";
import { DeadlinesWidget } from "./components/DeadlinesWidget";
import { FocusWindowsWidget } from "./components/FocusWindowsWidget";

/** Module code → pill color (same hash as TaskCard for consistency). */
const MODULE_COLORS = [
  { text: "#9a3412", bg: "rgba(251, 146, 60, 0.18)" },
  { text: "#1d4ed8", bg: "rgba(96, 165, 250, 0.18)" },
  { text: "#5C6B4F", bg: "rgba(139, 157, 123, 0.16)" },
  { text: "#7e22ce", bg: "rgba(192, 132, 252, 0.16)" },
  { text: "#b45309", bg: "rgba(252, 211, 77, 0.20)" },
  { text: "#be123c", bg: "rgba(251, 113, 133, 0.16)" },
  { text: "#0e7490", bg: "rgba(34, 211, 238, 0.15)" },
  { text: "#4338ca", bg: "rgba(165, 180, 252, 0.18)" },
];
function getModuleColor(code) {
  if (!code) return { text: "#5a4a3a", bg: "rgba(74, 55, 40, 0.08)" };
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
  return MODULE_COLORS[Math.abs(hash) % MODULE_COLORS.length];
}

/* HOME PAGE */
export default function Homepage({ onNavigate, onNavChange }) {
  const goToNav = onNavigate ?? onNavChange;
  const navigate = useNavigate();
  const { selectedDate, events: allCalEvents } = useCalendar();
  const dispatch         = useCalendarDispatch();
  const { loadEvents }   = useCalendarEvents();
  const { removeEvent, addEvent, editEvent } = useEventActions();
  const { openModal }    = useEventModal();
  const { getTag, tags }       = useTags();
  const { setActiveTaskId, isActive: timerActive, timeLeft, task: timerTask, progress: timerProgress, setIsActive: setTimerActive, mode: timerMode, setMode: setTimerMode, setTimeLeft, workTime, breakTime, resetTimer, setTask: setTimerTask } = useTimerContext();
  const hasTimerSession = timerActive;

  const startFocusInWidget = useCallback(() => {
    setTimerMode("work");
    setTimeLeft((workTime || 25) * 60);
    setTimerTask("Focus");
    setTimerActive(true);
  }, [setTimerMode, setTimeLeft, workTime, setTimerTask, setTimerActive]);
  const { showCompletionToast, showLevelUpToast } = useTaskCompletion();

  const displayName = useMemo(() => {
    try {
      const s = localStorage.getItem("user");
      if (!s) return null;
      const u = JSON.parse(s);
      return (u.first_name || "").trim() || (u.username || "").trim() || null;
    } catch {
      return null;
    }
  }, []);

  const { dayEvents, dayTasks, allTasks, removePendingTask, refetchTasks } = useHomeData(selectedDate);
  const isBrandNewTasks = (allTasks || []).length === 0;
  const isAllTasksCompleted = (allTasks || []).length > 0 && (allTasks || []).filter((t) => !t.completed).length === 0;
  const [toast, setToast] = useState(null);
  const [pastCollapsed, setPastCollapsed] = useState(true);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
  const [modulesList, setModulesList] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [moduleFilterId, setModuleFilterId] = useState(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateListFromTask, setShowCreateListFromTask] = useState(false);
  const [lastCreatedListId, setLastCreatedListId] = useState(null);
  const [rescheduleTask, setRescheduleTask] = useState(null);
  const [celebratingTaskId, setCelebratingTaskId] = useState(null);
  const [nowHeroFocusBtnHovered, setNowHeroFocusBtnHovered] = useState(false);
  const [showXPSparks, setShowXPSparks] = useState(false);
  const prevTimeLeftRef = useRef(null);
  const [taskLists, setTaskLists] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const scheduleCountdownSecs = useScheduleCountdown(selectedDate, dayEvents);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [analyticsProgress, setAnalyticsProgress] = useState(null);
  const [completedEventIds, setCompletedEventIds] = useState(() => new Set());
  const [showAllTaskWidgetTasks, setShowAllTaskWidgetTasks] = useState(false);
  const taskWidgetRef = useRef(null);
  const [selectedDeadline, setSelectedDeadline] = useState(null);

  /* Today-first: always show today on Homepage — removes choice paralysis */
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dispatch({ type: "SET_SELECTED_DATE", payload: today });
  }, [dispatch]);
  useEffect(() => {
    const read = () => { try { setActiveTimerTaskId(sessionStorage.getItem("timerTaskId")); } catch (_) {} };
    read();
    window.addEventListener("focus", read);
    return () => window.removeEventListener("focus", read);
  }, []);

  /* Live Compass: recalc every 60s so the NOW line moves without refresh */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    getModules().then((list) => setModulesList(Array.isArray(list) ? list : [])).catch(() => setModulesList([]));
  }, []);
  useEffect(() => {
    getEnrollments().then((list) => setEnrollments(Array.isArray(list) ? list : [])).catch(() => setEnrollments([]));
  }, []);
  useEffect(() => {
    getUpcomingDeadlines().then((list) => setUpcomingDeadlines(Array.isArray(list) ? list : [])).catch(() => setUpcomingDeadlines([]));
  }, []);

  useEffect(() => {
    analyticsService.getSummary(7).then((data) => setAnalyticsSummary(data)).catch(() => setAnalyticsSummary(null));
    analyticsService.getProgress(14).then((data) => setAnalyticsProgress(data)).catch(() => setAnalyticsProgress(null));
  }, []);

  /* When work timer hits 0 in the NOW widget: soft chime + subtle +1 XP sparks */
  useEffect(() => {
    if (hasTimerSession && timerMode === "work" && prevTimeLeftRef.current > 0 && timeLeft === 0) {
      playCompletionChime(0.35);
      setShowXPSparks(true);
      const t = setTimeout(() => setShowXPSparks(false), 1400);
      return () => clearTimeout(t);
    }
    prevTimeLeftRef.current = timeLeft;
  }, [hasTimerSession, timerMode, timeLeft]);

  useEffect(() => {
    if (showCreateTaskModal) {
      fetchTaskLists().then((list) => setTaskLists(Array.isArray(list) ? list : [])).catch(() => setTaskLists([]));
    }
  }, [showCreateTaskModal]);

  /* Fetch task lists on mount so task widget can show list names (e.g. University, SEG) and link to /tasks?list= */
  useEffect(() => {
    fetchTaskLists().then((list) => setTaskLists(Array.isArray(list) ? list : [])).catch(() => setTaskLists([]));
  }, []);

  const handleModuleTagClick = useCallback((moduleId, moduleCode) => {
    const url = moduleId
      ? `/modules?moduleId=${moduleId}`
      : moduleCode
        ? `/modules?code=${encodeURIComponent(moduleCode)}`
        : "/modules";
    navigate(url);
  }, [navigate]);

  const modulesWithSeeds = useMemo(() => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return (modulesList || []).map((mod) => {
      const related = (allTasks || []).filter(
        (t) =>
          String(t.module_id || t.module || t.moduleId || "") === String(mod.id) ||
          (t.module_code || "").toUpperCase().trim() === (mod.module_code || "").toUpperCase().trim()
      );
      const totalTasks = related.length;
      const seedsGrown = related.filter((t) => t.completed).length;
      const pct = totalTasks > 0 ? Math.round((seedsGrown / totalTasks) * 100) : 0;
      const hasUrgent =
        pct === 0 &&
        totalTasks > 0 &&
        related.some(
          (t) =>
            !t.completed &&
            t.due_date &&
            (new Date(t.due_date) <= now || new Date(t.due_date) <= in7Days)
        );
      return { ...mod, seedsGrown, totalTasks, pct, hasUrgent };
    });
  }, [modulesList, allTasks]);

  /* Current Modules: only enrolled modules that have deadlines, max 3; hide section if none */
  const moduleIdsWithDeadlines = useMemo(
    () => new Set((upcomingDeadlines || []).map((d) => String(d.module ?? d.module_id ?? "")).filter(Boolean)),
    [upcomingDeadlines]
  );
  const currentModules = useMemo(() => {
    return (modulesWithSeeds || [])
      .filter((m) => isEnrolledIn(m.id, enrollments) && moduleIdsWithDeadlines.has(String(m.id)))
      .slice(0, 3);
  }, [modulesWithSeeds, enrollments, moduleIdsWithDeadlines]);

  const enrolledModules = useMemo(
    () => (modulesList || []).filter((m) => isEnrolledIn(m.id, enrollments)),
    [modulesList, enrollments]
  );

  // Analytics-derived intelligence
  const peakHours = useMemo(() => getPeakHours(analyticsSummary?.heatmap), [analyticsSummary]);
  const urgencyLevel = useMemo(
    () => getUrgencyLevel(upcomingDeadlines, analyticsProgress),
    [upcomingDeadlines, analyticsProgress]
  );
  const isUrgentOrange = urgencyLevel === "urgent";

  /** Tomorrow's first scheduled event — used in endOfDay Right Now state */
  const tomorrowFirstEvent = useMemo(() => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const events = (allCalEvents || [])
      .filter(e => e.start_time && overlapsDay(new Date(e.start_time), new Date(e.end_time || e.start_time), tomorrow))
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return events[0] ?? null;
  }, [allCalEvents, selectedDate]);

  /** Today vs yesterday scheduled hours — used in endOfDay Right Now state */
  const todayVsYesterday = useMemo(() => {
    const dp = analyticsProgress?.daily_progress;
    if (!dp?.length) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const yestStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const todayEntry = dp.find(d => d.date === todayStr);
    const yestEntry = dp.find(d => d.date === yestStr);
    if (!todayEntry || !yestEntry) return null;
    const diff = Math.round((todayEntry.actual_hours - yestEntry.actual_hours) * 10) / 10;
    if (Math.abs(diff) < 0.1) return { label: "≈ same hours as yesterday", dir: "flat" };
    if (diff > 0) return { label: `↑ ${diff}h more than yesterday`, dir: "up" };
    return { label: `↓ ${Math.abs(diff)}h less than yesterday`, dir: "down" };
  }, [analyticsProgress]);

  /** vs last week: compare today's actual_hours vs same weekday 7 days ago */
  const vsLastWeek = useMemo(() => {
    const dp = analyticsProgress?.daily_progress;
    if (!dp?.length) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastWeekStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const todayEntry = dp.find((d) => d.date === todayStr);
    const lastWeekEntry = dp.find((d) => d.date === lastWeekStr);
    if (!todayEntry || !lastWeekEntry) return null;
    const diff = Math.round((todayEntry.actual_hours - lastWeekEntry.actual_hours) * 10) / 10;
    if (Math.abs(diff) < 0.1) return { label: "≈ same as last week", dir: "flat" };
    if (diff > 0) return { label: `↑ ${diff}h vs last week`, dir: "up" };
    return { label: `↓ ${Math.abs(diff)}h vs last week`, dir: "down" };
  }, [analyticsProgress]);

  const getTaskCategoryPillMeta = useCallback((task) => {
    const listId = task.task_list != null ? String(task.task_list) : null;
    const list = (taskLists || []).find((l) => String(l.id) === listId);
    if (list?.name) return { label: String(list.name).trim().slice(0, 20), listId };
    const modId = task.module_id ?? task.module ?? task.moduleId;
    const mod = (enrolledModules || []).find((m) => String(m.id) === String(modId));
    if (mod) return { label: (mod.module_code || mod.module_name || `M${mod.id}`).toString().trim().slice(0, 8), listId: null };
    if (task.module_code) return { label: String(task.module_code).trim().slice(0, 8), listId: null };
    const tag = getTag && getTag(task.tag);
    if (tag?.label) return { label: String(tag.label).trim().slice(0, 8), listId: null };
    return null;
  }, [taskLists, enrolledModules, getTag]);

  const getTaskCategoryPill = useCallback((task) => {
    const meta = getTaskCategoryPillMeta(task);
    return meta ? meta.label : null;
  }, [getTaskCategoryPillMeta]);

  /** 'sage' = Academic (left border), 'flax' = Personal. */
  const getTaskCategoryColor = useCallback((task) => {
    const tag = getTag && getTag(task.tag);
    const label = (tag?.label || "").toString().toLowerCase();
    if (label.includes("academic")) return "sage";
    if (label.includes("personal")) return "flax";
    if (task.module_id ?? task.module ?? task.moduleId ?? task.module_code) return "sage";
    return "flax";
  }, [getTag]);

  const handleTaskWidgetComplete = useCallback(async (t) => {
    const newCompleted = !t.completed;
    const numericId = typeof t.id === "string" && t.id.startsWith("task-") ? Number(t.id.replace("task-", "")) : t.id;
    try {
      await updateTask(numericId, { completed: newCompleted });
      refetchTasks();
      if (newCompleted) {
        const isRoutine = isRoutineTask(t);
        showCompletionToast(getCompletionMessage(t), { isRoutine });
      }
    } catch {
      setToast("Couldn't update task.");
    }
  }, [showCompletionToast, refetchTasks]);

  // Show toast for 3 seconds
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);



  const sortedEvents = useMemo(
    () => (Array.isArray(dayEvents) ? [...dayEvents] : []).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    [dayEvents]
  );

  const pastItems = useMemo(
    () => sortedEvents.filter((it) => {
      const end = it.end_time || it.start_time;
      return end && new Date(end) < now && !isNow(it.start_time, it.end_time);
    }),
    [sortedEvents, now]
  );

  const upcomingItems = useMemo(() => {
    const pastIds = new Set(pastItems.map((x) => x.id));
    return sortedEvents.filter((it) => !pastIds.has(it.id));
  }, [sortedEvents, pastItems]);

  /* Include overlapping past events in timeline so both show side-by-side in the same time block */
  const upcomingForTimeline = useMemo(() => {
    const upcomingIds = new Set(upcomingItems.map((e) => e.id));
    const pastThatOverlap = pastItems.filter((past) => {
      const pastStart = new Date(past.start_time);
      const pastEnd = new Date(past.end_time || past.start_time);
      return upcomingItems.some((up) => {
        const upStart = new Date(up.start_time);
        const upEnd = new Date(up.end_time || up.start_time);
        return pastEnd > upStart && pastStart < upEnd;
      });
    });
    const combined = [...upcomingItems, ...pastThatOverlap];
    return combined.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [upcomingItems, pastItems]);

  const pastIdsShownInTimeline = useMemo(
    () => new Set(
      pastItems.filter((past) => {
        const pastEnd = new Date(past.end_time || past.start_time);
        return upcomingItems.some((up) => pastEnd > new Date(up.start_time) && new Date(past.start_time) < new Date(up.end_time || up.start_time));
      }).map((p) => p.id)
    ),
    [pastItems, upcomingItems]
  );

  const pastItemsForSection = useMemo(
    () => pastItems.filter((p) => !pastIdsShownInTimeline.has(p.id)),
    [pastItems, pastIdsShownInTimeline]
  );

  /* Missed: past events that were scheduled but not done — show in "Missed" with Re-schedule for tomorrow (today only; exclude system events) */
  const SYSTEM_EVENT_SOURCES = ["module_deadline", "module_enrollment"];
  const missedItems = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    return pastItemsForSection.filter(
      (p) => !p.source || !SYSTEM_EVENT_SOURCES.includes(String(p.source))
    );
  }, [selectedDate, pastItemsForSection]);

  const handleRescheduleTomorrow = useCallback(
    async (item) => {
      try {
        const start = new Date(item.start_time);
        const end = item.end_time ? new Date(item.end_time) : new Date(start.getTime() + 25 * 60000);
        const durationMins = Math.round((end - start) / 60000) || 25;
        const tomorrow = new Date(selectedDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const endTomorrow = new Date(tomorrow.getTime() + durationMins * 60000);
        await addEvent({
          title: item.title,
          description: item.description || "",
          start_time: tomorrow.toISOString(),
          end_time: endTomorrow.toISOString(),
        });
        const baseId = extractBaseEventId(item.id);
        await removeEvent(baseId);
        await loadEvents();
        showToast(`"${item.title}" re-scheduled for tomorrow at 9:00`);
      } catch {
        showToast("Couldn't re-schedule. Try again.");
      } finally {
        refetchTasks();
      }
    },
    [selectedDate, addEvent, removeEvent, loadEvents, showToast, refetchTasks]
  );

  /** Move overdue task to next free slot today, or to tomorrow if none. */
  const handleReschedule = useCallback(
    async (item) => {
      const start = new Date(item.start_time);
      const end = item.end_time ? new Date(item.end_time) : new Date(start.getTime() + 25 * 60000);
      const durationMins = Math.round((end - start) / 60000) || 25;
      const slot = getNextFreeSlotToday(sortedEvents, selectedDate, durationMins);
      if (!slot) {
        await handleRescheduleTomorrow(item);
        return;
      }
      const baseId = extractBaseEventId(item.id);
      const optimisticItem = { ...item, start_time: slot.start.toISOString(), end_time: slot.end.toISOString() };
      // Optimistic update — move event in local state immediately
      removeEvent(item.id);
      addEvent(optimisticItem);
      showToast(`"${item.title}" → ${formatTime(slot.start.toISOString())}`);
      try {
        await editEvent(baseId, {
          start_time: slot.start.toISOString(),
          end_time: slot.end.toISOString(),
        });
        await loadEvents(); // sync with server
      } catch {
        // Rollback optimistic change
        removeEvent(item.id);
        addEvent(item);
        showToast("Couldn't reschedule. Try again.");
      }
    },
    [selectedDate, sortedEvents, editEvent, loadEvents, showToast, handleRescheduleTomorrow, addEvent, removeEvent]
  );

  const handleQuickStartGap = useCallback(
    async (gapStartDate, _gapMins, task) => {
      if (!task) return;
      try {
        const durationMins = (task.estimated_blocks || 1) * 25;
        const endDate = new Date(gapStartDate.getTime() + durationMins * 60000);
        await addEvent({
          title: task.title,
          start_time: gapStartDate.toISOString(),
          end_time: endDate.toISOString(),
          description: task.description || "",
        });
        await loadEvents();
        showToast(`"${task.title}" added to your schedule at ${formatTime(gapStartDate.toISOString())}`);
      } catch {
        showToast("Couldn't add to schedule. Try again.");
      }
    },
    [addEvent, loadEvents, showToast]
  );

  const handleConflictAutoMove = useCallback(
    async (event, newStart, newEnd) => {
      try {
        await editEvent(extractBaseEventId(event.id), {
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
        });
        await loadEvents();
        showToast("Event moved to next available window.");
      } catch {
        showToast("Couldn't move event. Try again.");
      }
    },
    [editEvent, loadEvents, showToast]
  );

  const scheduledTitles = useMemo(
    () => new Set(upcomingItems.map((e) => e.title?.toLowerCase())),
    [upcomingItems]
  );

  const suggestableTasks = useMemo(
    () => dayTasks.filter((t) => !scheduledTitles.has(t.title?.toLowerCase())),
    [dayTasks, scheduledTitles]
  );

  const upcomingTimeline = useMemo(
    () => computeTimelineWithGaps(upcomingForTimeline, suggestableTasks),
    [upcomingForTimeline, suggestableTasks]
  );

  /* Current time as % of visible day (6am–10pm) for timeline now-line; only when viewing today */
  const timelineNowPercent = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const startMins = 6 * 60;
    const endMins = 22 * 60;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (nowMins < startMins) return 0;
    if (nowMins >= endMins) return 100;
    return Math.max(0, Math.min(100, ((nowMins - startMins) / (endMins - startMins)) * 100));
  }, [selectedDate, now]);

  const lectureCount = useMemo(
    () => sortedEvents.filter(isLecture).length,
    [sortedEvents]
  );

  const tasksDueToday = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const now = new Date();
    const filtered = (allTasks || []).filter((t) => {
      const d = t.due_date ? new Date(t.due_date) : null;
      return d && d >= dayStart && d <= dayEnd;
    });
    const isOverdue = (task) => !task.completed && task.due_date && new Date(task.due_date) < now;
    return [...filtered].sort((a, b) => {
      const aOver = isOverdue(a);
      const bOver = isOverdue(b);
      if (aOver && !bOver) return -1;
      if (!aOver && bOver) return 1;
      return 0;
    });
  }, [selectedDate, allTasks]);

  const filteredTasksDueToday = useMemo(() => {
    if (!moduleFilterId) return tasksDueToday;
    const mod = (enrolledModules || []).find((m) => String(m.id) === String(moduleFilterId));
    if (!mod) return tasksDueToday;
    return tasksDueToday.filter(
      (t) =>
        String(t.module_id || t.module || t.moduleId || "") === String(moduleFilterId) ||
        (t.module_code || "").toUpperCase().trim() === (mod.module_code || "").toUpperCase().trim()
    );
  }, [tasksDueToday, moduleFilterId, enrolledModules]);

  /* Live progress: task-based so it updates when checkboxes change or tasks are rescheduled. Routine/event tasks count as "done" when time has passed (auto-pass). */
  const todaysTaskProgress = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const total = tasksDueToday.length;
    const crushed = tasksDueToday.filter(
      (t) => t.completed || isAutoPassedTask(t, now, getTag)
    ).length;
    const percent = total > 0 ? Math.round((crushed / total) * 100) : 0;
    return { total, crushed, percent };
  }, [selectedDate, tasksDueToday, now, getTag]);

  /* Goals Crushed / Seed Growth: only non-routine tasks. Routine events do NOT count. */
  const goalsOnlyProgress = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const goalTasks = tasksDueToday.filter((t) => !isRoutineOrEventTask(t, getTag));
    const total = goalTasks.length;
    const crushed = goalTasks.filter((t) => t.completed).length;
    const percent = total > 0 ? Math.round((crushed / total) * 100) : 0;
    return { total, crushed, percent };
  }, [selectedDate, tasksDueToday, getTag]);

  const motivationMessage = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const p = todaysTaskProgress;
    if (p && p.total > 0) {
      return getMotivationMessage(now, p.total, p.crushed, lectureCount);
    }
    return getMotivationMessage(now, sortedEvents.length, pastItems.length, lectureCount);
  }, [selectedDate, now, sortedEvents.length, pastItems.length, lectureCount, todaysTaskProgress]);

  /** Daily Navigator context: task/gap/conflict/endOfDay, currentBlock, nextItem, gapMins, overlaps, conflictAt. */
  const navigatorContext = useMemo(
    () => getNavigatorContext(now, selectedDate, sortedEvents || [], isToday),
    [now, selectedDate, sortedEvents, isToday]
  );

  const mostUrgentDeadline = useMemo(() => {
    const list = (upcomingDeadlines || []).filter((d) => d.start_due_date);
    if (list.length === 0) return null;
    return [...list].sort((a, b) => new Date(a.start_due_date) - new Date(b.start_due_date))[0];
  }, [upcomingDeadlines]);

  const hasDeadlineWithin24h = useMemo(() => {
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return (upcomingDeadlines || []).some(
      (d) => d.start_due_date && (new Date(d.start_due_date) - nowMs) <= oneDayMs && (new Date(d.start_due_date) - nowMs) >= 0
    );
  }, [upcomingDeadlines]);

  const upcomingDeadlinesCount = useMemo(
    () => (upcomingDeadlines || []).filter(
      (d) => d.start_due_date && (new Date(d.start_due_date) - Date.now()) <= 21 * 24 * 60 * 60 * 1000
    ).length,
    [upcomingDeadlines]
  );

  /** Deadlines within 14 days that have no matching revision/study event already in the calendar. */
  const deadlineSuggestions = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const nowMs = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    const scheduledTitles = (sortedEvents || []).map(e => (e.title || "").toLowerCase());
    return (upcomingDeadlines || [])
      .filter(d => {
        if (!d.start_due_date) return false;
        const ms = new Date(d.start_due_date) - nowMs;
        if (ms <= 0 || ms > fourteenDays) return false;
        // Skip if a calendar event already mentions this deadline's title or module code
        const dTitle = (d.assessment_title || d.title || "").toLowerCase();
        const dCode  = (d.module_code || "").toLowerCase();
        return !scheduledTitles.some(t =>
          (dTitle && t.includes(dTitle.slice(0, 8))) ||
          (dCode  && t.includes(dCode))
        );
      })
      .sort((a, b) => new Date(a.start_due_date) - new Date(b.start_due_date));
  }, [selectedDate, upcomingDeadlines, sortedEvents]);

  const seedsCountFromTasks = useMemo(() => {
    if (!isToday(selectedDate)) return 0;
    const todayStart = new Date(selectedDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(selectedDate);
    todayEnd.setHours(23, 59, 59, 999);
    const dueToday = (t) => {
      const d = t.due_date ? new Date(t.due_date) : null;
      return d && d >= todayStart && d <= todayEnd;
    };
    return (allTasks || []).filter((t) => {
      if (!t.completed) return false;
      const title = (t.title || "").toLowerCase();
      if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title)) return false;
      const completedAt = t.completed_at ?? t.completedAt;
      if (completedAt) return isToday(new Date(completedAt));
      return dueToday(t);
    }).length;
  }, [selectedDate, allTasks]);

  /* Tasks completed per day this week (Mon–Sun) — uses shared lib for Analytics bridge */
  const seedsPerDayThisWeek = useMemo(
    () => getSeedsPerDayThisWeek(allTasks, (t) => isRoutineOrEventTask(t, getTag)),
    [allTasks, getTag]
  );

  const hasOverdueToday = useMemo(() => {
    const now = new Date();
    return tasksDueToday.some(
      (t) =>
        !isRoutineOrEventTask(t, getTag) &&
        !t.completed &&
        t.due_date &&
        new Date(t.due_date) < now
    );
  }, [tasksDueToday, getTag]);

  const overdueTasksForNow = useMemo(() => {
    const now = new Date();
    return (filteredTasksDueToday || [])
      .filter(
        (t) =>
          !isRoutineOrEventTask(t, getTag) &&
          !t.completed &&
          t.due_date &&
          new Date(t.due_date) < now
      )
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [filteredTasksDueToday, getTag]);

  /** Today's task widget: task-only. Only tasks due today — nothing else. */
  const taskWidgetList = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const now = new Date();
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const isDueToday = (t) => {
      const d = t.due_date ? new Date(t.due_date) : null;
      return d && d >= dayStart && d <= dayEnd;
    };

    const tasks = (allTasks || [])
      .filter(
        (t) =>
          !isRoutineOrEventTask(t, getTag) &&
          isDueToday(t)
      )
      .map((t) => {
        const due = t.due_date ? new Date(t.due_date) : null;
        const isOverdue = due && due < now && !t.completed;
        let taskWidgetStatus = "upcoming";
        if (t.completed) taskWidgetStatus = "completed";
        else if (isOverdue) taskWidgetStatus = "overdue";
        return {
          type: "task",
          id: `task-${t.id}`,
          sortTime: due || dayEnd,
          endTime: due ? new Date(due.getTime() + (t.estimated_blocks || 1) * 25 * 60000) : dayEnd,
          isOverdue,
          taskWidgetStatus,
          ...t,
        };
      });

    const futureTasks = tasks.filter((t) => !t.completed && t.sortTime >= now && t.sortTime <= dayEnd);
    const nowTask = futureTasks.sort(
      (a, b) => new Date(a.sortTime).getTime() - new Date(b.sortTime).getTime()
    )[0];
    if (nowTask) nowTask.taskWidgetStatus = "now";

    const order = (a, b) => {
      const statusOrder = { overdue: 0, now: 1, upcoming: 2, completed: 3 };
      return (statusOrder[a.taskWidgetStatus] ?? 2) - (statusOrder[b.taskWidgetStatus] ?? 2);
    };
    return [...tasks].sort(order).slice(0, 5);
  }, [selectedDate, allTasks, getTag]);

  /** Task-only: no events. */
  const taskWidgetItemsOnly = useMemo(
    () => taskWidgetList.filter((i) => i.type === "task"),
    [taskWidgetList]
  );
  const taskWidgetAllDone = useMemo(
    () =>
      taskWidgetItemsOnly.length === 0 ||
      taskWidgetItemsOnly.every((i) => i.completed),
    [taskWidgetItemsOnly]
  );
  const taskWidgetCompletedCount = useMemo(
    () => taskWidgetItemsOnly.filter((i) => i.completed).length,
    [taskWidgetItemsOnly]
  );
  const taskWidgetSpineCompletedPct =
    taskWidgetItemsOnly.length > 0 ? (taskWidgetCompletedCount / taskWidgetItemsOnly.length) * 100 : 0;
  const taskWidgetRemainingCount = taskWidgetItemsOnly.filter((i) => !i.completed).length;
  const slot1Meta = isToday(selectedDate) && taskWidgetItemsOnly.length > 0
    ? `${taskWidgetRemainingCount} due · ${Math.round(taskWidgetSpineCompletedPct)}% done`
    : null;

  /** On-track / ahead / behind based on % done vs % of workday elapsed. */
  const dayProgressStatus = useMemo(() => {
    if (!isToday(selectedDate) || taskWidgetItemsOnly.length === 0) return null;
    const workdayStart = 9;
    const workdayEnd = 21;
    const nowH = now.getHours() + now.getMinutes() / 60;
    if (nowH < workdayStart || nowH >= workdayEnd) return null;
    const elapsed = ((nowH - workdayStart) / (workdayEnd - workdayStart)) * 100;
    const done = taskWidgetSpineCompletedPct;
    if (done >= elapsed + 15) return "ahead";
    if (done >= elapsed - 15) return "ontrack";
    return "behind";
  }, [selectedDate, now, taskWidgetItemsOnly.length, taskWidgetSpineCompletedPct]);

  const dayProgressCountRef = useCountUp(Math.round(taskWidgetSpineCompletedPct));

  /** Today's free windows from schedule (>= 20 min, chronological). */
  const todayFreeWindows = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    return getAllFreeWindowsToday(sortedEvents, selectedDate)
      .filter((w) => w.minutes >= 20)
      .sort((a, b) => a.start - b.start);
  }, [selectedDate, sortedEvents]);

  /** Focus Windows summary: total free time + count for today */
  const focusSummary = useMemo(() => {
    if (!isToday(selectedDate) || !todayFreeWindows.length) return null;
    const totalMins = todayFreeWindows.reduce((s, w) => s + w.minutes, 0);
    const h = Math.floor(totalMins / 60);
    const m = Math.round(totalMins % 60);
    const durLabel = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
    return { count: todayFreeWindows.length, durLabel };
  }, [selectedDate, todayFreeWindows]);

  /** Most urgent incomplete task for focus suggestion. */
  const topActionTask = useMemo(() => {
    const incomplete = taskWidgetItemsOnly.filter((t) => !t.completed);
    return (
      incomplete.find((t) => t.taskWidgetStatus === "overdue") ||
      incomplete.find((t) => t.taskWidgetStatus === "now") ||
      incomplete[0] ||
      null
    );
  }, [taskWidgetItemsOnly]);

  /** Smart nudge: pairs the nearest urgent deadline (≤ 24h) with the next free window. */
  const smartNudge = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const nowMs = now.getTime();
    const nextWindow = todayFreeWindows.find((w) => w.end.getTime() > nowMs);
    if (!nextWindow) return null;

    const windowMins = nextWindow.minutes;
    const minsRounded = Math.round(windowMins);
    const winLabel =
      minsRounded >= 60
        ? `${Math.floor(minsRounded / 60)}h${minsRounded % 60 > 0 ? ` ${minsRounded % 60}m` : ""}`
        : `${minsRounded}m`;
    const winStart = formatTime(nextWindow.start.toISOString());

    // Priority 1: deadline due within 24h
    const urgentDeadline = [...(upcomingDeadlines || [])]
      .filter((d) => {
        if (!d.start_due_date) return false;
        const ms = new Date(d.start_due_date) - nowMs;
        return ms > 0 && ms <= 24 * 3600000;
      })
      .sort((a, b) => new Date(a.start_due_date) - new Date(b.start_due_date))[0];

    if (urgentDeadline) {
      const msUntilDue = new Date(urgentDeadline.start_due_date) - nowMs;
      const h = Math.floor(msUntilDue / 3600000);
      const m = Math.floor((msUntilDue % 3600000) / 60000);
      const dueIn = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
      return {
        type: "deadline",
        taskTitle: urgentDeadline.title || urgentDeadline.name || "Deadline",
        dueIn,
        winLabel,
        winStart,
      };
    }

    // Priority 2: top incomplete task + free window
    if (topActionTask) {
      return { type: "task", taskTitle: topActionTask.title, winLabel, winStart };
    }

    return null;
  }, [selectedDate, isToday, now, todayFreeWindows, upcomingDeadlines, topActionTask]);

  /** TFL context: next upcoming event so the delay pill can say "leave by 18:50 for Dinner with Mum". */
  const tflContext = useMemo(() => {
    if (!isToday(selectedDate) || !sortedEvents?.length) return null;
    const nowMs = now.getTime();
    const DELAY_MINS = 10; // conservative buffer applied when any TFL delay is active
    const nextEvent = [...sortedEvents]
      .filter(e => e.start_time && new Date(e.start_time).getTime() > nowMs)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0];
    if (!nextEvent) return null;
    const leaveByMs = new Date(nextEvent.start_time).getTime() - DELAY_MINS * 60000;
    const leaveStr = new Date(leaveByMs).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return { eventTitle: nextEvent.title || "next event", leaveStr };
  }, [selectedDate, isToday, now, sortedEvents]);

  /** Schedule-aware one-liner shown below the status pills in the greeting header. */
  const scheduleInsight = useMemo(() => {
    if (!isToday(selectedDate) || !sortedEvents?.length) return null;
    const todayEvs = sortedEvents.filter(e => e.start_time && e.end_time);
    const lectureCount = todayEvs.filter(e =>
      /lecture|seminar|tutorial|lab/i.test(e.title || "")
    ).length;
    const totalMins = todayEvs.reduce((acc, e) => {
      const m = Math.round((new Date(e.end_time) - new Date(e.start_time)) / 60000);
      return acc + Math.max(0, m);
    }, 0);
    const sorted = [...todayEvs].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    let hasBackToBack = false;
    for (let i = 1; i < sorted.length; i++) {
      const gap = (new Date(sorted[i].start_time) - new Date(sorted[i - 1].end_time)) / 60000;
      if (gap >= 0 && gap < 10) { hasBackToBack = true; break; }
    }
    const hour = now.getHours();
    if (lectureCount >= 2 && hasBackToBack) {
      return `${lectureCount} lectures today with back-to-back sessions — remember to take breaks`;
    }
    if (lectureCount >= 1) {
      return `${lectureCount} lecture${lectureCount > 1 ? "s" : ""} today · ${todayFreeWindows.length} free window${todayFreeWindows.length !== 1 ? "s" : ""} to study`;
    }
    if (totalMins >= 360) {
      return `Packed day — ${Math.round(totalMins / 60)}h scheduled · guard your energy`;
    }
    if (hour >= 21 && taskWidgetRemainingCount > 0) {
      return `It's late — ${taskWidgetRemainingCount} task${taskWidgetRemainingCount !== 1 ? "s" : ""} remaining. Prioritise sleep if needed`;
    }
    if (todayFreeWindows.length >= 3) {
      return `Light schedule today — ${todayFreeWindows.length} windows to make real progress`;
    }
    return null;
  }, [selectedDate, isToday, sortedEvents, todayFreeWindows, now, taskWidgetRemainingCount]);

  /** Focus hours: task-based (estimated work for task widget only). */
  const taskWidgetFocusHours = useMemo(() => {
    const totalMins = taskWidgetList
      .filter((t) => !t.completed)
      .reduce((acc, t) => acc + (t.estimated_blocks || 1) * 25, 0);
    return totalMins / 60;
  }, [taskWidgetList]);

  /** Overdue count (incomplete tasks past due). */
  const taskWidgetOverdueCount = useMemo(
    () => taskWidgetItemsOnly.filter((i) => !i.completed && i.taskWidgetStatus === "overdue").length,
    [taskWidgetItemsOnly]
  );

  /** Status strip for IntelligenceRow header — smart schedule + task awareness */
  const navStatusStrip = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const nav = navigatorContext;

    // 1. Schedule conflict — always top priority
    if (nav.state === "conflict") {
      const timeStr = nav.conflictAt
        ? new Date(nav.conflictAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        : null;
      return { variant: "Conflict", text: `Warning: Schedule overlap${timeStr ? ` at ${timeStr}` : ""}` };
    }

    // 2. Overdue tasks — urgent, warm red
    if (taskWidgetOverdueCount > 0) {
      if (taskWidgetOverdueCount === 1 && topActionTask) {
        return { variant: "Conflict", text: `⚠ Running behind — focus on ${topActionTask.title}` };
      }
      return { variant: "Conflict", text: `⚠ ${taskWidgetOverdueCount} tasks overdue` };
    }

    // 3. Currently in a scheduled event/task
    if (nav.state === "task" && nav.currentBlock?.title) {
      return { variant: "Task", text: `Now: ${nav.currentBlock.title}` };
    }

    // 4. Free gap — show it
    if (nav.state === "gap" && (nav.gapMins ?? 0) >= 15) {
      return { variant: "Gap", text: `Free window · ${nav.gapMins}m until ${nav.nextItem?.title || "next item"}` };
    }

    // 5. Morning — day hasn't started yet
    if (nav.state === "beforeDay") {
      const firstEvent = sortedEvents?.[0];
      if (firstEvent?.title && firstEvent.start_time) {
        const timeStr = new Date(firstEvent.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        return { variant: "Gap", text: `Your day starts with ${firstEvent.title} at ${timeStr}` };
      }
      return null;
    }

    // 6. All events done but tasks still remain
    const allEventsDone =
      (sortedEvents?.length ?? 0) > 0 &&
      sortedEvents.every(e => !e.end_time || new Date(e.end_time).getTime() < now.getTime());
    if (allEventsDone && taskWidgetRemainingCount > 0) {
      return {
        variant: "Gap",
        text: `Events done for today · ${taskWidgetRemainingCount} task${taskWidgetRemainingCount !== 1 ? "s" : ""} still need attention`,
      };
    }

    // 7. Everything done / end of day
    if (nav.state === "endOfDay" || (allEventsDone && taskWidgetRemainingCount === 0)) {
      return { variant: "", text: "All clear — great work today ✓" };
    }

    return null;
  }, [navigatorContext, selectedDate, isToday, taskWidgetOverdueCount, topActionTask, taskWidgetRemainingCount, sortedEvents, now]);

  /** Time allocation by category for today's events (Day Progress bar chart). */
  const dayTimeAllocation = useMemo(() => {
    if (!isToday(selectedDate) || !sortedEvents?.length) return null;
    const buckets = { study: 0, personal: 0, other: 0 };
    sortedEvents.forEach((e) => {
      if (!e.start_time || !e.end_time) return;
      const mins = Math.round((new Date(e.end_time) - new Date(e.start_time)) / 60000);
      if (mins <= 0) return;
      const t = (e.title || "").toLowerCase();
      if (/lecture|study|library|revision|seminar|tutorial|lab|coursework/.test(t)) {
        buckets.study += mins;
      } else if (/gym|yoga|run|breakfast|lunch|dinner|wellness|walk/.test(t)) {
        buckets.personal += mins;
      } else {
        buckets.other += mins;
      }
    });
    const total = buckets.study + buckets.personal + buckets.other;
    return total > 0 ? { ...buckets, total } : null;
  }, [selectedDate, sortedEvents]);

  /** Dynamic status line text. */
  const taskWidgetStatusLine = useMemo(() => {
    if (taskWidgetItemsOnly.length === 0 || taskWidgetRemainingCount === 0) return "All clear! Ready to wrap up?";
    if (taskWidgetOverdueCount > 0) return `You have ${taskWidgetOverdueCount} item${taskWidgetOverdueCount === 1 ? "" : "s"} behind schedule. Tackle these first?`;
    return "You are perfectly on schedule for today.";
  }, [taskWidgetItemsOnly.length, taskWidgetRemainingCount, taskWidgetOverdueCount]);

  /** Smart Re-plan: move missed (non-routine) events and overdue tasks into nearest future free windows today. */
  const [replanLoading, setReplanLoading] = useState(false);
  const handleReplanDay = useCallback(async () => {
    const missedTasksOnly = missedItems.filter((item) => !isRoutineEvent(item));
    const overdueTasks = overdueTasksForNow || [];
    const hasMissed = missedTasksOnly.length > 0;
    const hasOverdueTasks = overdueTasks.length > 0;
    if (!hasMissed && !hasOverdueTasks) {
      showToast("Nothing to re-plan.");
      return;
    }
    const windows = getAllFreeWindowsToday(sortedEvents, selectedDate);
    if (windows.length === 0) {
      showToast("No free windows left today. Try re-scheduling for tomorrow.");
      return;
    }
    setReplanLoading(true);
    try {
      const windowCopies = windows.map((w) => ({
        start: new Date(w.start.getTime()),
        end: new Date(w.end.getTime()),
        minutes: w.minutes,
      }));
      let assignedCount = 0;
      for (const item of [...missedTasksOnly].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))) {
        const end = item.end_time ? new Date(item.end_time) : new Date(item.start_time);
        const durationMins = Math.round((end - new Date(item.start_time)) / 60000) || 25;
        const win = windowCopies.find((w) => w.minutes >= durationMins);
        if (!win) continue;
        const slotStart = new Date(win.start.getTime());
        const slotEnd = new Date(win.start.getTime() + durationMins * 60000);
        await editEvent(extractBaseEventId(item.id), {
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
        });
        win.start = slotEnd;
        win.minutes -= durationMins;
        assignedCount += 1;
      }
      for (const task of overdueTasks) {
        const durationMins = (task.estimated_blocks || 1) * 25;
        const win = windowCopies.find((w) => w.minutes >= durationMins);
        if (!win) continue;
        const slotStart = new Date(win.start.getTime());
        const slotEnd = new Date(win.start.getTime() + durationMins * 60000);
        await addEvent({
          title: task.title,
          description: task.description || "",
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
        });
        win.start = slotEnd;
        win.minutes -= durationMins;
        assignedCount += 1;
      }
      await loadEvents();
      refetchTasks();
      showToast(
        assignedCount > 0
          ? `Re-planned ${assignedCount} item${assignedCount === 1 ? "" : "s"} into your day.`
          : "No items could fit in remaining windows."
      );
    } catch {
      showToast("Couldn't re-plan. Try again.");
    } finally {
      setReplanLoading(false);
    }
  }, [missedItems, overdueTasksForNow, sortedEvents, selectedDate, editEvent, addEvent, loadEvents, showToast, refetchTasks]);

  const prevSeedsCountRef = useRef(seedsCountFromTasks);
  const [seedsBounce, setSeedsBounce] = useState(false);
  useEffect(() => {
    if (!isToday(selectedDate)) return;
    try {
      if (localStorage.getItem("evolution_sapling_seen") === "1") return;
    } catch (_) {}
    if (seedsCountFromTasks > prevSeedsCountRef.current) {
      const prev = prevSeedsCountRef.current;
      if (getSaplingCelebrationCrossed(prev, seedsCountFromTasks)) {
        showLevelUpToast(getSaplingCelebrationMessage());
        try {
          localStorage.setItem("evolution_sapling_seen", "1");
        } catch (_) {}
      } else {
        const threshold = getLevelUpThresholdCrossed(prev, seedsCountFromTasks);
        if (threshold) showLevelUpToast(getLevelUpMessageForThreshold(threshold));
      }
      setSeedsBounce(true);
      const t = setTimeout(() => setSeedsBounce(false), 500);
      prevSeedsCountRef.current = seedsCountFromTasks;
      return () => clearTimeout(t);
    } else {
      prevSeedsCountRef.current = seedsCountFromTasks;
    }
  }, [seedsCountFromTasks, selectedDate, showLevelUpToast]);

  const handleTaskToggle = useCallback(
    async (task, completed) => {
      const markingComplete = completed === true;
      const isRoutine = isRoutineTask(task);
      if (markingComplete) {
        if (!isRoutine) setCelebratingTaskId(task.id);
        showCompletionToast(getCompletionMessage(task), { isRoutine });
        if (!isRoutine) setTimeout(() => setCelebratingTaskId(null), 500);
      }
      try {
        await updateTask(task.id, { completed });
        refetchTasks();
      } catch (_) {}
    },
    [refetchTasks, showCompletionToast]
  );

  const fmtTimerSecs = (s) => {
    const t = Math.max(0, s);
    return `${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className={`${styles.page} ${hasTimerSession ? styles.focusModeActive : ""}`}>
      {toast && (
    <div className={styles.alertToast}>
      <div className={styles.alertContent}>
        <span className={styles.alertIcon}>✓</span>
        <span className={styles.alertMessage}>{toast}</span>
      </div>
      <button className={styles.alertClose} onClick={() => setToast(null)}>✕</button>
    </div>
  )}

      <div>
      {/* Active focus session banner */}
      {hasTimerSession && (
        <div className={styles.focusBanner}>
          <div className={styles.focusBannerLeft}>
            <span className={`${styles.focusBannerBadge} ${timerMode === "break" ? styles.focusBannerBadgeBreak : ""}`}>
              {timerMode === "break" ? "BREAK" : "FOCUS"}
            </span>
            {timerTask && <span className={styles.focusBannerTask}>{timerTask}</span>}
          </div>
          <div className={styles.focusBannerRight}>
            <span className={styles.focusBannerTime}>{fmtTimerSecs(timeLeft)}</span>
            <button type="button" className={styles.focusBannerBtn} onClick={() => navigate("/timer")}>
              Open timer →
            </button>
          </div>
        </div>
      )}

      {/* Intelligence Row — Monochrome Bento with real time-management data */}
      <div className={styles.intelligenceRowWrap}>
      <IntelligenceRow
        displayName={displayName}
        taskCount={taskWidgetRemainingCount}
        hasOverdue={taskWidgetOverdueCount > 0}
        statusStrip={navStatusStrip}
        scheduleInsight={scheduleInsight}
        tflContext={tflContext}
        slot1Meta={slot1Meta}
        slot1TaskWidget={
          <TaskWidgetSlot
            styles={taskWidgetStyles}
            displayName={displayName}
            isToday={isToday(selectedDate)}
            taskWidgetOverdueCount={taskWidgetOverdueCount}
            taskWidgetRemainingCount={taskWidgetRemainingCount}
            taskWidgetSpineCompletedPct={taskWidgetSpineCompletedPct}
            taskWidgetItemsOnly={taskWidgetItemsOnly}
            taskWidgetList={taskWidgetList}
            showAllTaskWidgetTasks={showAllTaskWidgetTasks}
            setShowAllTaskWidgetTasks={setShowAllTaskWidgetTasks}
            getTaskCategoryPill={getTaskCategoryPill}
            getTaskCategoryColor={getTaskCategoryColor}
            handleTaskWidgetComplete={handleTaskWidgetComplete}
            taskWidgetRef={taskWidgetRef}
            hasTimerSession={hasTimerSession}
            onStartFocus={() => navigate("/timer", { state: { fromTaskPlay: true } })}
          />
        }
        daySummary={isToday(selectedDate) ? {
          pct: taskWidgetSpineCompletedPct,
          done: taskWidgetCompletedCount,
          total: taskWidgetItemsOnly.length,
          remaining: taskWidgetRemainingCount,
          overdue: taskWidgetOverdueCount,
          status: dayProgressStatus,
          streak: analyticsSummary?.summary?.current_streak_days ?? 0,
        } : null}
        slot3Urgent={
          <DeadlinesWidget
            deadlines={upcomingDeadlines || []}
            onSelectDeadline={setSelectedDeadline}
          />
        }
        slot4Energy={
          !isToday(selectedDate) ? (
            <p className={styles.intRowSlotText}>Select today to see study windows</p>
          ) : (
            <FocusWindowsWidget
              windows={todayFreeWindows}
              now={now}
              onViewAnalytics={() => goToNav?.("analytics")}
              onStartFocus={() => navigate("/timer")}
            />
          )
        }
        slot5Data={{
          now,
          isToday: isToday(selectedDate),
          navigatorContext,
          sortedEvents,
          scheduleCountdownSecs,
          statusStrip: navStatusStrip,
          hasTimerSession,
          timerMode,
          timeLeft,
          workTime,
          breakTime,
          timerTask,
          tomorrowFirstEvent,
          todayVsYesterday,
          taskWidgetItemsOnly,
        }}
      />
      </div>

      {/* Deadline detail peek overlay */}
      {selectedDeadline && (
        <div className={styles.deadlineDetailOverlay} onClick={() => setSelectedDeadline(null)} role="dialog" aria-modal>
          <div className={styles.deadlineDetailCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deadlineDetailHeader}>
              <div className={styles.deadlineDetailPills}>
                {selectedDeadline.module_code && (
                  <span className={styles.intRowDeadlinePill}>{selectedDeadline.module_code}</span>
                )}
                {selectedDeadline.deadline_type && (
                  <span className={`${styles.intRowDeadlinePill} ${styles.intRowDeadlinePillType}`}>
                    {selectedDeadline.deadline_type.charAt(0).toUpperCase() + selectedDeadline.deadline_type.slice(1)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.deadlineDetailClose}
                onClick={() => setSelectedDeadline(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className={styles.deadlineDetailTitle}>
              {selectedDeadline.assessment_title || selectedDeadline.title || "Assignment"}
            </p>
            {selectedDeadline.start_due_date && (
              <p className={styles.deadlineDetailDate}>
                Due: {new Date(selectedDeadline.start_due_date).toLocaleDateString("en-GB", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            )}
            {selectedDeadline.description && (
              <p className={styles.deadlineDetailDesc}>{selectedDeadline.description}</p>
            )}
            {selectedDeadline.location && (
              <p className={styles.deadlineDetailMeta}>📍 {selectedDeadline.location}</p>
            )}
            {(selectedDeadline.module_id ?? selectedDeadline.module) && (
              <Link
                to={`/modules?moduleId=${selectedDeadline.module_id ?? selectedDeadline.module}`}
                className={styles.deadlineDetailLink}
                onClick={() => setSelectedDeadline(null)}
              >
                Go to module →
              </Link>
            )}
            {!(selectedDeadline.module_id ?? selectedDeadline.module) && selectedDeadline.module_code && (
              <Link
                to={`/modules?code=${encodeURIComponent(selectedDeadline.module_code)}`}
                className={styles.deadlineDetailLink}
                onClick={() => setSelectedDeadline(null)}
              >
                Go to module →
              </Link>
            )}
          </div>
        </div>
      )}
      </div>

      {showCreateTaskModal && (
        <CreateTaskModal
          lists={taskLists}
          modules={enrolledModules}
          onOpenCreateList={() => setShowCreateListFromTask(true)}
          newListIdCreated={lastCreatedListId}
          onSave={async (data, opts) => {
            try {
              const dataToSend = { ...data };
              const titleLower = (data.title || "").toLowerCase();
              if (/breakfast|lunch|dinner|sleep|brunch|coffee|meal\s*prep/i.test(titleLower)) {
                const routineTag = (tags || []).find((t) => (t.label || t.name) === "Routine");
                if (routineTag) dataToSend.tag = routineTag.id;
              }
              const created = await createTask(dataToSend);
              refetchTasks();
              if (opts?.addToSchedule && created) {
                const start = new Date(selectedDate);
                start.setHours(9, 0, 0, 0);
                const mins = (data.estimated_blocks || 1) * 25;
                const end = new Date(start.getTime() + mins * 60000);
                await addEvent({
                  title: created.title,
                  start_time: start.toISOString(),
                  end_time: end.toISOString(),
                  description: created.description || "",
                });
              }
              showToast(opts?.addToSchedule && created ? `"${created.title}" added to today's schedule` : "Task added");
            } catch {
              showToast("Couldn't add task. Try again.");
            }
            setShowCreateTaskModal(false);
          }}
          onClose={() => { setShowCreateTaskModal(false); setLastCreatedListId(null); }}
          showAddToScheduleToggle={isToday(selectedDate)}
          addToScheduleLabel="Add to today's schedule"
        />
      )}

      {showCreateListFromTask && (
        <CreateListModal
          onSave={async (data) => {
            const created = await createTaskList(data);
            const list = await fetchTaskLists();
            setTaskLists(Array.isArray(list) ? list : []);
            if (created?.id) setLastCreatedListId(created.id);
            setShowCreateListFromTask(false);
          }}
          onClose={() => setShowCreateListFromTask(false)}
        />
      )}

      {rescheduleTask && (
        <EditTaskModal
          task={rescheduleTask}
          onSave={async (data) => {
            try {
              await updateTask(rescheduleTask.id, data);
              refetchTasks();
              setRescheduleTask(null);
            } catch (_) {}
          }}
          onDelete={async () => {
            try {
              await deleteTask(rescheduleTask.id);
              refetchTasks();
              setRescheduleTask(null);
            } catch (_) {}
          }}
          onClose={() => setRescheduleTask(null)}
        />
      )}
    </div>
  );
}