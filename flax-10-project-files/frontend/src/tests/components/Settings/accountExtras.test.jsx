import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const getMyCourseChangeRequest = vi.fn();
const cancelCourseChangeRequest = vi.fn();
const useAuth = vi.fn();

vi.mock("../../../api/adminApi", () => ({
  getMyCourseChangeRequest: (...args) => getMyCourseChangeRequest(...args),
  cancelCourseChangeRequest: (...args) => cancelCourseChangeRequest(...args),
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: (...args) => useAuth(...args),
}));

vi.mock("../../../lib/kclCourses", () => ({
  KCL_DEPARTMENTS: {
    Science: ["Physics", "Chemistry"],
    Arts: ["History"],
  },
}));

import {
  clearCachedPendingRequest,
  getCachedPendingRequest,
  groupedCourses,
  normaliseCourseRequest,
  setCachedPendingRequest,
} from "../../../components/Settings/account/accountCourseRequests";
import { getInitialAccountData, hasAccountChanges, YEAR_OPTIONS } from "../../../components/Settings/account/accountFormConfig";
import useAccountFormState from "../../../components/Settings/account/useAccountFormState";
import useCourseRequestFeedback from "../../../components/Settings/account/useCourseRequestFeedback";
import {
  createAccountSubmitHandler,
  createCancelCourseRequestHandler,
  createCourseRequestSuccessHandler,
} from "../../../components/Settings/account/useCourseRequestActions";

describe("account extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("covers account request cache normalization helpers", () => {
    expect(groupedCourses).toHaveLength(2);
    expect(normaliseCourseRequest(null)).toBeNull();
    expect(normaliseCourseRequest([{ status: "rejected" }, { request_status: "pending", desired_course: "Physics" }])).toEqual({
      request_status: "pending",
      desired_course: "Physics",
      status: "pending",
      requested_course: "Physics",
    });
    expect(normaliseCourseRequest({ requestedCourse: "History", status: "pending" }).requested_course).toBe("History");

    setCachedPendingRequest("Physics");
    expect(getCachedPendingRequest()).toEqual({ status: "pending", requested_course: "Physics" });
    localStorage.setItem("course_change_pending_request", "bad-json");
    expect(getCachedPendingRequest()).toBeNull();
    clearCachedPendingRequest();
    expect(getCachedPendingRequest()).toBeNull();
  });

  it("covers account form config helpers", () => {
    expect(YEAR_OPTIONS[0]).toEqual({ value: "Foundation", label: "Foundation" });
    expect(getInitialAccountData({ first_name: "A", last_name: "B", email: "a@b.com", year: "Year 2" })).toEqual({
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      year: "Year 2",
    });
    expect(hasAccountChanges({ firstName: "A", lastName: "B", email: "c", year: "1" }, { firstName: "A", lastName: "B", email: "d", year: "1" })).toBe(true);
  });

  it("loads account state from auth, handles profile changes, request fallback, and input changes", async () => {
    useAuth.mockReturnValue({
      profile: { first_name: "Alice", last_name: "Smith", email: "a@b.com", year: "Year 2", major: "Physics" },
      loading: false,
      refreshProfile: vi.fn(),
    });
    getMyCourseChangeRequest.mockRejectedValueOnce(new Error("offline"));
    setCachedPendingRequest("Chemistry");

    const { result } = renderHook(() => useAccountFormState());
    await waitFor(() => expect(result.current.currentCourse).toBe("Physics"));
    expect(result.current.pendingRequest).toEqual({ status: "pending", requested_course: "Chemistry" });

    act(() => result.current.handleChange({ target: { name: "firstName", value: "Ava" } }));
    expect(result.current.formData.firstName).toBe("Ava");
  });

  it("clears non-pending requests and supports external user fallback", async () => {
    useAuth.mockImplementation(() => {
      throw new Error("no auth provider");
    });
    getMyCourseChangeRequest.mockResolvedValueOnce({ status: "approved", requested_course: "Physics" });

    const externalUser = { first_name: "Ben", major: "History" };
    const { result } = renderHook(() => useAccountFormState(externalUser));
    await waitFor(() => expect(result.current.currentCourse).toBe("History"));
    expect(result.current.pendingRequest).toBeNull();
  });

  it("handles feedback state from cache and account/course request action creators", async () => {
    setCachedPendingRequest("Physics");
    const { result } = renderHook(() => useCourseRequestFeedback());
    expect(result.current.courseRequestNotice[0]).toBe("Request sent.");

    const context = {
      hasUnsaved: true,
      onSave: vi.fn().mockResolvedValue(true),
      formData: { firstName: "Ava" },
      setInitialFormData: vi.fn(),
      setSaveSignal: vi.fn(),
      refreshProfile: vi.fn(),
      setCancellingRequest: vi.fn(),
      setCourseRequestNotice: vi.fn(),
      setCourseRequestError: vi.fn(),
      setPendingRequest: vi.fn(),
      setShowModal: vi.fn(),
    };

    const submit = createAccountSubmitHandler(context);
    await submit({ preventDefault: vi.fn() });
    expect(context.onSave).toHaveBeenCalled();
    expect(context.setInitialFormData).toHaveBeenCalledWith(context.formData);

    cancelCourseChangeRequest.mockResolvedValueOnce({});
    getMyCourseChangeRequest.mockResolvedValueOnce({ status: "rejected" });
    const cancel = createCancelCourseRequestHandler(context);
    await cancel();
    expect(context.setPendingRequest).toHaveBeenCalledWith(null);
    expect(context.setCourseRequestNotice).toHaveBeenCalledWith("Request cancelled.");

    cancelCourseChangeRequest.mockRejectedValueOnce(new Error("No pending request to cancel"));
    await cancel();
    expect(context.setPendingRequest).toHaveBeenCalledWith(null);

    cancelCourseChangeRequest.mockRejectedValueOnce(new Error("Server exploded"));
    await cancel();
    expect(context.setCourseRequestError).toHaveBeenCalledWith("Server exploded");

    const success = createCourseRequestSuccessHandler(context);
    success({ requestedCourse: "History" }, "History");
    expect(context.setPendingRequest).toHaveBeenCalledWith({ requestedCourse: "History", status: "pending", requested_course: "History" });
    expect(context.setShowModal).toHaveBeenCalledWith(false);
  });
});
