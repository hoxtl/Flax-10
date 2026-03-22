/*
 * GroupWork API helpers.
 */

/** Returns the Bearer token header for authenticated requests. */
export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Token ${token}` } : {};
}

/** Returns JSON content-type combined with auth headers. */
export function getJsonHeaders() {
  return { "Content-Type": "application/json", ...getAuthHeaders() };
}

async function parseJsonResponse(response) {
  if (!response.ok) return null;
  return response.json();
}

/** Fetches a JSON resource and returns the parsed body, or null on failure. */
export async function fetchJSON(url) {
  const data = await parseJsonResponse(await fetch(url, { headers: getJsonHeaders() }));
  return Array.isArray(data) ? data : (data || null);
}

/** Returns all group projects for the authenticated user. */
export function fetchGroupProjects() {
  return fetchJSON("/api/group-work/projects/");
}

/** Returns all members of a given project. */
export function fetchProjectMembers(projectId) {
  return fetchJSON(`/api/group-work/projects/${projectId}/members/`);
}

/** Sends a partial update to a project and returns the updated project. */
export async function patchGroupProject(projectId, patch) {
  const response = await fetch(`/api/group-work/projects/${projectId}/`, {
    method: "PATCH",
    headers: getJsonHeaders(),
    body: JSON.stringify(patch),
  });
  return parseJsonResponse(response);
}

/** Deletes a group project and returns the raw fetch response. */
export function deleteGroupProject(projectId) {
  return fetch(`/api/group-work/projects/${projectId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

/** Removes a member from a project and returns the raw fetch response. */
export function deleteProjectMember(projectId, membershipId) {
  return fetch(`/api/group-work/projects/${projectId}/members/${membershipId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

/** Creates a new group project and returns the created project, or null on failure. */
export async function createGroupProject(project) {
  const response = await fetch("/api/group-work/projects/", {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(project),
  });
  return parseJsonResponse(response);
}

/** Adds a user to a project as a member and returns the membership, or null on failure. */
export async function addProjectMember(projectId, userId) {
  const response = await fetch(`/api/group-work/projects/${projectId}/members/`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify({ user: userId, role: "member" }),
  });
  return parseJsonResponse(response);
}
