/**
 * Homepage dashboard body.
 */

import { isToday } from "../../../components/Calendar/utils/dateUtils";
import { createTask, fetchTaskLists, createTaskList, deleteTask, updateTask } from "../../../api/taskApi";
import { EventPopups } from "../../../components/Calendar/EventPopups";
import { BackToTop } from "../../../components/Pagination/Pagination";
import { TaskWidgetSlot } from "./TaskWidgetSlot";
import { DeadlinesWidget } from "./DeadlinesWidget";
import IntelligenceRow from "./IntelligenceRow";
import SleepBanner from "./SleepBanner";
import { HomepageModals } from "./HomepageModals";
import { HomepageOverlays } from "./HomepageOverlays";
import { HomepageSkeleton } from "./HomepageSkeleton";
import { HomepageFocusBanner } from "./HomepageFocusBanner";
import taskWidgetStyles from "../styles/TaskWidget.module.css";
import styles from "../Homepage.module.css";
import { HomepageTimelineSection } from ".";
import { getTaskCategoryColor, getTaskCategoryPillMeta } from "../utils/homepageViewModel";

export function HomepageDashboard(props) {
  if (props.homeDataLoading) return <HomepageSkeleton />;

  return (
    <>
      <div>
        <HomepageFocusBanner hasTimerSession={props.hasTimerSession} navigate={props.navigate} timeLeft={props.timeLeft} timerMode={props.timerMode} timerTask={props.timerTask} />
        <SleepBanner />
        <HomepageDashboardRow {...props} />
        <HomepageOverlays
          selectedModulePill={props.modals.selectedModulePill}
          setSelectedModulePill={props.modals.setSelectedModulePill}
          enrolledModules={props.state.enrolledModules}
          selectedDeadline={props.modals.selectedDeadline}
          setSelectedDeadline={props.modals.setSelectedDeadline}
          styles={styles}
        />
      </div>
      <BackToTop containerSelector="[data-dashboard-main]" />
      <HomepageDashboardModals {...props} />
      <EventPopups />
    </>
  );
}

function HomepageDashboardRow(props) {
  return (
    <div className={styles.intelligenceRowWrap}>
      <IntelligenceRow
        displayName={props.displayName}
        recommendation={props.state.homepageRecommendation}
        slot1TodayTasks={<HomepageTaskSlot {...props} />}
        slot3Urgent={<HomepageDeadlines {...props} />}
        slot5Data={getSlot5Data(props)}
        slot6Timeline={<HomepageTimeline {...props} />}
      />
    </div>
  );
}

function HomepageTaskSlot(props) {
  return <TaskWidgetSlot {...getTaskSlotProps(props)} />;
}

function HomepageDeadlines(props) {
  return (
    <DeadlinesWidget
      deadlines={props.upcomingDeadlines || []}
      onSelectDeadline={props.modals.setSelectedDeadline}
      onSelectModule={props.modals.setSelectedModulePill}
    />
  );
}

function HomepageTimeline(props) {
  return <HomepageTimelineSection {...getTimelineProps(props)} />;
}

function getSlot5Data(props) {
  return {
    now: props.now,
    isToday: isToday(props.selectedDate),
    navigatorContext: props.state.navigatorContext,
    sortedEvents: props.state.sortedEvents,
    hasTimerSession: props.hasTimerSession,
    timerMode: props.timerMode,
    timeLeft: props.timeLeft,
    workTime: props.workTime,
    breakTime: props.breakTime,
    timerTask: props.timerTask,
    tomorrowFirstEvent: props.state.tomorrowFirstEvent,
    taskWidgetItemsOnly: props.state.taskWidgetItemsOnly,
  };
}

function HomepageDashboardModals(props) {
  return <HomepageModals {...getModalProps(props)} />;
}

function getTaskSlotProps(props) {
  return {
    styles: taskWidgetStyles,
    displayName: props.displayName,
    isToday: isToday(props.selectedDate),
    taskWidgetOverdueCount: props.state.taskWidgetOverdueCount,
    taskWidgetDueTodayCount: props.state.taskWidgetDueTodayCount,
    taskWidgetSpineCompletedPct: props.state.taskWidgetSpineCompletedPct,
    taskWidgetItemsOnly: props.state.taskWidgetItemsOnly,
    taskWidgetList: props.state.taskWidgetList,
    showAllTaskWidgetTasks: false,
    setShowAllTaskWidgetTasks: () => {},
    getTaskCategoryPill: (task) => getTaskCategoryPillMeta(task, props.taskLists, props.state.enrolledModules, props.getTag)?.label || null,
    getTaskCategoryColor: (task) => getTaskCategoryColor(task, props.getTag),
    handleTaskWidgetComplete: props.handleTaskWidgetComplete,
    taskWidgetRef: props.taskWidgetRef,
    hasTimerSession: props.hasTimerSession,
    onStartFocus: () => props.navigate("/timer", { state: { fromTaskPlay: true } }),
    taskLists: props.taskLists,
    onEditTask: props.modals.setRescheduleTask,
    onDeleteTask: props.deleteTaskAndRefresh,
    onInlineTaskEdit: props.handleInlineTaskEdit,
  };
}

function getTimelineProps(props) {
  return {
    selectedDate: props.selectedDate,
    handleReplanDay: props.reschedule.handleReplanDay,
    replanLoading: props.reschedule.replanLoading,
    missedItems: props.state.missedItems,
    overdueTasksForNow: props.state.overdueTasksForNow,
    sortedEvents: props.state.sortedEvents,
    now: props.now,
    dayTasks: props.dayTasks,
    tasksDueToday: props.state.tasksDueToday,
    suggestableTasks: props.state.suggestableTasks,
    deadlineSuggestions: props.state.deadlineSuggestions,
    taskLists: props.taskLists,
    handleQuickStartGap: props.reschedule.handleQuickStartGap,
    handleTaskToggle: props.handleTaskToggle,
    openTimelinePopup: props.openTimelinePopup,
    openModal: props.openModal,
    handleConflictAutoMove: props.reschedule.handleConflictAutoMove,
    handleConflictPushTomorrow: props.reschedule.handleConflictPushTomorrow,
    handleTimelineDelete: props.reschedule.handleTimelineDelete,
    handleReschedule: props.reschedule.handleReschedule,
    getTag: props.getTag,
    completedEventIds: props.completedEventIds,
    setCompletedEventIds: props.setCompletedEventIds,
    onOpenQuickAddSchedule: props.openQuickAddSchedule,
    hasTimerSession: props.hasTimerSession,
    timerTask: props.timerTask,
    timeLeft: props.timeLeft,
    timerMode: props.timerMode,
    styles,
  };
}

function getModalProps(props) {
  return {
    showCreateTaskModal: props.modals.showCreateTaskModal,
    setShowCreateTaskModal: props.modals.setShowCreateTaskModal,
    showCreateListFromTask: props.modals.showCreateListFromTask,
    setShowCreateListFromTask: props.modals.setShowCreateListFromTask,
    taskLists: props.taskLists,
    enrolledModules: props.state.enrolledModules,
    tags: props.tags,
    lastCreatedListId: props.modals.lastCreatedListId,
    setLastCreatedListId: props.modals.setLastCreatedListId,
    createTask,
    refetchTasks: props.refetchTasks,
    addEvent: props.addEvent,
    showToast: props.toast.showToast,
    selectedDate: props.selectedDate,
    rescheduleTask: props.modals.rescheduleTask,
    setRescheduleTask: props.modals.setRescheduleTask,
    updateTask,
    deleteTask,
    planTimelineReadItem: props.modals.planTimelineReadItem,
    setPlanTimelineReadItem: props.modals.setPlanTimelineReadItem,
    handleTimelineDelete: props.reschedule.handleTimelineDelete,
    openModal: props.openModal,
    createTaskList,
    setTaskLists: props.setTaskLists,
    fetchTaskLists,
    styles,
  };
}
