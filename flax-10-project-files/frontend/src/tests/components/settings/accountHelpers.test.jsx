import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMyCourseChangeRequest = vi.fn();
const cancelCourseChangeRequest = vi.fn();

vi.mock("../../../api/adminApi", () => ({
  getMyCourseChangeRequest: (...args) => getMyCourseChangeRequest(...args),
  cancelCourseChangeRequest: (...args) => cancelCourseChangeRequest(...args),
}));

import {
  clearCachedPendingRequest,
  getCachedPendingRequest,
  groupedCourses,
  normaliseCourseRequest,
  setCachedPendingRequest,
} from "../../../components/settings/account/accountCourseRequests";
import {
  YEAR_OPTIONS,
  getInitialAccountData,
  hasAccountChanges,
} from "../../../components/settings/account/accountFormConfig";
import useCourseRequestFeedback from "../../../components/settings/account/useCourseRequestFeedback";
import {
  createAccountSubmitHandler,
  createCancelCourseRequestHandler,
  createCourseRequestSuccessHandler,
} from "../../../components/settings/account/useCourseRequestActions";
import useAccountFormState from "../../../components/settings/account/useAccountFormState";

describe("account settings helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("covers course request normalization and cache helpers", () => {
    expect(groupedCourses.length).toBeGreaterThan(0);
    expect(groupedCourses[0]).toMatchObject({ label: expect.any(String), options: expect.any(Array) });

    expect(normaliseCourseRequest(null)).toBeNull();
    expect(normaliseCourseRequest("bad")).toBeNull();
    expect(
      normaliseCourseRequest({
        request_status: "PENDING",
        requestedCourse: "Computer Science",
      }),
    ).toMatchObject({
      status: "pending",
      requested_course: "Computer Science",
    });
    expect(
      normaliseCourseRequest([
        { status: "approved", desired_course: "Old" },
        { request_status: "pending", new_course: "Law" },
      ]),
    ).toMatchObject({
      status: "pending",
      requested_course: "Law",
    });

    expect(getCachedPendingRequest()).toBeNull();
    setCachedPendingRequest("Physics");
    expect(getCachedPendingRequest()).toEqual({ status: "pending", requested_course: "Physics" });
    localStorage.setItem("course_change_pending_request", JSON.stringify({ created_at: 1 }));
    expect(getCachedPendingRequest()).toBeNull();
    localStorage.setItem("course_change_pending_request", "{bad");
    expect(getCachedPendingRequest()).toBeNull();
    clearCachedPendingRequest();
    expect(localStorage.getItem("course_change_pending_request")).toBeNull();
  });

  it("covers account form config helpers", () => {
    expect(YEAR_OPTIONS).toHaveLength(5);
    expect(getInitialAccountData()).toEqual({
      firstName: "",
      lastName: "",
      email: "",
      year: "",
    });
    expect(
      getInitialAccountData({
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
        year: "Year 2",
      }),
    ).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      year: "Year 2",
    });

    expect(hasAccountChanges({ firstName: "A", lastName: "", email: "", year: "" }, getInitialAccountData())).toBe(true);
    expect(hasAccountChanges(getInitialAccountData(), getInitialAccountData())).toBe(false);
  });

  it("initializes course request feedback from cached state", () => {
    setCachedPendingRequest("Biology");
    const { result } = renderHook(() => useCourseRequestFeedback());
    expect(result.current.showModal[0]).toBe(false);
    expect(result.current.cancellingRequest[0]).toBe(false);
    expect(result.current.courseRequestNotice[0]).toBe("Request sent.");
    expect(result.current.courseRequestError[0]).toBe("");
    expect(result.current.saveSignal[0]).toBe(0);
  });

  it("covers account submit, cancel, and course-request success handlers", async () => {
    const event = { preventDefault: vi.fn() };
    const onSave = vi.fn().mockResolvedValue(true);
    const setInitialFormData = vi.fn();
    const setSaveSignal = vi.fn();
    const refreshProfile = vi.fn();

    await createAccountSubmitHandler({
      hasUnsaved: false,
      onSave,
      formData: { firstName: "Ada" },
      setInitialFormData,
      setSaveSignal,
      refreshProfile,
    })(event);
    expect(onSave).not.toHaveBeenCalled();

    await createAccountSubmitHandler({
      hasUnsaved: true,
      onSave: vi.fn().mockResolvedValue(false),
      formData: { firstName: "Ada" },
      setInitialFormData,
      setSaveSignal,
      refreshProfile,
    })(event);
    expect(setInitialFormData).not.toHaveBeenCalled();

    await createAccountSubmitHandler({
      hasUnsaved: true,
      onSave,
      formData: { firstName: "Ada" },
      setInitialFormData,
      setSaveSignal,
      refreshProfile,
    })(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(setInitialFormData).toHaveBeenCalledWith({ firstName: "Ada" });
    expect(setSaveSignal).toHaveBeenCalledWith(expect.any(Function));
    expect(refreshProfile).toHaveBeenCalled();

    const cancelContext = {
      setCancellingRequest: vi.fn(),
      setCourseRequestNotice: vi.fn(),
      setCourseRequestError: vi.fn(),
      setPendingRequest: vi.fn(),
      refreshProfile: vi.fn(),
    };

    cancelCourseChangeRequest.mockResolvedValue(undefined);
    getMyCourseChangeRequest.mockResolvedValue({ status: "approved" });
    await createCancelCourseRequestHandler(cancelContext)();
    expect(cancelContext.setPendingRequest).toHaveBeenCalledWith(null);
    expect(cancelContext.setCourseRequestNotice).toHaveBeenCalledWith("Request cancelled.");

    cancelCourseChangeRequest.mockRejectedValueOnce(new Error("No pending request to cancel"));
    await createCancelCourseRequestHandler(cancelContext)();
    expect(cancelContext.setPendingRequest).toHaveBeenCalledWith(null);

    cancelCourseChangeRequest.mockRejectedValueOnce(new Error("Server down"));
    await createCancelCourseRequestHandler(cancelContext)();
    expect(cancelContext.setCourseRequestError).toHaveBeenCalledWith("Server down");

    const successContext = {
      setPendingRequest: vi.fn(),
      setShowModal: vi.fn(),
      setCourseRequestError: vi.fn(),
      setCourseRequestNotice: vi.fn(),
      refreshProfile: vi.fn(),
    };

    createCourseRequestSuccessHandler(successContext)(
      { request_status: "pending", desired_course: "Chemistry" },
      "Ignored",
    );
    expect(successContext.setPendingRequest).toHaveBeenCalledWith({
      request_status: "pending",
      desired_course: "Chemistry",
      status: "pending",
      requested_course: "Chemistry",
    });
    expect(successContext.setShowModal).toHaveBeenCalledWith(false);

    createCourseRequestSuccessHandler(successContext)(null, "History");
    expect(getCachedPendingRequest()).toEqual({ status: "pending", requested_course: "History" });
  });

  it("loads account form state from the external user and pending requests", async () => {
    getMyCourseChangeRequest.mockResolvedValue({
      status: "pending",
      requested_course: "Maths",
    });

    const { result } = renderHook(() =>
      useAccountFormState({
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com",
        year: "Year 2",
        major: "Computer Science",
      }),
    );

    await waitFor(() => {
      expect(result.current.formData).toEqual({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        year: "Year 2",
      });
      expect(result.current.currentCourse).toBe("Computer Science");
      expect(result.current.pendingRequest).toMatchObject({
        status: "pending",
        requested_course: "Maths",
      });
    });

    result.current.handleChange({ target: { name: "firstName", value: "Grace" } });
    await waitFor(() => {
      expect(result.current.formData.firstName).toBe("Grace");
    });
  });

  it("falls back to cached pending requests when loading fails or resolves to a non-pending status", async () => {
    setCachedPendingRequest("Cached Course");
    getMyCourseChangeRequest.mockRejectedValueOnce(new Error("offline"));

    const first = renderHook(() =>
      useAccountFormState({
        first_name: "Ada",
        email: "ada@example.com",
      }),
    );

    await waitFor(() => {
      expect(first.result.current.pendingRequest).toEqual({
        status: "pending",
        requested_course: "Cached Course",
      });
    });

    setCachedPendingRequest("Stale Cache");
    getMyCourseChangeRequest.mockResolvedValueOnce({
      status: "approved",
      requested_course: "Physics",
    });

    const second = renderHook(() =>
      useAccountFormState({
        username: "ada",
        email: "ada@example.com",
      }),
    );

    await waitFor(() => {
      expect(second.result.current.pendingRequest).toBeNull();
    });
    expect(getCachedPendingRequest()).toBeNull();
  });
});
