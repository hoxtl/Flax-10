import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { isToday } from "../../components/Calendar/utils/dateUtils";
import { useCalendar, useCalendarDispatch, useEventModal, useEventPopup } from "../../context/CalendarContext";
import { useCalendarEvents, useEventActions } from "../../components/Calendar/hooks/useCalendarEvents";
import { updateTask, createTask, fetchTaskLists, createTaskList, deleteTask } from "../../api/taskService";
import { useTags } from "../../context/TagContext";
import { useTimerContext } from "../../context/TimerContext";
import { useTaskCompletion } from "../../context/TaskCompletionContext";
import { getCompletionMessage, isRoutineTask } from "../../lib/completionMessages";
import { playCompletionChime } from "../../lib/sounds";

import { useHomeData } from "./hooks/useHomeData";
import { useHomepageState } from "./hooks/useHomepageState";
import { useHomepageDerivations } from "./hooks/useHomepageDerivations";
import { useHomepageModals } from "./hooks/useHomepageModals";
import { useHomepageReschedule } from "./hooks/useHomepageReschedule";

import IntelligenceRow from "./components/IntelligenceRow";
import { HomepageOverlays } from "./components/HomepageOverlays";
import { HomepageModals } from "./components/HomepageModals";
import { HomepageTimelineSection } from "./components/HomepageTimelineSection";
import SleepBanner from "./components/SleepBanner";
import PageSkeleton from "../../components/common/LoadingState/PageSkeleton";
import { BackToTop } from "../../components/Pagination/Pagination";
import { EventPopups } from "../../components/Calendar/EventPopups";

import { RightNowWidget } from "./components/RightNowWidget";
import { QuickActionsWidget } from "./components/QuickActionsWidget";
import { StudyPulseWidget } from "./components/StudyPulseWidget";
import { SocialDiscoverWidget } from "./components/SocialDiscoverWidget";
import { DeadlinesWidget } from "./components/DeadlinesWidget";
import { TaskWidgetSlot } from "./components/TaskWidgetSlot";

import taskWidgetStyles from "./styles/TaskWidget.module.css";
import styles from "./Homepage.module.css";

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
  const { showCompletionToast } = useTaskCompletion();

  const [now, setNow] = useState(() => new Date());
  const [completedEventIds, setCompletedEventIds] = useState(() => new Set());
  const [showAllTaskWidgetTasks, setShowAllTaskWidgetTasks] = useState(false);
  const taskWidgetRef = useRef(null);
  const prevTimeLeftRef = useRef(null);

  const { dayEvents, dayTasks, allTasks, removePendingTask, refetchTasks, loading: homeDataLoading } = useHomeData(selectedDate);
  const stateHooks = useHomepageState();
  const modalHooks = useHomepageModals(defaultShowCreateTaskModal, defaultPlanTimelineReadItem);
  
  const derivations = useHomepageDerivations({
    modulesList: stateHooks.modulesList, enrollments: stateHooks.enrollments,
    allCalEvents, selectedDate, now, dayEvents, dayTasks, allTasks,
    taskLists: stateHooks.taskLists, getTag, upcomingDeadlines: stateHooks.upcomingDeadlines
  });

  const rescheduleHooks = useHomepageReschedule({
    selectedDate, addEvent, removeEvent, loadEvents, showToast: stateHooks.showToast, refetchTasks, editEvent,
    sortedEvents: derivations.sortedEvents, deleteTask, missedItems: derivations.missedItems, overdueTasksForNow: derivations.overdueTasksForNow
  });

  useEffect(() => { const t = new Date(); t.setHours(0,0,0,0); dispatch({ type: "SET_SELECTED_DATE", payload: t }); }, [dispatch]);
  useEffect(() => { const id = setTimeout(() => { if (!allCalEvents?.length) loadEvents(); }, 220); return () => clearTimeout(id); }, [selectedDate, allCalEvents, loadEvents]);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (timerActive && timerMode === "work" && prevTimeLeftRef.current > 0 && timeLeft === 0) playCompletionChime(0.35);
    prevTimeLeftRef.current = timeLeft;
  }, [timerActive, timerMode, timeLeft]);

  const handleTaskWidgetComplete = useCallback(async (t) => {
    const newCompleted = !t.completed;
    const numericId = typeof t.id === "string" && t.id.startsWith("task-") ? Number(t.id.replace("task-", "")) : t.id;
    if (newCompleted) showCompletionToast(getCompletionMessage(t), { isRoutine: isRoutineTask(t) });
    if (newCompleted) removePendingTask(numericId);
    try { await updateTask(numericId, { completed: newCompleted }); } catch { stateHooks.showToast("Couldn't update task."); return; }
    refetchTasks();
    if (newCompleted && !isRoutineTask(t)) playCompletionChime(0.08);
  }, [showCompletionToast, removePendingTask, refetchTasks, stateHooks]);

  const widgetElements = {
    rightNow: <RightNowWidget schedule={derivations.sortedEvents} now={now} tasks={derivations.taskWidgetItemsOnly} />,
    tasks: <TaskWidgetSlot
      styles={taskWidgetStyles} displayName={stateHooks.displayName} isToday={isToday(selectedDate)}
      taskWidgetOverdueCount={derivations.taskWidgetOverdueCount} taskWidgetDueTodayCount={derivations.taskWidgetDueTodayCount}
      taskWidgetSpineCompletedPct={derivations.taskWidgetSpineCompletedPct} taskWidgetItemsOnly={derivations.taskWidgetItemsOnly}
      taskWidgetList={derivations.taskWidgetList} showAllTaskWidgetTasks={showAllTaskWidgetTasks} setShowAllTaskWidgetTasks={setShowAllTaskWidgetTasks}
      getTaskCategoryPill={derivations.getTaskCategoryPill} getTaskCategoryColor={derivations.getTaskCategoryColor}
      handleTaskWidgetComplete={handleTaskWidgetComplete} taskWidgetRef={taskWidgetRef} hasTimerSession={timerActive}
      onStartFocus={() => navigate("/timer", { state: { fromTaskPlay: true } })} taskLists={stateHooks.taskLists}
      onEditTask={(task) => modalHooks.setRescheduleTask(task)} onDeleteTask={async (t) => { await deleteTask(t.id); refetchTasks(); }}
      onInlineTaskEdit={async (t, patch) => { await updateTask(t.id, patch); refetchTasks(); }}
    />,
    quickActions: <QuickActionsWidget onAction={(act) => stateHooks.showToast(`Action ${act}`)} />,
    studyPulse: <StudyPulseWidget
      studyPulseWindows={isToday(selectedDate) ? derivations.todayFreeWindows : []} studyPulseNow={now}
      studyPulseOnStartFocus={() => navigate("/timer")} studyPulseDeadlines={stateHooks.upcomingDeadlines || []}
    />,
    deadlines: <DeadlinesWidget
      deadlines={stateHooks.upcomingDeadlines || []}
      onSelectDeadline={modalHooks.setSelectedDeadline} onSelectModule={modalHooks.setSelectedModulePill}
    />,
    socialDiscover: <SocialDiscoverWidget />
  };

  return (
    <div className={`${styles.page} ${timerActive ? styles.focusModeActive : ""}`}>
      {stateHooks.toast && (
        <div className={styles.alertToast}>
          <div className={styles.alertContent}>
            <span className={styles.alertIcon}>✓</span>
            <span className={styles.alertMessage}>{stateHooks.toast.message}</span>
          </div>
          {stateHooks.toast.actionLabel && stateHooks.toast.onAction && (
            <button type="button" className={styles.alertAction} onClick={async () => { const a = stateHooks.toast.onAction; stateHooks.closeToast(); await a(); }}>
              {stateHooks.toast.actionLabel}
            </button>
          )}
          <button className={styles.alertClose} onClick={stateHooks.closeToast}>✕</button>
        </div>
      )}

      {homeDataLoading ? <PageSkeleton label="Loading homepage" cardCount={5} cardHeight="180px" columns={2} /> : (
        <>
          <div>
            {timerActive && (
              <div className={styles.focusBanner}>
                <div className={styles.focusBannerLeft}>
                  <span className={`${styles.focusBannerBadge} ${timerMode === "break" ? styles.focusBannerBadgeBreak : ""}`}>{timerMode === "break" ? "BREAK" : "FOCUS"}</span>
                  {timerTask && <span className={styles.focusBannerTask}>{timerTask}</span>}
                </div>
              </div>
            )}
            <SleepBanner />
            <div className={styles.intelligenceRowWrap}>
              <IntelligenceRow
                displayName={stateHooks.displayName} recommendation={derivations.homepageRecommendation}
                studyPulseWindows={isToday(selectedDate) ? derivations.todayFreeWindows : []} studyPulseNow={now}
                slot5Data={{
                  now, isToday: isToday(selectedDate), navigatorContext: derivations.navigatorContext, sortedEvents: derivations.sortedEvents,
                  hasTimerSession: timerActive, timerMode, timeLeft, workTime, breakTime, timerTask, tomorrowFirstEvent: derivations.tomorrowFirstEvent,
                  taskWidgetItemsOnly: derivations.taskWidgetItemsOnly, upcomingDeadlines: stateHooks.upcomingDeadlines, todayFreeWindows: derivations.todayFreeWindows,
                }}
                homepageWidgets={stateHooks.homepageWidgets} isEditingDashboard={stateHooks.isEditingDashboard}
                setIsEditingDashboard={stateHooks.setIsEditingDashboard} saveWidgetLayout={stateHooks.saveWidgetLayout}
                widgetElements={widgetElements}
              />
            </div>
            <HomepageOverlays
              selectedModulePill={modalHooks.selectedModulePill} setSelectedModulePill={modalHooks.setSelectedModulePill} enrolledModules={derivations.enrolledModules}
              selectedDeadline={modalHooks.selectedDeadline} setSelectedDeadline={modalHooks.setSelectedDeadline} styles={styles}
            />
          </div>
          <HomepageTimelineSection
            selectedDate={selectedDate} handleReplanDay={rescheduleHooks.handleReplanDay} replanLoading={rescheduleHooks.replanLoading}
            missedItems={derivations.missedItems} overdueTasksForNow={derivations.overdueTasksForNow} sortedEvents={derivations.sortedEvents}
            now={now} dayTasks={dayTasks} tasksDueToday={derivations.tasksDueToday} suggestableTasks={derivations.suggestableTasks}
            deadlineSuggestions={derivations.deadlineSuggestions} taskLists={stateHooks.taskLists} handleQuickStartGap={rescheduleHooks.handleQuickStartGap}
            handleTaskToggle={async (t, c) => { if (c) showCompletionToast(getCompletionMessage(t), { isRoutine: isRoutineTask(t) }); try { await updateTask(t.id, { completed: c }); refetchTasks(); } catch { /* ignore */ } }}
            openTimelinePopup={(e, m, a) => openPopup({ ...e, forcePersonalPopup: true, timelineReadOnly: true }, a)} openModal={openModal}
            handleConflictAutoMove={rescheduleHooks.handleConflictAutoMove} handleConflictPushTomorrow={rescheduleHooks.handleConflictPushTomorrow}
            handleTimelineDelete={rescheduleHooks.handleTimelineDelete} handleReschedule={rescheduleHooks.handleReschedule} getTag={getTag}
            completedEventIds={completedEventIds} setCompletedEventIds={setCompletedEventIds} hasTimerSession={timerActive}
            timerTask={timerTask} timeLeft={timeLeft} timerMode={timerMode} styles={styles}
          />
          <BackToTop containerSelector="[data-dashboard-main]" />
        </>
      )}
      <HomepageModals
        {...modalHooks} taskLists={stateHooks.taskLists} enrolledModules={derivations.enrolledModules} tags={tags}
        createTask={createTask} refetchTasks={refetchTasks} addEvent={addEvent} showToast={stateHooks.showToast} selectedDate={selectedDate}
        updateTask={updateTask} deleteTask={deleteTask} handleTimelineDelete={rescheduleHooks.handleTimelineDelete} openModal={openModal}
        createTaskList={createTaskList} setTaskLists={stateHooks.setTaskLists} fetchTaskLists={fetchTaskLists} styles={styles}
      />
      <EventPopups />
    </div>
  );
}
