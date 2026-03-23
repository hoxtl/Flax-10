import { useEffect, useState } from "react";
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

function useTaskActions(setTasks) {
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

  const deleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    await fetch(`/api/tasks/${taskId}/`, { method: "DELETE", headers: getAuthHeaders() });
  };

  return { updateTask, deleteTask };
}

function useTasks(projectId, members, onStatsUpdate) {
  const { tasks, setTasks, loading } = useFetchTasks(projectId);
  const { updateTask, deleteTask } = useTaskActions(setTasks);

  useEffect(() => {
    onStatsUpdate?.(calcCompletionSegments(tasks, members));
  }, [tasks, members, onStatsUpdate]);

  const addTask = async (title, { due_date, assigned_to, status } = {}) => {
    if (!title) return;
    const body = { title, group_project: projectId, priority: "medium", status: status || "todo" };
    if (due_date) body.due_date = due_date;
    if (assigned_to?.length) body.assigned_to = assigned_to;

    const response = await fetch(`/api/tasks/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      const created = await response.json();
      setTasks((prev) => [...prev, created]);
    }
  };

  return { tasks, loading, addTask, updateTask, deleteTask };
}

function useFilteredTasks(tasks, filterUsers) {
  if (filterUsers.length === 0) {
    return sortTasks(tasks);
  }

  const filtered = tasks.filter((task) =>
    (task.assignees_info || []).some((assignee) => filterUsers.includes(String(assignee.id))),
  );
  return sortTasks(filtered);
}

export function useGroupTasksTabState(projectId, members, onStatsUpdate) {
  const taskActions = useTasks(projectId, members, onStatsUpdate);
  const [filterUsers, setFilterUsers] = useState([]);
  const [taskView, setTaskView] = useState("list");
  const [showAddModal, setShowAddModal] = useState(false);
  const sortedTasks = useFilteredTasks(taskActions.tasks, filterUsers);

  return {
    taskActions,
    filterUsers,
    setFilterUsers,
    taskView,
    setTaskView,
    showAddModal,
    setShowAddModal,
    sortedTasks,
  };
}
