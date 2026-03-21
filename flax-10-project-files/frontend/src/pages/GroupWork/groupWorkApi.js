/*
 * GroupWork API helpers.
 */

export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Token ${token}` } : {};
}

export function getJsonHeaders() {
  return { "Content-Type": "application/json", ...getAuthHeaders() };
}

async function parseJsonResponse(response) {
  if (!response.ok) return null;
  return response.json();
}

export async function fetchJSON(url) {
  const data = await parseJsonResponse(await fetch(url, { headers: getJsonHeaders() }));
  return Array.isArray(data) ? data : (data || null);
}

export function fetchGroupProjects() {
  return fetchJSON("/api/group-work/projects/");
}

export function fetchProjectMembers(projectId) {
  return fetchJSON(`/api/group-work/projects/${projectId}/members/`);
}

export async function patchGroupProject(projectId, patch) {
  const response = await fetch(`/api/group-work/projects/${projectId}/`, {
    method: "PATCH",
    headers: getJsonHeaders(),
    body: JSON.stringify(patch),
  });
  return parseJsonResponse(response);
}

export function deleteGroupProject(projectId) {
  return fetch(`/api/group-work/projects/${projectId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

export function deleteProjectMember(projectId, membershipId) {
  return fetch(`/api/group-work/projects/${projectId}/members/${membershipId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

export async function createGroupProject(project) {
  const response = await fetch("/api/group-work/projects/", {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(project),
  });
  return parseJsonResponse(response);
}

export async function addProjectMember(projectId, userId) {
  const response = await fetch(`/api/group-work/projects/${projectId}/members/`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify({ user: userId, role: "member" }),
  });
  return parseJsonResponse(response);
}
