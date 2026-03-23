/*
 * Course-change request helpers for the account form.
 */

import { KCL_DEPARTMENTS } from "../../../lib/kclCourses";

const COURSE_REQUEST_CACHE_KEY = "course_change_pending_request";

export const groupedCourses = Object.entries(KCL_DEPARTMENTS).map(([dept, courses]) => ({
  label: dept,
  options: courses.map((course) => ({ value: course, label: course })),
}));

export function normaliseCourseRequest(data) {
  if (!data) return null;
  const request = Array.isArray(data) ? findPendingRequest(data) || data[0] : data;
  if (!request || typeof request !== "object") return null;
  return {
    ...request,
    status: String(request.status || request.request_status || "").toLowerCase(),
    requested_course: getRequestedCourse(request),
  };
}

function findPendingRequest(requests) {
  return requests.find((item) => String(item?.status || item?.request_status || "").toLowerCase() === "pending");
}

function getRequestedCourse(request) {
  return request.requested_course || request.requestedCourse || request.new_course || request.desired_course || "";
}

export function getCachedPendingRequest() {
  try {
    return parseCachedPendingRequest(localStorage.getItem(COURSE_REQUEST_CACHE_KEY));
  } catch {
    return null;
  }
}

function parseCachedPendingRequest(cached) {
  if (!cached) return null;
  const parsed = JSON.parse(cached);
  return parsed?.requested_course ? { status: "pending", requested_course: parsed.requested_course } : null;
}

export function setCachedPendingRequest(requestedCourse) {
  try {
    const payload = JSON.stringify({ requested_course: requestedCourse, created_at: Date.now() });
    localStorage.setItem(COURSE_REQUEST_CACHE_KEY, payload);
  } catch {}
}

export function clearCachedPendingRequest() {
  try {
    localStorage.removeItem(COURSE_REQUEST_CACHE_KEY);
  } catch {}
}
