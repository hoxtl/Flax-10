/**
 * Helpers for TasksPage: date helpers, filtered tasks, and handler builders.
 */

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

function getDateBounds() {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(todayEnd);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return { dayStart, todayEnd, weekEnd };
}

export function filterTasksByListAndFilter(tasks, activeListId, activeFilter, filterListIds) {
  const { dayStart, todayEnd, weekEnd } = getDateBounds();
  let filtered = tasks;
  if (filterListIds?.length > 0) {
    const set = new Set(filterListIds.map(String));
    filtered = tasks.filter((t) => set.has(String(t.task_list)));
  } else if (activeListId) {
    filtered = tasks.filter((t) => String(t.task_list) === String(activeListId));
  } else if (activeFilter !== "all" && activeFilter !== "today" && activeFilter !== "this_week" && activeFilter !== "later" && activeFilter !== "overdue") {
    // If we're on a specific list or filter that implies a task_list, we might keep filtering.
    // But for "All tasks", "Today", "This Week", etc., we should show ALL relevant tasks (including group ones).
    // The current logic already handles this because 'filtered' starts as 'tasks'.
  }

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

function handleDeleteListImpl(state, listsApi, listId) {
  listsApi.removeList(listId);
  if (state.activeListId === listId) {
    state.setActiveListId(null);
    state.setActiveFilter("all");
  }
}

export function buildTasksPageHandlers(state, listsApi, tasksApi) {
  return {
    handleUndoAddTask: () => handleUndoAddTask(state, tasksApi),
    handleDeleteTask: (taskId) => { tasksApi.removeTask(taskId); state.setToastDelete(true); setTimeout(() => state.setToastDelete(false), 3500); },
    handleEditTask: (taskId, data, meta) => handleEditTaskImpl(state, listsApi, tasksApi, taskId, data, meta),
    handleDeleteList: (listId) => handleDeleteListImpl(state, listsApi, listId),
    handleUnarchiveList: async (listId) => { await listsApi.restoreList(listId); tasksApi.reload(); },
    handlePermanentlyDeleteList: async (listId) => {
      await listsApi.permanentlyDeleteList(listId);
    },
  };
}

export function buildTasksPageViewProps(state, listsApi, tasksApi, handlers, filteredTasks, defaultDueDateForNewTask, activeModuleCode) {
  const loading = listsApi.loading || tasksApi.initialLoading;
  const sidebarProps = { lists: listsApi.lists, tasks: tasksApi.tasks, activeListId: state.activeListId, activeFilter: state.activeFilter, onSelectList: (id) => { state.setActiveListId(id); state.setFilterListIds([]); }, onSelectFilter: state.setActiveFilter, onNewList: () => state.setShowListModal(true), onDeleteList: handlers.handleDeleteList, onRenameList: listsApi.renameList, onUnarchiveList: handlers.handleUnarchiveList, onPermanentlyDeleteList: handlers.handlePermanentlyDeleteList, archivedLists: listsApi.archivedLists };
  const feedProps = { tasks: filteredTasks, lists: listsApi.lists, activeFilter: state.activeFilter, activeListId: state.activeListId, activeModuleCode, defaultDueDateForNewTask, onPlanTomorrow: () => { state.setTaskModalDueDate(getTomorrowEndISO()); state.setShowTaskModal(true); }, filterListIds: state.filterListIds, onToggleComplete: tasksApi.toggleComplete, onDeleteTask: handlers.handleDeleteTask, onEditTask: handlers.handleEditTask, onCreateTask: () => { state.setTaskModalDueDate(null); state.setShowTaskModal(true); }, onAddTask: async (data) => { const created = await tasksApi.addTask(data); if (created) { state.setToastUndo({ taskId: created.id, title: created.title }); setTimeout(() => state.setToastUndo(null), 5000); } }, onFilterByList: state.setFilterListIds, onReloadTasks: tasksApi.reload, };
  const taskModalProps = { lists: listsApi.lists, defaultListId: state.activeListId, defaultDueDate: state.taskModalDueDate ?? defaultDueDateForNewTask, onOpenCreateList: () => state.setShowCreateListFromTask(true), newListIdCreated: state.lastCreatedListId, onSave: async (data) => { const created = await tasksApi.addTask(data); state.setToastUndo(created ? { taskId: created.id, title: created.title } : null); if (created) setTimeout(() => state.setToastUndo(null), 5000); }, onClose: () => { state.setShowTaskModal(false); state.setLastCreatedListId(null); state.setTaskModalDueDate(null); } };
  const listModalProps = { onSave: listsApi.addList, onClose: () => state.setShowListModal(false) };
  const createListFromTaskProps = { onSave: async (data) => { const created = await listsApi.addList(data); if (created?.id) state.setLastCreatedListId(created.id); state.setShowCreateListFromTask(false); }, onClose: () => state.setShowCreateListFromTask(false) };
  return { loading, sidebarProps, feedProps, showTaskModal: state.showTaskModal, taskModalProps, toastUndo: state.toastUndo, toastDelete: state.toastDelete, toastInfo: state.toastInfo, handleUndoAddTask: handlers.handleUndoAddTask, setToastUndo: state.setToastUndo, setToastDelete: state.setToastDelete, setToastInfo: state.setToastInfo, showListModal: state.showListModal, listModalProps, showCreateListFromTask: state.showCreateListFromTask, createListFromTaskProps };
}
