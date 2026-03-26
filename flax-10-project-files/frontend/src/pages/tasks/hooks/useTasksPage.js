/*
 * Tasks page state, URL synchronisation, and composed view props.
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

function useListParamEffect(searchParams, setActiveListId) {
  useEffect(() => {
    const listParam = searchParams.get("list");
    if (listParam != null && listParam !== "") setActiveListId(listParam);
  }, [searchParams, setActiveListId]);
}

function useOpenParamEffect(searchParams, setSearchParams, openedRef, setShowTaskModal) {
  useEffect(() => {
    if (searchParams.get("open") !== "fullPlanning" || openedRef.current) return;
    openedRef.current = true;
    setShowTaskModal(true);
    const next = new URLSearchParams(searchParams);
    next.delete("open");
    next.delete("due");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, openedRef, setShowTaskModal]);
}

function applyFilterParam(filterParam, searchParams, setSearchParams, setActiveFilter) {
  setActiveFilter(filterParam);
  const next = new URLSearchParams(searchParams);
  next.delete("filter");
  setSearchParams(next, { replace: true });
}

function useFilterParamEffect(searchParams, setSearchParams, setActiveFilter) {
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam) applyFilterParam(filterParam, searchParams, setSearchParams, setActiveFilter);
  }, [searchParams, setSearchParams, setActiveFilter]);
}

function useTasksPageEffects(state) {
  useListParamEffect(state.searchParams, state.setActiveListId);
  useOpenParamEffect(state.searchParams, state.setSearchParams, state.openedFullPlanningFromUrl, state.setShowTaskModal);
  useFilterParamEffect(state.searchParams, state.setSearchParams, state.setActiveFilter);
}

export default function useTasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const listsApi = useTaskLists();
  const tasksApi = useTasks();
  const state = useTasksPageState(searchParams, setSearchParams);
  useTasksPageEffects(state);
  const filteredTasks = useMemo(() => filterTasksByListAndFilter(tasksApi.tasks, state.activeListId, state.activeFilter, state.filterListIds), [tasksApi.tasks, state.activeListId, state.activeFilter, state.filterListIds]);
  const defaultDueDateForNewTask = state.activeFilter === "today" ? getTodayEndISO() : null;
  const activeModuleCode = searchParams.get("module") || null;
  const handlers = useMemo(() => buildTasksPageHandlers(state, listsApi, tasksApi), [state, listsApi, tasksApi]);
  return useMemo(() => buildTasksPageViewProps(state, listsApi, tasksApi, handlers, filteredTasks, defaultDueDateForNewTask, activeModuleCode), [state, listsApi, tasksApi, handlers, filteredTasks, defaultDueDateForNewTask, activeModuleCode]);
}
