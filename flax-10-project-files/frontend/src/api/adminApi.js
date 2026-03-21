/*
<<<<<<< HEAD
 * Admin actions for managing users, reports, ratifications, and course changes.
=======
 * Admin actions for managing users, teacher requests, reports, and society ratification.
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
 */

import { fetchApi } from "./client";

function postJson(url, data) {
  return fetchApi(url, { method: "POST", body: JSON.stringify(data) });
}

function deleteRequest(url) {
  return fetchApi(url, { method: "DELETE" });
}

// ── Users ────────────────────────────────────────────────────────────────────
export const fetchAdminUsers = () => fetchApi("/admin/users/");

export const banUser = (userId, reason) =>
  postJson(`/admin/users/${userId}/ban/`, { action: "ban", reason });

export const unbanUser = (userId) =>
  postJson(`/admin/users/${userId}/ban/`, { action: "unban" });

<<<<<<< HEAD
=======
// ── Teacher requests ──────────────────────────────────────────────────────────
export const fetchTeacherRequests = () => fetchApi("/admin/teacher-requests/");

export const resolveTeacherRequest = (userId, decision) =>
  postJson(`/admin/teacher-requests/${userId}/resolve/`, { decision });

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
// ── Reported societies ────────────────────────────────────────────────────────
export const fetchReportedSocieties = () =>
  fetchApi("/admin/reported-societies/");

export const dismissReport = (reportId) =>
  deleteRequest(`/admin/reports/${reportId}/dismiss/`);

export const banReportedSociety = (reportId, reason = "") =>
  postJson(`/admin/reports/${reportId}/ban/`, { reason });

// ── Society ratification (admin view) ────────────────────────────────────────
export const fetchPendingRatifications = () =>
  fetchApi("/admin/societies/pending-ratifications/");

export const approveRatification = (societyId) =>
  postJson(`/societies/${societyId}/ratification/approve/`, {});

export const rejectRatification = (societyId) =>
  postJson(`/societies/${societyId}/ratification/reject/`, {});

<<<<<<< HEAD
=======
// ── Teacher role request (for regular users) ──────────────────────────────────
export const requestTeacherRole = (reason = "") =>
  postJson("/request-teacher-role/", { reason });

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
// ── Course change requests ────────────────────────────────────────────────────
export const fetchCourseChangeRequests = () =>
  fetchApi("/admin/course-change-requests/");

export const resolveCourseChangeRequest = (requestId, decision) =>
  postJson(`/admin/course-change-requests/${requestId}/resolve/`, { decision });

export const requestCourseChange = (requestedCourse) =>
  postJson("/course-change/request/", { requested_course: requestedCourse });

export const getMyCourseChangeRequest = () =>
  fetchApi("/course-change/my-request/");

export const cancelCourseChangeRequest = () =>
  fetchApi("/course-change/my-request/", { method: "DELETE" });
<<<<<<< HEAD
=======

export const cancelTeacherRoleRequest = () =>
  postJson("/cancel-teacher-role/", {});
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
