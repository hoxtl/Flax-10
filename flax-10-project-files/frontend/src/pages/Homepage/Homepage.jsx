/**
 * Homepage route.
 */

import { useCallback, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
import { updateTask, deleteTask } from "../../api/taskApi";
import { useTags } from "../../context/TagContext";
import { useTimerContext } from "../../context/TimerContext";
import { useTaskCompletion } from "../../context/TaskCompletionContext";
import { useToast } from "../../context/ToastContext";
import { getCompletionMessage, isRoutineTask } from "../../lib/completionMessages";
import AppToast from "../../components/common/AppToast/AppToast";

import styles from "./Homepage.module.css";
import { useHomeData } from "./hooks/useHomeData";
import { useHomepageDisplayName } from "./hooks/useHomepageDisplayName";
import { useHomepageToast } from "./hooks/useHomepageToast";
import { useHomepageResources } from "./hooks/useHomepageResources";
import { useHomepageModals } from "./hooks/useHomepageModals";
import { useHomepageReschedule } from "./hooks/useHomepageReschedule";
import { useHomepageEventBootstrap, useHomepageNow, useHomepageSelection, useTimerCompletionSound } from "./hooks/useHomepagePageEffects";
import { useHomepageViewModel } from "./hooks/useHomepageViewModel";
import { useAutoResolveScheduleConflicts } from "./components/useAutoResolveScheduleConflicts";
import { HomepageDashboard } from "./components/HomepageDashboard";

function useTaskCompletionHandler({ refetchTasks, removePendingTask, showCompletionToast, showToast }) {
  return useCallback(async (task) => {
    const completed = !task.completed;
    const taskId = typeof task.id === "string" && task.id.startsWith("task-") ? Number(task.id.replace("task-", "")) : task.id;
    if (completed) showCompletionToast(getCompletionMessage(task), { isRoutine: isRoutineTask(task) });
    if (completed) removePendingTask(taskId);
    try {
      await updateTask(taskId, { completed });
      refetchTasks();
    } catch {
      showToast("Couldn't update task.");
    }
  }, [refetchTasks, removePendingTask, showCompletionToast, showToast]);
}

export default function Homepage({ defaultShowCreateTaskModal = false, defaultPlanTimelineReadItem = null }) {
  const navigate = useNavigate();
  const { selectedDate, events: allCalEvents } = useCalendar();
  const dispatch = useCalendarDispatch();
  const { loadEvents } = useCalendarEvents();
  const { removeEvent, addEvent, editEvent } = useEventActions();
  const { openModal } = useEventModal();
  const { openPopup } = useEventPopup();
  const { getTag, tags } = useTags();
  const timer = useTimerContext();
  const { showCompletionToast } = useTaskCompletion();
  const toastApi = useToast();
  const displayName = useHomepageDisplayName();
  const { fallbackToast, setFallbackToast, showToast } = useHomepageToast(toastApi);
  const { modulesList, enrollments, upcomingDeadlines, taskLists, setTaskLists } = useHomepageResources();
  const modals = useHomepageModals(defaultShowCreateTaskModal, defaultPlanTimelineReadItem);
  const now = useHomepageNow();
  const taskWidgetRef = useRef(null);
  const [completedEventIds, setCompletedEventIds] = useState(new Set());
  const { dayEvents, dayTasks, allTasks, removePendingTask, refetchTasks, loading: homeDataLoading } = useHomeData(selectedDate);

  useHomepageSelection(dispatch);
  useHomepageEventBootstrap(allCalEvents, loadEvents, selectedDate);
  useTimerCompletionSound(timer.isActive, timer.timeLeft, timer.mode);

  const state = useHomepageViewModel({
    allCalEvents,
    allTasks,
    dayEvents,
    dayTasks,
    enrollments,
    getTag,
    modulesList,
    now,
    selectedDate,
    upcomingDeadlines,
  });
  const handleTaskWidgetComplete = useTaskCompletionHandler({
    refetchTasks,
    removePendingTask,
    showCompletionToast,
    showToast,
  });
  const reschedule = useHomepageReschedule({
    selectedDate,
    addEvent,
    removeEvent,
    loadEvents,
    showToast,
    refetchTasks,
    editEvent,
    sortedEvents: state.sortedEvents,
    deleteTask,
    missedItems: state.missedItems,
    overdueTasksForNow: state.overdueTasksForNow,
  });

  const handleTaskToggle = useCallback(async (task, completed) => {
    if (completed) showCompletionToast(getCompletionMessage(task), { isRoutine: isRoutineTask(task) });
    try {
      await updateTask(task.id, { completed });
      refetchTasks();
    } catch {}
  }, [refetchTasks, showCompletionToast]);

  const handleInlineTaskEdit = useCallback(async (task, patch) => {
    await updateTask(task.id, patch);
    refetchTasks();
  }, [refetchTasks]);

  const deleteTaskAndRefresh = useCallback(async (task) => {
    await deleteTask(task.id);
    refetchTasks();
  }, [refetchTasks]);

  const openTimelinePopup = useCallback((event, _matchTask, anchorRect = null) => {
    if (!event) return;
    openPopup({ ...event, forcePersonalPopup: true, timelineReadOnly: true }, anchorRect, false, "day");
  }, [openPopup]);

  const openQuickAddSchedule = useCallback((view) => {
    window.dispatchEvent(new CustomEvent("quick-add:open", { detail: { view } }));
  }, []);

  useAutoResolveScheduleConflicts({
    allEvents: allCalEvents,
    selectedDate,
    onConflictAutoMove: reschedule.handleConflictAutoMove,
    onPushTomorrow: reschedule.handleConflictPushTomorrow,
    enabled: true,
  });

  return (
    <div className={`${styles.page} ${timer.isActive ? styles.focusModeActive : ""}`}>
      <HomepageDashboard
        addEvent={addEvent}
        breakTime={timer.breakTime}
        completedEventIds={completedEventIds}
        dayTasks={dayTasks}
        deleteTaskAndRefresh={deleteTaskAndRefresh}
        displayName={displayName}
        getTag={getTag}
        handleInlineTaskEdit={handleInlineTaskEdit}
        handleTaskToggle={handleTaskToggle}
        handleTaskWidgetComplete={handleTaskWidgetComplete}
        hasTimerSession={timer.isActive}
        homeDataLoading={homeDataLoading}
        modals={modals}
        navigate={navigate}
        now={now}
        openModal={openModal}
        openQuickAddSchedule={openQuickAddSchedule}
        openTimelinePopup={openTimelinePopup}
        refetchTasks={refetchTasks}
        reschedule={reschedule}
        selectedDate={selectedDate}
        setCompletedEventIds={setCompletedEventIds}
        setTaskLists={setTaskLists}
        showCreateTaskModal={modals.showCreateTaskModal}
        showToast={showToast}
        state={state}
        tags={tags}
        taskLists={taskLists}
        taskWidgetRef={taskWidgetRef}
        timeLeft={timer.timeLeft}
        timerMode={timer.mode}
        timerTask={timer.task}
        upcomingDeadlines={upcomingDeadlines}
        workTime={timer.workTime}
      />
      <AnimatePresence initial={false}>
        {!toastApi && fallbackToast && (
          <AppToast
            message={fallbackToast.message}
            actionLabel={fallbackToast.actionLabel}
            onAction={fallbackToast.onAction}
            onClose={() => setFallbackToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
