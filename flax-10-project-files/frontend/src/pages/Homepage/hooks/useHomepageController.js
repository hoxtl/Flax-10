/**
 * Homepage controller hook.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCalendar, useCalendarDispatch, useEventModal, useEventPopup } from "../../../context/CalendarContext";
import { useCalendarEvents, useEventActions } from "../../../components/Calendar/hooks/useCalendarEvents";
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
  const actions = useHomepageActions(createActionProps(shared, state.homeData.refetchTasks));
  const reschedule = useHomepageReschedule(createRescheduleProps(shared, state, actions));
  return buildHomepageController(shared, state, actions, reschedule);
}

function useHomepageShared(defaultShowCreateTaskModal, defaultPlanTimelineReadItem) {
  const navigate = useNavigate();
  const toastApi = useToast();
  const displayName = useHomepageDisplayName();
  const calendar = useCalendar();
  const dispatch = useCalendarDispatch();
  const { loadEvents } = useCalendarEvents();
  const eventActions = useEventActions();
  const { openModal } = useEventModal();
  const { openPopup } = useEventPopup();
  const tags = useTags();
  const completion = useTaskCompletion();
  const timer = useTimerContext();
  const now = useHomepageNow();
  const modals = useHomepageModals(defaultShowCreateTaskModal, defaultPlanTimelineReadItem);
  const resources = useHomepageResources();
  const toast = useHomepageToast(toastApi);
  const homeData = useHomeData(calendar.selectedDate);
  const [completedEventIds, setCompletedEventIds] = useState(new Set());
  return { calendar, completedEventIds, completion, dispatch, displayName, eventActions, homeData, loadEvents, modals, navigate, now, openModal, openPopup, resources, setCompletedEventIds, tags, timer, toast, toastApi };
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

function createActionProps(shared, refetchTasks) {
  return {
    addEvent: shared.eventActions.addEvent,
    getTag: shared.tags.getTag,
    loadEvents: shared.loadEvents,
    openPopup: shared.openPopup,
    refetchTasks,
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
  };
}

function buildHomepageController(shared, derived, actions, reschedule) {
  return {
    addEvent: shared.eventActions.addEvent,
    breakTime: shared.timer.breakTime,
    completedEventIds: shared.completedEventIds,
    dayTasks: shared.homeData.dayTasks,
    displayName: shared.displayName,
    getTag: shared.tags.getTag,
    hasTimerSession: shared.timer.isActive,
    homeDataLoading: shared.homeData.loading,
    modals: shared.modals,
    navigate: shared.navigate,
    now: shared.now,
    openModal: shared.openModal,
    refetchTasks: shared.homeData.refetchTasks,
    reschedule,
    selectedDate: shared.calendar.selectedDate,
    setCompletedEventIds: shared.setCompletedEventIds,
    setTaskLists: shared.resources.setTaskLists,
    state: derived.state,
    tags: shared.tags.tags,
    taskLists: shared.resources.taskLists,
    timeLeft: shared.timer.timeLeft,
    timerMode: shared.timer.mode,
    timerTask: shared.timer.task,
    toast: { ...shared.toast, toastApi: shared.toastApi },
    upcomingDeadlines: shared.resources.upcomingDeadlines,
    workTime: shared.timer.workTime,
    ...actions,
  };
}
