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
  return <HomepageDashboardContent {...props} />;
}

function HomepageDashboardContent(props) {
  return <><div><HomepageFocusBanner hasTimerSession={props.hasTimerSession} navigate={props.navigate} timeLeft={props.timeLeft} timerMode={props.timerMode} timerTask={props.timerTask} /><SleepBanner /><HomepageDashboardRow {...props} /><HomepageOverlays {...getOverlayProps(props)} /></div><BackToTop containerSelector="[data-dashboard-main]" /><HomepageDashboardModals {...props} /><EventPopups /></>;
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
        timelineProps={getTimelineProps(props)}
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
  return { ...getTaskSlotData(props), ...getTaskSlotActions(props) };
}

function getTimelineProps(props) {
  return { ...getTimelineCoreProps(props), ...getTimelineActionProps(props), styles };
}

function getModalProps(props) {
  return { ...getModalStateProps(props), ...getModalActionProps(props), styles };
}

function getOverlayProps(props) {
  return { enrolledModules: props.state.enrolledModules, selectedDeadline: props.modals.selectedDeadline, selectedModulePill: props.modals.selectedModulePill, setSelectedDeadline: props.modals.setSelectedDeadline, setSelectedModulePill: props.modals.setSelectedModulePill, styles };
}

function getTaskPillLabel(task, props) {
  return getTaskCategoryPillMeta(task, props.taskLists, props.state.enrolledModules, props.getTag)?.label || null;
}

function getTimelineCoreProps(props) {
  return { completedEventIds: props.completedEventIds, dayTasks: props.dayTasks, deadlineSuggestions: props.state.deadlineSuggestions, getTag: props.getTag, hasTimerSession: props.hasTimerSession, missedItems: props.state.missedItems, now: props.now, overdueTasksForNow: props.state.overdueTasksForNow, replanLoading: props.reschedule.replanLoading, selectedDate: props.selectedDate, setCompletedEventIds: props.setCompletedEventIds, sortedEvents: props.state.sortedEvents, suggestableTasks: props.state.suggestableTasks, taskLists: props.taskLists, tasksDueToday: props.state.tasksDueToday, timeLeft: props.timeLeft, timerMode: props.timerMode, timerTask: props.timerTask };
}

function getTimelineActionProps(props) {
  return { handleConflictAutoMove: props.reschedule.handleConflictAutoMove, handleConflictPushTomorrow: props.reschedule.handleConflictPushTomorrow, handleQuickStartGap: props.reschedule.handleQuickStartGap, handleReplanDay: props.reschedule.handleReplanDay, handleReschedule: props.reschedule.handleReschedule, handleTaskToggle: props.handleTaskToggle, handleTimelineDelete: props.reschedule.handleTimelineDelete, onOpenQuickAddSchedule: props.openQuickAddSchedule, openModal: props.openModal, openTimelinePopup: props.openTimelinePopup };
}

function getModalStateProps(props) {
  return { enrolledModules: props.state.enrolledModules, lastCreatedListId: props.modals.lastCreatedListId, planTimelineReadItem: props.modals.planTimelineReadItem, rescheduleTask: props.modals.rescheduleTask, selectedDate: props.selectedDate, setLastCreatedListId: props.modals.setLastCreatedListId, setPlanTimelineReadItem: props.modals.setPlanTimelineReadItem, setRescheduleTask: props.modals.setRescheduleTask, setShowCreateListFromTask: props.modals.setShowCreateListFromTask, setShowCreateTaskModal: props.modals.setShowCreateTaskModal, showCreateListFromTask: props.modals.showCreateListFromTask, showCreateTaskModal: props.modals.showCreateTaskModal, tags: props.tags, taskLists: props.taskLists };
}

function getModalActionProps(props) {
  return { addEvent: props.addEvent, createTask, createTaskList, deleteTask, fetchTaskLists, handleTimelineDelete: props.reschedule.handleTimelineDelete, openModal: props.openModal, refetchTasks: props.refetchTasks, setTaskLists: props.setTaskLists, showToast: props.toast.showToast, updateTask };
}

function getTaskSlotActions(props) {
  return { getTaskCategoryColor: (task) => getTaskCategoryColor(task, props.getTag), getTaskCategoryPill: (task) => getTaskPillLabel(task, props), handleTaskWidgetComplete: props.handleTaskWidgetComplete, hasTimerSession: props.hasTimerSession, onDeleteTask: props.deleteTaskAndRefresh, onEditTask: props.modals.setRescheduleTask, onInlineTaskEdit: props.handleInlineTaskEdit, onStartFocus: () => props.navigate("/timer", { state: { fromTaskPlay: true } }), setShowAllTaskWidgetTasks: () => {} };
}

function getTaskSlotData(props) {
  return { displayName: props.displayName, isToday: isToday(props.selectedDate), showAllTaskWidgetTasks: false, styles: taskWidgetStyles, taskLists: props.taskLists, taskWidgetDueTodayCount: props.state.taskWidgetDueTodayCount, taskWidgetItemsOnly: props.state.taskWidgetItemsOnly, taskWidgetList: props.state.taskWidgetList, taskWidgetOverdueCount: props.state.taskWidgetOverdueCount, taskWidgetRef: props.taskWidgetRef, taskWidgetSpineCompletedPct: props.state.taskWidgetSpineCompletedPct };
}
