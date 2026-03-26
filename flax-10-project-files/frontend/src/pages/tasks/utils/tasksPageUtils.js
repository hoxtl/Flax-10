/*
 * Helpers for TasksPage: date helpers, filtered tasks, and handler builders.
 */

import { buildDateBounds } from "./taskFeedDataUtils";

export function getTodayEndISO() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function getTomorrowEndISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function showInfoToast(state, message, duration = 3000) {
  state.setToastInfo(message);
  setTimeout(() => state.setToastInfo(null), duration);
}

function showErrorToast(state, message, duration = 3500) {
  state.setToastError(message);
  setTimeout(() => state.setToastError(null), duration);
}

function filterByListOrId(tasks, activeListId, filterListIds) {
  if (filterListIds?.length > 0) {
    const set = new Set(filterListIds.map(String));
    return tasks.filter((t) => set.has(String(t.task_list)));
  }
  if (activeListId) return tasks.filter((t) => String(t.task_list) === String(activeListId));
  return tasks;
}

export function filterTasksByListAndFilter(tasks, activeListId, activeFilter, filterListIds) {
  const { dayStart, todayEnd, weekEnd } = buildDateBounds();
  const filtered = filterByListOrId(tasks, activeListId, filterListIds);
  if (activeFilter === "overdue") return filtered.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < new Date());
  if (activeFilter === "today") return filtered.filter((t) => t.due_date && new Date(t.due_date) >= dayStart && new Date(t.due_date) <= todayEnd);
  if (activeFilter === "this_week") return filtered.filter((t) => t.due_date && new Date(t.due_date) >= dayStart && new Date(t.due_date) <= weekEnd);
  if (activeFilter === "later") return filtered.filter((t) => t.due_date && new Date(t.due_date) > weekEnd);
  return filtered;
}

function handleUndoAddTask(state, tasksApi) {
  if (!state.toastUndo) return;
  tasksApi.removeTask(state.toastUndo.taskId);
  state.setToastUndo(null);
}

async function handleEditTaskImpl(state, listsApi, tasksApi, taskId, data, meta) {
  const updated = await tasksApi.editTask(taskId, data);
  if (meta?.source === "context-menu" && meta?.action === "move-list") {
    const toListName = meta?.listName || listsApi.lists.find((l) => String(l.id) === String(updated?.task_list ?? data?.task_list))?.name || "new list";
    showInfoToast(state, `Task moved to ${toListName}.`);
    return updated;
  }
  if (meta?.source === "context-menu" && meta?.action === "set-due-date") {
    showInfoToast(state, data?.due_date ? "Task due date updated." : "Task due date removed.");
    return updated;
  }
  return updated;
}

async function handleDeleteListImpl(state, listsApi, listId) {
  const listName = listsApi.lists.find((list) => String(list.id) === String(listId))?.name || "List";
  await listsApi.removeList(listId);
  showInfoToast(state, `"${listName}" deleted.`);
  if (state.activeListId === listId) {
    state.setActiveListId(null);
    state.setActiveFilter("all");
  }
}

export function buildTasksPageHandlers(state, listsApi, tasksApi) {
  return {
    handleUndoAddTask: () => handleUndoAddTask(state, tasksApi),
    handleDeleteTask: async (taskId) => {
      state.setToastDelete(true);
      setTimeout(() => state.setToastDelete(false), 3500);
      await tasksApi.removeTask(taskId);
    },
    handleEditTask: (taskId, data, meta) => handleEditTaskImpl(state, listsApi, tasksApi, taskId, data, meta),
    handleDeleteList: (listId) => handleDeleteListImpl(state, listsApi, listId),
    handleUnarchiveList: async (listId) => { await listsApi.restoreList(listId); tasksApi.reload(); },
    handlePermanentlyDeleteList: async (listId) => {
      const listName = listsApi.archivedLists.find((list) => String(list.id) === String(listId))?.name || "List";
      await listsApi.permanentlyDeleteList(listId);
      showInfoToast(state, `"${listName}" permanently deleted.`);
    },
  };
}

export function buildTasksPageViewProps(state, listsApi, tasksApi, handlers, filteredTasks, defaultDueDateForNewTask, activeModuleCode) {
  const loading = listsApi.loading || tasksApi.initialLoading;
  const sidebarProps = { lists: listsApi.lists, tasks: tasksApi.tasks, activeListId: state.activeListId, activeFilter: state.activeFilter, onSelectList: (id) => { state.setActiveListId(id); state.setFilterListIds([]); }, onSelectFilter: state.setActiveFilter, onNewList: () => state.setShowListModal(true), onDeleteList: handlers.handleDeleteList, onRenameList: listsApi.renameList, onUnarchiveList: handlers.handleUnarchiveList, onPermanentlyDeleteList: handlers.handlePermanentlyDeleteList, archivedLists: listsApi.archivedLists };
  const feedProps = { tasks: filteredTasks, allTasks: tasksApi.tasks, lists: listsApi.lists, activeFilter: state.activeFilter, activeListId: state.activeListId, activeModuleCode, defaultDueDateForNewTask, onPlanTomorrow: () => { state.setTaskModalDueDate(getTomorrowEndISO()); state.setShowTaskModal(true); }, filterListIds: state.filterListIds, onToggleComplete: tasksApi.toggleComplete, onDeleteTask: handlers.handleDeleteTask, onEditTask: handlers.handleEditTask, onCreateTask: () => { state.setTaskModalDueDate(null); state.setShowTaskModal(true); }, onAddTask: async (data) => { const created = await tasksApi.addTask(data); if (created) { state.setToastUndo({ taskId: created.id, title: created.title }); setTimeout(() => state.setToastUndo(null), 5000); } }, onListError: (msg) => showErrorToast(state, msg), onFilterByList: state.setFilterListIds, onReloadTasks: tasksApi.reload, };
  const taskModalProps = { lists: listsApi.lists, defaultListId: state.activeListId, defaultDueDate: state.taskModalDueDate ?? defaultDueDateForNewTask, onOpenCreateList: () => state.setShowCreateListFromTask(true), newListIdCreated: state.lastCreatedListId, onSave: async (data) => { const created = await tasksApi.addTask(data); state.setToastUndo(created ? { taskId: created.id, title: created.title } : null); if (created) setTimeout(() => state.setToastUndo(null), 5000); }, onClose: () => { state.setShowTaskModal(false); state.setLastCreatedListId(null); state.setTaskModalDueDate(null); } };
  const listModalProps = { onSave: listsApi.addList, onClose: () => state.setShowListModal(false) };
  const createListFromTaskProps = { onSave: async (data) => { const created = await listsApi.addList(data); if (created?.id) state.setLastCreatedListId(created.id); state.setShowCreateListFromTask(false); }, onClose: () => state.setShowCreateListFromTask(false) };
  return { loading, sidebarProps, feedProps, showTaskModal: state.showTaskModal, taskModalProps, toastUndo: state.toastUndo, toastDelete: state.toastDelete, toastInfo: state.toastInfo, toastError: state.toastError, handleUndoAddTask: handlers.handleUndoAddTask, setToastUndo: state.setToastUndo, setToastDelete: state.setToastDelete, setToastInfo: state.setToastInfo, setToastError: state.setToastError, showListModal: state.showListModal, listModalProps, showCreateListFromTask: state.showCreateListFromTask, createListFromTaskProps };
}
