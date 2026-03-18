/**
 * Hook for TasksPage: composes useTasks, useTaskLists, filtered tasks, and handlers.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import useTasks from "./useTasks";
import useTaskLists from "./useTaskLists";
import { filterTasksByListAndFilter, getTodayEndISO, buildTasksPageHandlers, buildTasksPageViewProps } from "../utils/tasksPageUtils";

function useTasksPageState(searchParams, setSearchParams) {
  const [activeListId, setActiveListId] = useState(null);
  const [filterListIds, setFilterListIds] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalDueDate, setTaskModalDueDate] = useState(null);
  const [showListModal, setShowListModal] = useState(false);
  const [showCreateListFromTask, setShowCreateListFromTask] = useState(false);
  const [lastCreatedListId, setLastCreatedListId] = useState(null);
  const [toastUndo, setToastUndo] = useState(null);
  const [toastDelete, setToastDelete] = useState(false);
  const [toastInfo, setToastInfo] = useState(null);
  const openedFullPlanningFromUrl = useRef(false);
  return { activeListId, setActiveListId, filterListIds, setFilterListIds, activeFilter, setActiveFilter, showTaskModal, setShowTaskModal, taskModalDueDate, setTaskModalDueDate, showListModal, setShowListModal, showCreateListFromTask, setShowCreateListFromTask, lastCreatedListId, setLastCreatedListId, toastUndo, setToastUndo, toastDelete, setToastDelete, toastInfo, setToastInfo, openedFullPlanningFromUrl, searchParams, setSearchParams };
}

function useTasksPageEffects(state, searchParams) {
  useEffect(() => {
    const listParam = searchParams.get("list");
    if (listParam != null && listParam !== "") state.setActiveListId(listParam);
  }, [searchParams, state.setActiveListId]);
  const openParam = searchParams.get("open");
  useEffect(() => {
    if (openParam !== "fullPlanning" || state.openedFullPlanningFromUrl.current) return;
    state.openedFullPlanningFromUrl.current = true;
    state.setShowTaskModal(true);
    const next = new URLSearchParams(searchParams);
    next.delete("open");
    next.delete("due");
    state.setSearchParams(next, { replace: true });
  }, [openParam, searchParams, state]);

  const filterParam = searchParams.get("filter");
  useEffect(() => {
    if (filterParam) {
      state.setActiveFilter(filterParam);
      // Clean up param so it doesn't stick around if user navigates away and back manually
      const next = new URLSearchParams(searchParams);
      next.delete("filter");
      state.setSearchParams(next, { replace: true });
    }
  }, [filterParam, searchParams, state]);
}

export default function useTasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const listsApi = useTaskLists();
  const tasksApi = useTasks();
  const state = useTasksPageState(searchParams, setSearchParams);
  useTasksPageEffects(state, searchParams);
  const filteredTasks = useMemo(() => filterTasksByListAndFilter(tasksApi.tasks, state.activeListId, state.activeFilter, state.filterListIds), [tasksApi.tasks, state.activeListId, state.activeFilter, state.filterListIds]);
  const defaultDueDateForNewTask = state.activeFilter === "today" ? getTodayEndISO() : null;
  const activeModuleCode = searchParams.get("module") || null;
  const handlers = useMemo(() => buildTasksPageHandlers(state, listsApi, tasksApi), [state, listsApi, tasksApi]);
  return useMemo(() => buildTasksPageViewProps(state, listsApi, tasksApi, handlers, filteredTasks, defaultDueDateForNewTask, activeModuleCode), [state, listsApi, tasksApi, handlers, filteredTasks, defaultDueDateForNewTask, activeModuleCode]);
}
