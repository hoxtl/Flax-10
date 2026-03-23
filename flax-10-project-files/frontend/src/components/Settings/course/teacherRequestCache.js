/*
 * Local cache helpers for teacher-role requests.
 */

const TEACHER_REQUEST_CACHE_KEY = "teacher_request_pending";

export function getCachedTeacherRequest() {
  try {
    return localStorage.getItem(TEACHER_REQUEST_CACHE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setCachedTeacherRequest() {
  try {
    localStorage.setItem(TEACHER_REQUEST_CACHE_KEY, "true");
  } catch {}
}

export function clearCachedTeacherRequest() {
  try {
    localStorage.removeItem(TEACHER_REQUEST_CACHE_KEY);
  } catch {}
}
