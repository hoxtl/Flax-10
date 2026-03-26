/*
 * Main container for the task feed page.
 */

import { useMemo } from "react";

import TaskFeedContent from "./TaskFeedContent";
import useTaskFeedData from "../hooks/useTaskFeedData";
import { getTaskFeedSubtitle } from "./TaskFeedSubtitle";
import useTaskFeedResponsive from "./useTaskFeedResponsive";
import { isReadingList } from "../utils/readingListUtils";

function getSectionProps(data, props) {
  return {
    ...data.sectionProps,
    onToggleComplete: props.onToggleComplete,
    onDeleteTask: props.onDeleteTask,
    onEditTask: props.onEditTask,
  };
}

function getActiveList(lists, activeListId) {
  return (lists || []).find((list) => String(list.id) === String(activeListId));
}

function getMobileModalData(props) {
  const sidebarProps = props.sidebarProps || {};
  return {
    sidebarProps,
    modalLists: sidebarProps.lists || props.lists || [],
    modalTasks: sidebarProps.tasks || props.tasks || [],
  };
}

function useTaskFeedSubtitle(isMobile, activeList, readingList) {
  return useMemo(
    () => (isMobile ? "" : getTaskFeedSubtitle(activeList, readingList)),
    [isMobile, activeList, readingList],
  );
}

function useTaskFeedViewModel(props) {
  const responsive = useTaskFeedResponsive();
  const data = useTaskFeedData(props);
  const activeList = getActiveList(props.lists, props.activeListId);
  const readingList = isReadingList(activeList);
  const mobileData = getMobileModalData(props);
  const taskFeedSubtitle = useTaskFeedSubtitle(responsive.isMobile, activeList, readingList);

  return {
    ...responsive,
    ...mobileData,
    data,
    activeList,
    readingList,
    sectionPropsWithHandlers: getSectionProps(data, props),
    taskFeedSubtitle,
  };
}

export default function TaskFeed(props) {
  const vm = useTaskFeedViewModel(props);
  return <TaskFeedContent props={props} vm={vm} />;
}
