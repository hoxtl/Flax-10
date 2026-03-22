/*
 * Account-form actions for save, request success, and cancellation.
 */
import { cancelCourseChangeRequest, getMyCourseChangeRequest } from "../../../api/admin/adminApi";
import {
  clearCachedPendingRequest,
  normaliseCourseRequest,
  setCachedPendingRequest,
} from "./accountCourseRequests";

function applyCancelledState(setPendingRequest, setCourseRequestNotice, refreshProfile) {
  setPendingRequest(null);
  setCourseRequestNotice("Request cancelled.");
  refreshProfile();
}

function handleCancelError(error, setPendingRequest, setCourseRequestNotice, setCourseRequestError) {
  const message = String(error?.message || "");
  if (!message.toLowerCase().includes("no pending request to cancel")) {
    return setCourseRequestError(message || "Failed to cancel request. Please try again.");
  }
  clearCachedPendingRequest();
  setPendingRequest(null);
  setCourseRequestNotice("Request cancelled.");
}

async function refreshPendingRequest(setPendingRequest, setCourseRequestNotice, refreshProfile) {
  const request = await getMyCourseChangeRequest().then(normaliseCourseRequest).catch(() => null);
  if (request?.status === "pending") return setPendingRequest(request);
  applyCancelledState(setPendingRequest, setCourseRequestNotice, refreshProfile);
}

export function createAccountSubmitHandler(context) {
  return async (event) => {
    event.preventDefault();
    if (!context.hasUnsaved) return;
    const ok = await context.onSave(context.formData);
    if (!ok) return;
    context.setInitialFormData(context.formData);
    context.setSaveSignal((count) => count + 1);
    context.refreshProfile();
  };
}

export function createCancelCourseRequestHandler(context) {
  return async () => {
    context.setCancellingRequest(true);
    context.setCourseRequestNotice("");
    context.setCourseRequestError("");
    try {
      await cancelCourseChangeRequest();
      clearCachedPendingRequest();
      await refreshPendingRequest(context.setPendingRequest, context.setCourseRequestNotice, context.refreshProfile);
    } catch (error) {
      handleCancelError(error, context.setPendingRequest, context.setCourseRequestNotice, context.setCourseRequestError);
    } finally {
      context.setCancellingRequest(false);
    }
  };
}

export function createCourseRequestSuccessHandler(context) {
  return (result, selectedCourse) => {
    const request = normaliseCourseRequest(result) || { status: "pending", requested_course: selectedCourse || "" };
    const courseName = request.requested_course || selectedCourse || "";
    if (courseName) setCachedPendingRequest(courseName);
    context.setPendingRequest({ ...request, status: "pending", requested_course: courseName });
    context.setShowModal(false);
    context.setCourseRequestError("");
    context.setCourseRequestNotice("Request sent.");
    context.refreshProfile();
  };
}
