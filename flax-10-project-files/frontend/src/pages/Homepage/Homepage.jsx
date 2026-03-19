import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Calendar as CalendarIcon, MapPin, X } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";

import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
import {
  useCalendar,
  useCalendarDispatch,
  useEventModal,
  useEventPopup,
} from "../../context/CalendarContext";
import {
  useCalendarEvents,
  useEventActions,
} from "../../components/Calendar/hooks/useCalendarEvents";
import { updateTask, createTask, fetchTaskLists, createTaskList, deleteTask } from "../../api/taskService";
import { useTags } from "../../context/TagContext";
import { extractBaseEventId } from "../../components/Calendar/utils/eventUtils";
import { getModules, getEnrollments } from "../../api/moduleApi";
import { getUpcomingDeadlines } from "../../api/deadlineApi";
import { isEnrolledIn } from "../../components/Modules/utils/moduleUtils";
import { useTimerContext } from "../../context/TimerContext";
import { useTaskCompletion } from "../../context/TaskCompletionContext";
import { useToast } from "../../context/ToastContext";
import { getCompletionMessage, isRoutineTask } from "../../lib/completionMessages";
import { playCompletionChime } from "../../lib/sounds";

import CreateTaskModal from "../Tasks/components/CreateTaskModal";
import CreateListModal from "../Tasks/components/CreateListModal";
import { EditTaskModal } from "../Tasks/components/TaskCard";
import IntelligenceRow from "./components/IntelligenceRow";
import styles from "./Homepage.module.css";

import {
  formatTime,
  isNow,
  isRoutineEvent,
  getNavigatorContext,
  getNextFreeSlotToday,
  getAllFreeWindowsToday,
  isRoutineOrEventTask,
} from "./utils/index";
import { useHomeData } from "./hooks/useHomeData";
import { MiniTimeline } from "./components";
import { TaskWidgetSlot } from "./components/TaskWidgetSlot";
import taskWidgetStyles from "./styles/TaskWidget.module.css";
import { PlanReadDetailModal } from "./components/PlanReadDetailModal";
import { DeadlinesWidget } from "./components/DeadlinesWidget";
import { ModulePill, TypePill, getModulePillColors } from "./components/ModulePill";
import SleepBanner from "./components/SleepBanner";
import { EventPopups } from "../../components/Calendar/EventPopups";
import { BackToTop } from "../../components/Pagination/Pagination";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";

function HomepageSkeleton() {
  return (
    <div className={styles.routeSkeleton} aria-busy="true">
      <div className={styles.routeSkeletonTop}>
        <SkeletonBlock className={styles.routeSkeletonBanner} />
        <div className={styles.routeSkeletonGrid}>
          <SkeletonBlock className={styles.routeSkeletonCardLarge} />
          <SkeletonBlock className={styles.routeSkeletonCardLarge} />
          <SkeletonBlock className={styles.routeSkeletonCardMedium} />
        </div>
      </div>
      <div className={styles.routeSkeletonTimeline}>
        <div className={styles.routeSkeletonTimelineHeader}>
          <SkeletonBlock className={styles.routeSkeletonTimelineTitle} />
          <SkeletonBlock className={styles.routeSkeletonTimelineAction} />
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={styles.routeSkeletonTimelineRow}>
            <SkeletonBlock className={styles.routeSkeletonTime} />
            <SkeletonBlock className={styles.routeSkeletonEvent} />
          </div>
        ))}
      </div>
    </div>
  );
}


/* HOME PAGE */
export default function Homepage({ defaultShowCreateTaskModal = false, defaultPlanTimelineReadItem = null }) {
  const navigate = useNavigate();
  const { selectedDate, events: allCalEvents } = useCalendar();
  const dispatch = useCalendarDispatch();
  const { loadEvents } = useCalendarEvents();
  const { removeEvent, addEvent, editEvent } = useEventActions();
  const { openModal } = useEventModal();
  const { openPopup } = useEventPopup();
  const { getTag, tags } = useTags();
  const { isActive: timerActive, timeLeft, task: timerTask, mode: timerMode, workTime, breakTime } = useTimerContext();
  const hasTimerSession = timerActive;

  const { showCompletionToast } = useTaskCompletion();

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

  const toastApi = useToast();
  const toastTimeoutRef = useRef(null);
  const [fallbackToast, setFallbackToast] = useState(null);
  const showToast = useMemo(() => {
    if (typeof toastApi === "function") return toastApi;
    if (typeof toastApi?.showToast === "function") return toastApi.showToast;
    return (message, opts = {}) => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setFallbackToast({
        message,
        actionLabel: opts.actionLabel || null,
        onAction: typeof opts.onAction === "function" ? opts.onAction : null,
      });
      const duration = Number.isFinite(opts.durationMs) ? opts.durationMs : 3200;
      toastTimeoutRef.current = setTimeout(() => {
        setFallbackToast(null);
        toastTimeoutRef.current = null;
      }, duration);
    };
  }, [toastApi]);
  const { dayEvents, dayTasks, allTasks, removePendingTask, refetchTasks, loading: homeDataLoading } = useHomeData(selectedDate);
  const [modulesList, setModulesList] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(defaultShowCreateTaskModal);
  const [showCreateListFromTask, setShowCreateListFromTask] = useState(false);
  const [lastCreatedListId, setLastCreatedListId] = useState(null);
  const [rescheduleTask, setRescheduleTask] = useState(null);
  const [planTimelineReadItem, setPlanTimelineReadItem] = useState(defaultPlanTimelineReadItem);
  const prevTimeLeftRef = useRef(null);
  const [taskLists, setTaskLists] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [showAllTaskWidgetTasks, setShowAllTaskWidgetTasks] = useState(false);
  const taskWidgetRef = useRef(null);
  const [selectedDeadline, setSelectedDeadline] = useState(null);
  const [selectedModulePill, setSelectedModulePill] = useState(null); // { code, id, name? }

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  }, []);

  /* Today-first: always show today on Homepage — removes choice paralysis */
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dispatch({ type: "SET_SELECTED_DATE", payload: today });
  }, [dispatch]);

  /* Homepage reliability: re-fetch once after initial date set if events are still empty. */
  useEffect(() => {
    const id = setTimeout(() => {
      if ((allCalEvents || []).length === 0) loadEvents();
    }, 220);
    return () => clearTimeout(id);
  }, [selectedDate, allCalEvents, loadEvents]);

  /* Live Compass: recalc every 10s so the NOW line moves without refresh */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000);
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



  /* When work timer hits 0 in the NOW widget: soft chime */
  useEffect(() => {
    if (hasTimerSession && timerMode === "work" && prevTimeLeftRef.current > 0 && timeLeft === 0) {
      playCompletionChime(0.35);
    }
    prevTimeLeftRef.current = timeLeft;
  }, [hasTimerSession, timerMode, timeLeft]);

  useEffect(() => {
    if (showCreateTaskModal) {
      fetchTaskLists().then((list) => setTaskLists(Array.isArray(list) ? list : [])).catch(() => setTaskLists([]));
    }
  }, [showCreateTaskModal]);



  const enrolledModules = useMemo(
    () => (modulesList || []).filter((m) => isEnrolledIn(m.id, enrollments)),
    [modulesList, enrollments]
  );


  /** Tomorrow's first scheduled event — used in endOfDay Right Now state */
  const tomorrowFirstEvent = useMemo(() => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const events = (allCalEvents || [])
      .filter(e => e.start_time && overlapsDay(new Date(e.start_time), new Date(e.end_time || e.start_time), tomorrow))
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return events[0] ?? null;
  }, [allCalEvents, selectedDate]);



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
    const isRoutine = isRoutineTask(t);
    const completionMessage = getCompletionMessage(t);

    if (newCompleted) {
      try {
        showCompletionToast(completionMessage, { isRoutine });
      } catch (_) { }
    }

    if (newCompleted) {
      removePendingTask(numericId);
    }

    try {
      await updateTask(numericId, { completed: newCompleted });
    } catch {
      const refreshedTasks = await refetchTasks();
      const taskStillIncomplete = (refreshedTasks || []).some((task) =>
        String(task?.id) === String(numericId) && !task.completed
      );
      if (taskStillIncomplete) {
        showToast("Couldn't update task.");
      }
      return;
    }

    refetchTasks();

    if (newCompleted) {
      if (!isRoutine) {
        try {
          const w = /** @type {any} */ (window);
          const AudioCtx = w.AudioContext || w.webkitAudioContext;
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(520, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.06);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
        } catch (_) { }
      }
    }
  }, [showCompletionToast, removePendingTask, refetchTasks]);



  const sortedEvents = useMemo(() => {
    const seen = new Set();
    const mealTitles = ["breakfast", "lunch", "dinner"];
    const deduped = dayEvents.filter((e) => {
      const title = (e.title || "").trim().toLowerCase();
      const start = e.start_time ? new Date(e.start_time) : null;
      if (!start) return true;
      const dayKey = start.toISOString().slice(0, 10);
      if (mealTitles.includes(title)) {
        const key = `${dayKey}:${title}`;
        if (seen.has(key)) return false;
        seen.add(key);
      }
      return true;
    });
    return [...deduped].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [dayEvents]);

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
    async (gapStartDate, _gapMins, task, nextTask) => {
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
        showToast(`"${task.title}" added to your schedule.`);
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

  const handleConflictPushTomorrow = useCallback(
    async (event) => {
      if (!event?.start_time) return;
      try {
        const baseId = extractBaseEventId(event.id);
        const start = new Date(event.start_time);
        const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 25 * 60000);
        const durationMins = Math.max(25, Math.round((end - start) / 60000) || 25);
        const nextDay = new Date(start);
        nextDay.setDate(nextDay.getDate() + 1);
        const movedStart = nextDay;
        const movedEnd = new Date(movedStart.getTime() + durationMins * 60000);
        await editEvent(baseId, {
          start_time: movedStart.toISOString(),
          end_time: movedEnd.toISOString(),
        });
        await loadEvents();
        showToast(`"${event.title}" moved to tomorrow.`, {
          actionLabel: "Undo",
          durationMs: 7000,
          onAction: async () => {
            try {
              await editEvent(baseId, {
                start_time: start.toISOString(),
                end_time: end.toISOString(),
              });
              await loadEvents();
              showToast(`Undid move for "${event.title}".`);
            } catch {
              showToast("Couldn't undo move. Try again.");
            }
          },
        });
      } catch {
        showToast("Couldn't move to tomorrow. Try again.");
      }
    },
    [editEvent, loadEvents, showToast]
  );

  const handleTimelineDelete = useCallback(
    async (eventLike) => {
      const eventObj = eventLike && typeof eventLike === "object" ? eventLike : null;
      const rawId = eventObj?.id ?? eventLike;
      const baseId = extractBaseEventId(rawId, eventObj);
      try {
        if (eventObj?.source === "task" && eventObj?.external_id) {
          await deleteTask(eventObj.external_id);
          await Promise.all([loadEvents(), refetchTasks()]);
          showToast(`"${eventObj.title}" removed from tasks and calendar.`);
          return;
        }
        await removeEvent(baseId);
        await loadEvents();
        showToast(`"${eventObj?.title || "Event"}" deleted.`);
      } catch {
        showToast("Couldn't delete this item. Try again.");
      }
    },
    [removeEvent, loadEvents, refetchTasks, showToast]
  );

  const scheduledTitles = useMemo(
    () => new Set(upcomingItems.map((e) => e.title?.toLowerCase())),
    [upcomingItems]
  );

  const suggestableTasks = useMemo(
    () => dayTasks.filter((t) => !scheduledTitles.has(t.title?.toLowerCase())),
    [dayTasks, scheduledTitles]
  );


  const tasksDueToday = useMemo(() => {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const filtered = (allTasks || []).filter((t) => {
      const d = t.due_date ? new Date(t.due_date) : null;
      return d && d >= todayStart && d <= todayEnd;
    });

    const isOverdue = (task) => !task.completed && task.due_date && new Date(task.due_date) < todayStart;
    return [...filtered].sort((a, b) => {
      const aOver = isOverdue(a);
      const bOver = isOverdue(b);
      if (aOver && !bOver) return -1;
      if (!aOver && bOver) return 1;
      return 0;
    });
  }, [allTasks, now]);

  /** Daily Navigator context: task/gap/conflict/endOfDay, currentBlock, nextItem, gapMins, overlaps, conflictAt. */
  const navigatorContext = useMemo(
    () => getNavigatorContext(now, selectedDate, sortedEvents || [], isToday),
    [now, selectedDate, sortedEvents, isToday]
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
        const dCode = (d.module_code || "").toLowerCase();
        return !scheduledTitles.some(t =>
          (dTitle && t.includes(dTitle.slice(0, 8))) ||
          (dCode && t.includes(dCode))
        );
      })
      .sort((a, b) => new Date(a.start_due_date) - new Date(b.start_due_date));
  }, [selectedDate, upcomingDeadlines, sortedEvents]);


  const overdueTasksForNow = useMemo(() => {
    return (tasksDueToday || [])
      .filter(
        (t) =>
          !isRoutineOrEventTask(t, getTag) &&
          !t.completed &&
          t.due_date &&
          new Date(t.due_date) < now
      )
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [tasksDueToday, getTag, now]);

  /** task-only. Include ONLY due-today tasks. Overdue tasks are shown on the 'Overdue' page. */
  const taskWidgetList = useMemo(() => {
    // We always define "Today" relative to the actual current time (now)
    // so this widget remains stable as "Today's Tasks" even if selectedDate changes.
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const isDueToday = (t) => {
      const d = t.due_date ? new Date(t.due_date) : null;
      return d && d >= todayStart && d <= todayEnd;
    };

    const tasks = (allTasks || [])
      .filter((t) => isDueToday(t)) // Strictly Today
      .map((t) => {
        const due = t.due_date ? new Date(t.due_date) : null;
        let taskWidgetStatus = "upcoming";
        if (t.completed) taskWidgetStatus = "completed";

        return {
          type: "task",
          id: `task-${t.id}`,
          sortTime: due || todayEnd,
          endTime: due ? new Date(due.getTime() + (t.estimated_blocks || 1) * 25 * 60000) : todayEnd,
          taskWidgetStatus,
          ...t,
        };
      });

    // Mark the very next upcoming task as "now"
    const incomplete = tasks.filter(t => !t.completed).sort((a, b) => a.sortTime - b.sortTime);
    const nextTask = incomplete.find(t => t.sortTime >= now);
    if (nextTask) nextTask.taskWidgetStatus = "now";

    const order = (a, b) => {
      const statusOrder = { now: 0, upcoming: 1, completed: 2 };
      return (statusOrder[a.taskWidgetStatus] ?? 1) - (statusOrder[b.taskWidgetStatus] ?? 1);
    };
    return [...tasks].sort(order);
  }, [allTasks, now]);

  /** Task-only: no events. */
  const taskWidgetItemsOnly = useMemo(
    () => taskWidgetList.filter((i) => i.type === "task"),
    [taskWidgetList]
  );
  const taskWidgetDueTodayCount = useMemo(() => {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    return (taskWidgetItemsOnly || []).filter((t) => {
      if (t.completed || !t.due_date) return false;
      const due = new Date(t.due_date);
      return due >= todayStart && due <= todayEnd;
    }).length;
  }, [taskWidgetItemsOnly, now]);
  const taskWidgetCompletedCount = useMemo(
    () => taskWidgetItemsOnly.filter((i) => i.completed).length,
    [taskWidgetItemsOnly]
  );
  const taskWidgetSpineCompletedPct =
    taskWidgetItemsOnly.length > 0 ? (taskWidgetCompletedCount / taskWidgetItemsOnly.length) * 100 : 0;
  /** Today's free windows from schedule (>= 20 min, chronological). */
  const todayFreeWindows = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    return getAllFreeWindowsToday(sortedEvents, selectedDate)
      .filter((w) => w.minutes >= 20)
      .sort((a, b) => a.start - b.start);
  }, [selectedDate, sortedEvents]);

  const freeWindowLabel = useMemo(() => {
    const nextWindow = todayFreeWindows[0];
    if (!nextWindow?.minutes) return null;
    if (nextWindow.minutes < 60) return `${nextWindow.minutes}m`;
    const hours = Math.floor(nextWindow.minutes / 60);
    const minutes = nextWindow.minutes % 60;
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }, [todayFreeWindows]);






  /** Overdue count (incomplete tasks past due). */
  const taskWidgetOverdueCount = useMemo(
    () => taskWidgetItemsOnly.filter((i) => !i.completed && i.taskWidgetStatus === "overdue").length,
    [taskWidgetItemsOnly]
  );

  const homepageRecommendation = useMemo(() => {
    const pendingTasks = (taskWidgetItemsOnly || []).filter((task) => !task.completed);
    const sortedDeadlineList = [...(upcomingDeadlines || [])]
      .filter((deadline) => deadline?.start_due_date)
      .sort((a, b) => new Date(a.start_due_date) - new Date(b.start_due_date));

    const getRelativeDueLabel = (dateLike) => {
      if (!dateLike) return null;
      const diffDays = Math.floor((new Date(dateLike).getTime() - Date.now()) / 86400000);
      if (diffDays <= 0) return "due today";
      if (diffDays === 1) return "due tomorrow";
      return `due in ${diffDays}d`;
    };

    const getModuleKey = (item) =>
      String(item?.module_id ?? item?.module ?? item?.moduleId ?? item?.module_code ?? "").trim().toUpperCase();

    for (const deadline of sortedDeadlineList) {
      const deadlineKey = getModuleKey(deadline);
      if (!deadlineKey) continue;
      const linkedTask = pendingTasks.find((task) => getModuleKey(task) === deadlineKey);
      if (!linkedTask) continue;
      const deadlineTitle = deadline.assessment_title || deadline.title || deadline.module_code || "upcoming deadline";
      const dueLabel = getRelativeDueLabel(deadline.start_due_date);
      return {
        text: `Focus on ${linkedTask.title} for ${deadlineTitle}.`,
        meta: `${deadline.module_code || "Module"}${dueLabel ? ` · ${dueLabel}` : ""}`,
        taskTitle: linkedTask.title,
      };
    }

    if (pendingTasks[0] && freeWindowLabel) {
      return {
        text: `Use the ${freeWindowLabel} window to move ${pendingTasks[0].title} forward.`,
        meta: "Best task to move next",
        taskTitle: pendingTasks[0].title,
      };
    }

    return null;
  }, [taskWidgetItemsOnly, upcomingDeadlines, freeWindowLabel]);

  const openQuickAddSchedule = useCallback((view) => {
    window.dispatchEvent(new CustomEvent('quick-add:open', { detail: { view } }));
  }, []);


  const handleTaskToggle = useCallback(
    async (task, completed) => {
      const markingComplete = completed === true;
      const isRoutine = isRoutineTask(task);
      if (markingComplete) {
        showCompletionToast(getCompletionMessage(task), { isRoutine });
      }
      try {
        await updateTask(task.id, { completed });
        refetchTasks();
      } catch (_) { }
    },
    [refetchTasks, showCompletionToast]
  );

  const openTimelinePopup = useCallback((event, _matchTask, anchorRect = null) => {
    if (!event) return;
    openPopup({ ...event, forcePersonalPopup: true, timelineReadOnly: true }, anchorRect);
  }, [openPopup]);

  const fmtTimerSecs = (s) => {
    const t = Math.max(0, s);
    return `${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;
  };



  return (
    <div className={`${styles.page} ${hasTimerSession ? styles.focusModeActive : ""}`}>

      {homeDataLoading ? (
        <HomepageSkeleton />
      ) : (
        <>
          <div>
            {/* ─── ACTIVE FOCUS SESSION BANNER ─── shows when a timer is running */}
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

            {/* ─── SLEEP BANNER ─── motivational greeting shown at the top */}
            <SleepBanner />



            <div className={styles.intelligenceRowWrap}>
              <IntelligenceRow
                displayName={displayName}
                recommendation={homepageRecommendation}
                slot1TodayTasks={
                  <TaskWidgetSlot
                    styles={taskWidgetStyles}
                    displayName={displayName}
                    isToday={isToday(selectedDate)}
                    taskWidgetOverdueCount={taskWidgetOverdueCount}
                    taskWidgetDueTodayCount={taskWidgetDueTodayCount}
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
                    taskLists={taskLists}
                    onEditTask={(task) => setRescheduleTask(task)}
                    onDeleteTask={async (task) => {
                      await deleteTask(task.id);
                      refetchTasks();
                    }}
                    onInlineTaskEdit={async (task, patch) => {
                      await updateTask(task.id, patch);
                      refetchTasks();
                    }}
                  />
                }
                slot3Urgent={
                  <DeadlinesWidget
                    deadlines={upcomingDeadlines || []}
                    onSelectDeadline={setSelectedDeadline}
                    onSelectModule={(mod) => setSelectedModulePill(mod)}
                  />
                }
                slot5Data={{
                  now,
                  isToday: isToday(selectedDate),
                  navigatorContext,
                  sortedEvents,
                  hasTimerSession,
                  timerMode,
                  timeLeft,
                  workTime,
                  breakTime,
                  timerTask,
                  tomorrowFirstEvent,
                  taskWidgetItemsOnly,
                }}
                slot6Timeline={null}
              />
            </div>

            {/* Deadline detail popup — blurred backdrop, module/deadline card */}
            {/* Module pill popup — blurred backdrop, module card */}
            {selectedModulePill && (() => {
              const mCode = selectedModulePill.code || "";
              const mId = selectedModulePill.id;
              const mColors = getModulePillColors(mCode);
              const mModule = enrolledModules.find((m) =>
                (mId && String(m.id) === String(mId)) ||
                (m.module_code || "").toUpperCase() === mCode.toUpperCase()
              );
              const mName = mModule?.module_name || mModule?.name || null;
              const mDept = mModule?.department || mModule?.school || null;
              const mDesc = mModule?.description || null;
              const mLeader = mModule?.module_leader || mModule?.leader || null;
              const mUrl = mId ? `/modules?moduleId=${mId}` : `/modules?code=${encodeURIComponent(mCode)}`;
              return (
                <div
                  className={styles.deadlineDetailOverlay}
                  onClick={() => setSelectedModulePill(null)}
                  role="dialog"
                  aria-modal
                  aria-labelledby="module-card-title"
                >
                  <div className={styles.moduleCardCard} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.moduleCardHeader}>
                      <div
                        className={styles.moduleCardColorBar}
                        style={{ background: mColors.bg, color: mColors.text }}
                      >
                        {mCode.slice(0, 2)}
                      </div>
                      <button
                        type="button"
                        className={styles.deadlineDetailClose}
                        onClick={() => setSelectedModulePill(null)}
                        aria-label="Close"
                      >
                        <X size={14} strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                    <h2 id="module-card-title" className={styles.moduleCardCode} style={{ color: mColors.text }}>
                      {mCode}
                    </h2>
                    {mName && <p className={styles.moduleCardName}>{mName}</p>}
                    {mDept && <p className={styles.moduleCardDept}>{mDept}</p>}
                    {mDesc && <p className={styles.moduleCardDesc}>{mDesc.length > 120 ? mDesc.slice(0, 120) + "…" : mDesc}</p>}
                    {mLeader && <p className={styles.moduleCardLeader}>Leader: {mLeader}</p>}
                    <div className={styles.moduleCardDivider} />
                    <Link
                      to={mUrl}
                      className={styles.moduleCardLink}
                      style={{ background: mColors.text }}
                      onClick={() => setSelectedModulePill(null)}
                    >
                      View module →
                    </Link>
                  </div>
                </div>
              );
            })()}

            {selectedDeadline && (
              <div className={styles.deadlineDetailOverlay} onClick={() => setSelectedDeadline(null)} role="dialog" aria-modal aria-labelledby="deadline-detail-title">
                <div className={styles.deadlineDetailCard} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.deadlineDetailHeader}>
                    <div className={styles.deadlineDetailPills}>
                      {selectedDeadline.module_code && (
                        <ModulePill moduleCode={selectedDeadline.module_code} />
                      )}
                      {selectedDeadline.deadline_type && (
                        <TypePill
                          typeLabel={selectedDeadline.deadline_type.charAt(0).toUpperCase() + selectedDeadline.deadline_type.slice(1)}
                          accentColor={selectedDeadline.module_code ? getModulePillColors(selectedDeadline.module_code).accent : undefined}
                        />
                      )}
                    </div>
                  </div>
                  <h2 id="deadline-detail-title" className={styles.deadlineDetailTitle}>
                    {selectedDeadline.assessment_title || selectedDeadline.title || "Assignment"}
                  </h2>
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
                    <p className={styles.deadlineDetailMeta}>
                      <MapPin size={14} className={styles.deadlineDetailMetaIcon} aria-hidden />
                      {selectedDeadline.location}
                    </p>
                  )}
                  {(selectedDeadline.module_id != null || selectedDeadline.module != null || selectedDeadline.module_code) && (
                    <Link
                      to={selectedDeadline.module_id != null || selectedDeadline.module != null
                        ? `/modules?moduleId=${selectedDeadline.module_id ?? selectedDeadline.module}`
                        : `/modules?code=${encodeURIComponent(selectedDeadline.module_code)}`}
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

          <motion.div
            className={styles.bentoSpine}
            id="timeline-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className={styles.timelineBox}>
              <div className={styles.timelineHeader}>
                <div className={styles.timelineHeaderLeft}>
                  <div className={styles.timelineHeaderIconWrap} aria-hidden>
                    <CalendarIcon size={17} strokeWidth={1.75} />
                  </div>
                  <h3 className={styles.timelineTitle}>YOUR PLAN FOR THE DAY</h3>
                </div>
                <div className={styles.timelineHeaderRight}>
                  <Link to="/calendar" className={styles.timelineHeaderActionLink}>View my calendar →</Link>
                    <motion.div
                      className={styles.scheduleActionGroup}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <button
                        type="button"
                        className={styles.manualScheduleBtn}
                        onClick={() => openQuickAddSchedule('schedule_manual')}
                        aria-label="Open manual schedule quick add"
                      >
                        🧩 Manual Schedule
                      </button>
                      <button
                        type="button"
                        className={styles.autoScheduleBtn}
                        onClick={() => openQuickAddSchedule('schedule_auto')}
                        aria-label="Open auto schedule quick add"
                      >
                        ⚙️ Auto Schedule
                      </button>
                    </motion.div>
                </div>
              </div>
              <div className={styles.timelineTrack}>
                <motion.div
                  className={styles.timelineTrackContent}
                  layout
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                >
                  <MiniTimeline
                    sortedEvents={sortedEvents}
                    selectedDate={selectedDate}
                    now={now}
                    dayTasks={dayTasks}
                    tasksDueToday={tasksDueToday}
                    suggestableTasks={suggestableTasks}
                    deadlineSuggestions={deadlineSuggestions}
                    taskLists={taskLists}
                    onQuickStart={handleQuickStartGap}
                    onTaskToggle={handleTaskToggle}
                    onCardClick={openTimelinePopup}
                    onEdit={(ev) => openModal(ev, ev.tag)}
                    onConflictAutoMove={handleConflictAutoMove}
                    onPushTomorrow={handleConflictPushTomorrow}
                    onDelete={handleTimelineDelete}
                    onReschedule={handleReschedule}
                    getTag={getTag}
                    hasTimerSession={hasTimerSession}
                    timerTask={timerTask}
                    timeLeft={timeLeft}
                    timerMode={timerMode}
                    styles={styles}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
          <BackToTop containerSelector="[data-dashboard-main]" />
        </>

      )}

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

      <EventPopups />

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
            } catch (_) { }
          }}
          onDelete={async () => {
            try {
              await deleteTask(rescheduleTask.id);
              refetchTasks();
              setRescheduleTask(null);
            } catch (_) { }
          }}
          onClose={() => setRescheduleTask(null)}
        />
      )}

      {planTimelineReadItem && (
        <PlanReadDetailModal
          item={planTimelineReadItem}
          styles={styles}
          onClose={() => setPlanTimelineReadItem(null)}
          onEditTask={(task) => {
            setRescheduleTask(task);
          }}
          onDeleteTask={async (task) => {
            await deleteTask(task.id);
            refetchTasks();
          }}
          onEditEvent={(ev) => {
            openModal({ ...ev, id: extractBaseEventId(ev.id) }, ev.tag);
          }}
          onDeleteEvent={async (ev) => {
            await handleTimelineDelete(ev);
          }}
        />
      )}

      {!toastApi && fallbackToast && (
        <div className={styles.toast} role="status" aria-live="polite">
          <div>
            <span className={styles.toastCheck}>✓</span>
            <span>{fallbackToast.message}</span>
          </div>
          {fallbackToast.actionLabel && fallbackToast.onAction && (
            <button
              type="button"
              onClick={async () => {
                const action = fallbackToast.onAction;
                setFallbackToast(null);
                await action();
              }}
            >
              {fallbackToast.actionLabel}
            </button>
          )}
          <button type="button" onClick={() => setFallbackToast(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
