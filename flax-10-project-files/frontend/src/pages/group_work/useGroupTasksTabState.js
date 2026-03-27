/*
 * Group work tasks tab state hooks.
 */

import { useEffect, useState, useRef } from "react";
import { getAuthHeaders } from "./hooks/groupWorkHooks";
import { calcCompletionSegments } from "./utils/taskStatsUtils";
import { sortTasks } from "./utils/taskUtils";

function useFetchTasks(projectId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tasks/?group_project=${projectId}`, { headers: getAuthHeaders() })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        setTasks(data);
        setLoading(false);
      });
  }, [projectId]);

  return { tasks, setTasks, loading };
}

function executeStartDelete(taskId, tasks, { pending, setTasks }) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  setTasks((prev) => prev.filter((t) => t.id !== taskId));
  if (pending.current[taskId]) {
    clearTimeout(pending.current[taskId].timer);
  }
  const timer = setTimeout(async () => {
    await fetch(`/api/tasks/${taskId}/`, { method: "DELETE", headers: getAuthHeaders() });
    delete pending.current[taskId];
  }, 3200);
  pending.current[taskId] = { task, timer };
}

function executeUndoDelete(taskId, { pending, setTasks }) {
  const item = pending.current[taskId];
  if (!item) return;
  clearTimeout(item.timer);
  const task = item.task;
  setTasks((prev) => [...prev, task]);
  delete pending.current[taskId];
}

function usePendingDeletes(setTasks) {
  const pending = useRef({});
  const ctx = { pending, setTasks };
  return {
    startDelete: (taskId, tasks) => executeStartDelete(taskId, tasks, ctx),
    undoDelete: (taskId) => executeUndoDelete(taskId, ctx),
  };
}

function useTaskActions(setTasks) {
  const { startDelete, undoDelete } = usePendingDeletes(setTasks);
  const updateTask = async (taskId, patchData) => {
    const response = await fetch(`/api/tasks/${taskId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(patchData),
    });
    if (response.ok) {
      const updated = await response.json();
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    }
  };

  return { updateTask, deleteTask: startDelete, undoDelete };
}

function buildTaskBody(title, projectId, options) {
  const { due_date, assigned_to, status } = options;
  const body = { title, group_project: projectId, priority: "medium", status: status || "todo" };
  if (due_date) body.due_date = due_date;
  if (assigned_to?.length) body.assigned_to = assigned_to;
  return body;
}

async function createTask(title, projectId, options, setTasks) {
  if (!title) return;
  const body = buildTaskBody(title, projectId, options);
  const response = await fetch(`/api/tasks/`, { method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify(body) });
  if (response.ok) {
    const newTask = await response.json();
    setTasks((prev) => [...prev, newTask]);
  }
}

function useTasks(projectId, members, onStatsUpdate) {
  const { tasks, setTasks, loading } = useFetchTasks(projectId);
  const { updateTask, deleteTask, undoDelete } = useTaskActions(setTasks);
  useEffect(() => { onStatsUpdate?.(calcCompletionSegments(tasks, members)); }, [tasks, members, onStatsUpdate]);
  const addTask = (title, options = {}) => createTask(title, projectId, options, setTasks);
  const handleDelete = (id) => deleteTask(id, tasks);
  const handleUndo = (id) => undoDelete(id);
  return { tasks, loading, addTask, updateTask, deleteTask: handleDelete, undoDelete: handleUndo };
}

function useFilteredTasks(tasks, filterUsers) {
  if (filterUsers.length === 0) return sortTasks(tasks);
  const filtered = tasks.filter((task) =>
    (task.assignees_info || []).some((assignee) => filterUsers.includes(String(assignee.id))),
  );
  return sortTasks(filtered);
}

function useSearchFilteredTasks(tasks, searchTerm) {
  if (!searchTerm) return tasks;
  const lower = searchTerm.toLowerCase();
  return tasks.filter((t) => (t.title || "").toLowerCase().includes(lower));
}

function useTaskUIState() {
  const [filterUsers, setFilterUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [taskView, setTaskView] = useState("list");
  const [showAddModal, setShowAddModal] = useState(false);
  return { filterUsers, setFilterUsers, searchTerm, setSearchTerm, taskView, setTaskView, showAddModal, setShowAddModal };
}

export function useGroupTasksTabState(projectId, members, onStatsUpdate) {
  const taskActions = useTasks(projectId, members, onStatsUpdate);
  const ui = useTaskUIState();
  const filtered = useFilteredTasks(taskActions.tasks, ui.filterUsers);
  const searched = useSearchFilteredTasks(filtered, ui.searchTerm);
  return {
    taskActions,
    ...ui,
    sortedTasks: searched,
  };
}
