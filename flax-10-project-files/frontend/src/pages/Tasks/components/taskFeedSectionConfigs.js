/*
 * Section config builders for each task feed filter state.
 */

import { SECTION_SHOW_LIMIT } from "./TaskFeedConstants";

function todaySection(data) {
  return {
    title: "Today",
    emoji: "📅",
    tasks: data.today,
    hideDueBadge: true,
    sectionType: "today",
    completedCount: data.completedTodayCount,
    emptyCardProps: data.todayEmptyCardProps,
  };
}

function overdueSection(data) {
  return {
    title: "Overdue",
    emoji: "⚠️",
    tasks: data.overdue,
    hideDueBadge: true,
    isOverdueSection: true,
    sectionType: "overdue",
    completedCount: 0,
  };
}

function overdueFilterSection(data) {
  return {
    title: "Overdue",
    emoji: "⚠️",
    tasks: data.filtered,
    sectionType: "overdue",
    completedCount: 0,
    isOverdueSection: true,
    emptyMessage: "No overdue tasks.",
  };
}

function thisWeekSection(data) {
  return {
    title: "This week",
    emoji: "🗓️",
    tasks: data.thisWeek,
    sectionType: "thisWeek",
    completedCount: data.completedWeekCount,
    emptyMessage: "Nothing else due this week.",
  };
}

function laterSection(data) {
  return {
    title: "Later",
    emoji: "⏳",
    tasks: data.later,
    sectionType: "later",
    completedCount: data.completedLaterCount,
    emptyMessage: "No tasks due later.",
  };
}

function allTasksSection(data) {
  return {
    title: "All tasks",
    emoji: "📋",
    tasks: data.allTasksCombined,
    sectionType: "all",
    completedCount: data.completed.length,
    applyLimit: data.allTasksCombined.length > SECTION_SHOW_LIMIT,
    emptyCardProps: data.allTasksEmptyCardProps,
    emptyMessage: data.allTasksEmptyCardProps
      ? null
      : "No tasks yet. Add one above or use Full Planning.",
  };
}

export function getVisibleSections(activeFilter, data) {
  const sectionsByFilter = {
    today: [data.overdue.length > 0 && overdueSection(data), todaySection(data)],
    overdue: [overdueFilterSection(data)],
    this_week: [todaySection(data), thisWeekSection(data)],
    later: [laterSection(data)],
    all: [allTasksSection(data)],
  };

  return (sectionsByFilter[activeFilter] || sectionsByFilter.all).filter(Boolean);
}
