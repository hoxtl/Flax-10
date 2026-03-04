import { fetchApi } from "./client.js";

export async function fetchTasks(params = {}) {
  const q = new URLSearchParams(params).toString();
  return fetchApi(q ? `/tasks/?${q}` : "/tasks/");
}

export async function updateTask(id, data) {
  return fetchApi(`/tasks/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createTask(data) {
  return fetchApi("/tasks/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id) {
  return fetchApi(`/tasks/${id}/`, { method: "DELETE" });
}

export async function fetchTaskLists() {
  return fetchApi("/task-lists/");
}

export async function createTaskList(data) {
  return fetchApi("/task-lists/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
