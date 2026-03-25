/**
 * Homepage derived state hook.
 */

import { useMemo } from "react";
import { isEnrolledIn } from "../../../components/Modules/utils/moduleUtils";
import {
  getDeadlineSuggestions,
  getEnrolledModules,
  getFreeWindowLabel,
  getHomepageRecommendation,
  getMissedItems,
  getNavigatorData,
  getOverdueTasksForNow,
  getPastIdsShownInTimeline,
  getPastItems,
  getSortedEvents,
  getSuggestableTasks,
  getTaskWidgetCompletedCount,
  getTaskWidgetDisplayList,
  getTaskWidgetDueTodayCount,
  getTaskWidgetList,
  getTaskWidgetSpineCompletedPct,
  getTasksDueToday,
  getTodayFreeWindows,
  getTomorrowFirstEvent,
  getUpcomingItems,
} from "../utils/homepageViewModel";

export function useHomepageViewModel(props) {
  const { allCalEvents, allTasks, dayEvents, dayTasks, enrollments, getTag, modulesList, now, selectedDate, upcomingDeadlines } = props;
  const timelineModel = useHomepageTimelineModel({ allCalEvents, dayEvents, dayTasks, getTag, now, selectedDate, upcomingDeadlines });
  const taskModel = useHomepageTaskModel({ allTasks, now });
  const enrolledModules = useMemo(() => getEnrolledModules(modulesList, enrollments, isEnrolledIn), [enrollments, modulesList]);
  const homepageRecommendation = useHomepageRecommendation(taskModel.taskWidgetItemsOnly, upcomingDeadlines, selectedDate, timelineModel.sortedEvents);
  return buildHomepageViewModel(enrolledModules, homepageRecommendation, taskModel, timelineModel);
}

function useHomepageTimelineModel({ allCalEvents, dayEvents, dayTasks, getTag, now, selectedDate, upcomingDeadlines }) {
  const tomorrowFirstEvent = useMemo(() => getTomorrowFirstEvent(allCalEvents, selectedDate), [allCalEvents, selectedDate]);
  const sortedEvents = useMemo(() => getSortedEvents(dayEvents), [dayEvents]);
  const pastItems = useMemo(() => getPastItems(sortedEvents, now), [now, sortedEvents]);
  const upcomingItems = useMemo(() => getUpcomingItems(sortedEvents, pastItems), [pastItems, sortedEvents]);
  const pastIdsShownInTimeline = useMemo(() => getPastIdsShownInTimeline(pastItems, upcomingItems), [pastItems, upcomingItems]);
  const missedItems = useMemo(() => getMissedItems(selectedDate, pastItems, pastIdsShownInTimeline), [pastIdsShownInTimeline, pastItems, selectedDate]);
  const navigatorContext = useMemo(() => getNavigatorData(now, selectedDate, sortedEvents), [now, selectedDate, sortedEvents]);
  return buildTimelineModel({ getTag, now, selectedDate, upcomingDeadlines, dayTasks, sortedEvents, tomorrowFirstEvent, pastItems, upcomingItems, missedItems, navigatorContext });
}

function buildTimelineModel({ getTag, now, selectedDate, upcomingDeadlines, dayTasks, sortedEvents, tomorrowFirstEvent, pastItems, upcomingItems, missedItems, navigatorContext }) {
  const tasksDueToday = getTasksDueToday(dayTasks, now);
  return {
    deadlineSuggestions: getDeadlineSuggestions(selectedDate, upcomingDeadlines, sortedEvents, Date.now()),
    missedItems,
    navigatorContext,
    overdueTasksForNow: getOverdueTasksForNow(tasksDueToday, getTag, now),
    sortedEvents,
    suggestableTasks: getSuggestableTasks(dayTasks, upcomingItems),
    tasksDueToday,
    tomorrowFirstEvent,
  };
}

function useHomepageTaskModel({ allTasks, now }) {
  const taskWidgetItemsOnly = useMemo(() => getTaskWidgetList(allTasks, now), [allTasks, now]);
  const taskWidgetList = useMemo(() => getTaskWidgetDisplayList(allTasks, now, taskWidgetItemsOnly), [allTasks, now, taskWidgetItemsOnly]);
  const taskWidgetCompletedCount = useMemo(() => getTaskWidgetCompletedCount(taskWidgetItemsOnly), [taskWidgetItemsOnly]);
  return {
    taskWidgetDueTodayCount: getTaskWidgetDueTodayCount(taskWidgetItemsOnly, now),
    taskWidgetItemsOnly,
    taskWidgetList,
    taskWidgetOverdueCount: 0,
    taskWidgetSpineCompletedPct: getTaskWidgetSpineCompletedPct(taskWidgetItemsOnly, taskWidgetCompletedCount),
  };
}

function useHomepageRecommendation(taskWidgetItemsOnly, upcomingDeadlines, selectedDate, sortedEvents) {
  const todayFreeWindows = useMemo(() => getTodayFreeWindows(selectedDate, sortedEvents), [selectedDate, sortedEvents]);
  const freeWindowLabel = useMemo(() => getFreeWindowLabel(todayFreeWindows), [todayFreeWindows]);
  return useMemo(() => getHomepageRecommendation(taskWidgetItemsOnly, upcomingDeadlines, freeWindowLabel), [freeWindowLabel, taskWidgetItemsOnly, upcomingDeadlines]);
}

function buildHomepageViewModel(enrolledModules, homepageRecommendation, taskModel, timelineModel) {
  return {
    ...timelineModel,
    ...taskModel,
    enrolledModules,
    homepageRecommendation,
  };
}
