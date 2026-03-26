/*
 * Homepage controller hook.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCalendar, useCalendarDispatch, useEventModal, useEventPopup } from "../../../context/CalendarContext";
import { useCalendarEvents, useEventActions } from "../../../components/calendar/hooks/useCalendarEvents";
import { useTags } from "../../../context/TagContext";
import { useTaskCompletion } from "../../../context/TaskCompletionContext";
import { useToast } from "../../../context/ToastContext";
import { useTimerContext } from "../../../context/TimerContext";
import { useHomeData } from "./useHomeData";
import { useHomepageActions } from "./useHomepageActions";
import { useHomepageDisplayName } from "./useHomepageDisplayName";
import { useHomepageModals } from "./useHomepageModals";
import { useHomepageReschedule } from "./useHomepageReschedule";
import { useHomepageResources } from "./useHomepageResources";
import { useHomepageToast } from "./useHomepageToast";
import { useHomepageViewModel } from "./useHomepageViewModel";
import { useHomepageEventBootstrap, useHomepageNow, useHomepageSelection, useTimerCompletionSound } from "./useHomepagePageEffects";

export function useHomepageController(defaultShowCreateTaskModal, defaultPlanTimelineReadItem) {
  const shared = useHomepageShared(defaultShowCreateTaskModal, defaultPlanTimelineReadItem);
  const state = useHomepageDerivedState(shared);
  const actions = useHomepageActions(createActionProps(shared));
  const reschedule = useHomepageReschedule(createRescheduleProps(shared, state, actions));
  return buildHomepageController(shared, state, actions, reschedule);
}

function useHomepageShared(defaultShowCreateTaskModal, defaultPlanTimelineReadItem) {
  const navigate = useNavigate();
  const toastApi = useToast();
  const shared = useHomepageSharedState(defaultShowCreateTaskModal, defaultPlanTimelineReadItem, toastApi);
  const [completedEventIds, setCompletedEventIds] = useState(new Set());
  return { ...shared, completedEventIds, navigate, setCompletedEventIds, toastApi };
}

function useHomepageDerivedState(shared) {
  useHomepageSelection(shared.dispatch);
  useHomepageEventBootstrap(shared.calendar.events, shared.loadEvents, shared.calendar.selectedDate);
  useTimerCompletionSound(shared.timer.isActive, shared.timer.timeLeft, shared.timer.mode);
  const state = useHomepageViewModel(buildViewModelProps(shared));
  return { homeData: shared.homeData, state };
}

function buildViewModelProps(shared) {
  return {
    allCalEvents: shared.calendar.events,
    allTasks: shared.homeData.allTasks,
    dayEvents: shared.homeData.dayEvents,
    dayTasks: shared.homeData.dayTasks,
    enrollments: shared.resources.enrollments,
    getTag: shared.tags.getTag,
    modulesList: shared.resources.modulesList,
    now: shared.now,
    selectedDate: shared.calendar.selectedDate,
    upcomingDeadlines: shared.resources.upcomingDeadlines,
  };
}

function createActionProps(shared) {
  return {
    addEvent: shared.eventActions.addEvent,
    getTag: shared.tags.getTag,
    loadEvents: shared.loadEvents,
    openPopup: shared.openPopup,
    refetchTasks: shared.homeData.refetchTasks,
    removePendingTask: shared.homeData.removePendingTask,
    selectedDate: shared.calendar.selectedDate,
    showCompletionToast: shared.completion.showCompletionToast,
    showToast: shared.toast.showToast,
  };
}

function createRescheduleProps(shared, state, actions) {
  return {
    addEvent: shared.eventActions.addEvent,
    deleteTask: actions.deleteTaskAndRefresh,
    editEvent: shared.eventActions.editEvent,
    loadEvents: shared.loadEvents,
    missedItems: state.state.missedItems,
    overdueTasksForNow: state.state.overdueTasksForNow,
    refetchTasks: shared.homeData.refetchTasks,
    removeEvent: shared.eventActions.removeEvent,
    selectedDate: shared.calendar.selectedDate,
    showToast: shared.toast.showToast,
    sortedEvents: state.state.sortedEvents,
    upcomingDeadlines: shared.resources.upcomingDeadlines,
  };
}

function buildHomepageController(shared, derived, actions, reschedule) {
  return { ...buildBaseController(shared, derived, reschedule), ...actions };
}

function useHomepageSharedState(defaultShowCreateTaskModal, defaultPlanTimelineReadItem, toastApi) {
  const calendar = useCalendar();
  return {
    calendar,
    completion: useTaskCompletion(),
    dispatch: useCalendarDispatch(),
    displayName: useHomepageDisplayName(),
    eventActions: useEventActions(),
    homeData: useHomeData(calendar.selectedDate),
    loadEvents: useCalendarEvents().loadEvents,
    modals: useHomepageModals(defaultShowCreateTaskModal, defaultPlanTimelineReadItem),
    now: useHomepageNow(),
    openModal: useEventModal().openModal,
    openPopup: useEventPopup().openPopup,
    resources: useHomepageResources(),
    tags: useTags(),
    timer: useTimerContext(),
    toast: useHomepageToast(toastApi),
  };
}

function buildBaseController(shared, derived, reschedule) {
  return { ...getControllerCore(shared, derived, reschedule), ...getControllerTimer(shared), ...getControllerResources(shared) };
}

function getControllerCore(shared, derived, reschedule) {
  return { addEvent: shared.eventActions.addEvent, calendarEvents: shared.calendar.allEvents?.length ? shared.calendar.allEvents : shared.calendar.events, completedEventIds: shared.completedEventIds, dayTasks: shared.homeData.dayTasks, displayName: shared.displayName, getTag: shared.tags.getTag, homeDataLoading: shared.homeData.loading, modals: shared.modals, navigate: shared.navigate, now: shared.now, openModal: shared.openModal, refetchTasks: shared.homeData.refetchTasks, reschedule, selectedDate: shared.calendar.selectedDate, setCompletedEventIds: shared.setCompletedEventIds, setTaskLists: shared.resources.setTaskLists, state: derived.state };
}

function getControllerResources(shared) {
  return { tags: shared.tags.tags, taskLists: shared.resources.taskLists, toast: { ...shared.toast, toastApi: shared.toastApi }, upcomingDeadlines: shared.resources.upcomingDeadlines };
}

function getControllerTimer(shared) {
  return { breakTime: shared.timer.breakTime, hasTimerSession: shared.timer.isActive, timeLeft: shared.timer.timeLeft, timerMode: shared.timer.mode, timerTask: shared.timer.task, workTime: shared.timer.workTime };
}
