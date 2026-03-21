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
  const enrolledModules = useMemo(() => getEnrolledModules(modulesList, enrollments, isEnrolledIn), [enrollments, modulesList]);
  const tomorrowFirstEvent = useMemo(() => getTomorrowFirstEvent(allCalEvents, selectedDate), [allCalEvents, selectedDate]);
  const sortedEvents = useMemo(() => getSortedEvents(dayEvents), [dayEvents]);
  const pastItems = useMemo(() => getPastItems(sortedEvents, now), [now, sortedEvents]);
  const upcomingItems = useMemo(() => getUpcomingItems(sortedEvents, pastItems), [pastItems, sortedEvents]);
  const pastIdsShownInTimeline = useMemo(() => getPastIdsShownInTimeline(pastItems, upcomingItems), [pastItems, upcomingItems]);
  const missedItems = useMemo(() => getMissedItems(selectedDate, pastItems, pastIdsShownInTimeline), [pastIdsShownInTimeline, pastItems, selectedDate]);
  const tasksDueToday = useMemo(() => getTasksDueToday(allTasks, now), [allTasks, now]);
  const navigatorContext = useMemo(() => getNavigatorData(now, selectedDate, sortedEvents), [now, selectedDate, sortedEvents]);
  const suggestableTasks = useMemo(() => getSuggestableTasks(dayTasks, upcomingItems), [dayTasks, upcomingItems]);
  const deadlineSuggestions = useMemo(() => getDeadlineSuggestions(selectedDate, upcomingDeadlines, sortedEvents, Date.now()), [selectedDate, sortedEvents, upcomingDeadlines]);
  const overdueTasksForNow = useMemo(() => getOverdueTasksForNow(tasksDueToday, getTag, now), [getTag, now, tasksDueToday]);
  const taskWidgetList = useMemo(() => getTaskWidgetList(allTasks, now), [allTasks, now]);
  const taskWidgetItemsOnly = useMemo(() => taskWidgetList.filter((item) => item.type === "task"), [taskWidgetList]);
  const taskWidgetCompletedCount = useMemo(() => getTaskWidgetCompletedCount(taskWidgetItemsOnly), [taskWidgetItemsOnly]);
  const todayFreeWindows = useMemo(() => getTodayFreeWindows(selectedDate, sortedEvents), [selectedDate, sortedEvents]);
  const freeWindowLabel = useMemo(() => getFreeWindowLabel(todayFreeWindows), [todayFreeWindows]);
  const homepageRecommendation = useMemo(() => getHomepageRecommendation(taskWidgetItemsOnly, upcomingDeadlines, freeWindowLabel), [freeWindowLabel, taskWidgetItemsOnly, upcomingDeadlines]);

  return {
    deadlineSuggestions,
    enrolledModules,
    homepageRecommendation,
    missedItems,
    navigatorContext,
    overdueTasksForNow,
    sortedEvents,
    suggestableTasks,
    taskWidgetDueTodayCount: getTaskWidgetDueTodayCount(taskWidgetItemsOnly, now),
    taskWidgetItemsOnly,
    taskWidgetList,
    taskWidgetOverdueCount: 0,
    taskWidgetSpineCompletedPct: getTaskWidgetSpineCompletedPct(taskWidgetItemsOnly, taskWidgetCompletedCount),
    tasksDueToday,
    tomorrowFirstEvent,
  };
}
