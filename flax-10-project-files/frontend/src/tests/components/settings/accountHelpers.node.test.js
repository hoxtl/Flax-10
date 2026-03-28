import { beforeEach, describe, expect, it, vi } from "vitest";

const getMyCourseChangeRequest = vi.fn();
const cancelCourseChangeRequest = vi.fn();
const clearUserData = vi.fn();

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
import {
  createAccountSubmitHandler,
  createCancelCourseRequestHandler,
  createCourseRequestSuccessHandler,
} from "../../../components/settings/account/useCourseRequestActions";

describe("account helper modules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
      store: {},
      getItem(key) {
        return this.store[key] ?? null;
      },
      setItem(key, value) {
        this.store[key] = String(value);
      },
      removeItem(key) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      },
      },
    });
    localStorage.clear();
  });

  it("covers course-request helpers and account form config", () => {
    expect(groupedCourses.length).toBeGreaterThan(0);
    expect(YEAR_OPTIONS).toHaveLength(5);

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
    expect(
      normaliseCourseRequest([
        { status: "approved", desired_course: "Fallback Course" },
      ]),
    ).toMatchObject({
      status: "approved",
      requested_course: "Fallback Course",
    });
    expect(normaliseCourseRequest([null])).toBeNull();
    expect(
      normaliseCourseRequest({
        desired_course: "History",
      }),
    ).toMatchObject({
      status: "",
      requested_course: "History",
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
    expect(setSaveSignal.mock.calls[0][0](4)).toBe(5);
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

    cancelCourseChangeRequest.mockResolvedValueOnce(undefined);
    getMyCourseChangeRequest.mockResolvedValueOnce({ status: "pending", requested_course: "Biology" });
    await createCancelCourseRequestHandler(cancelContext)();
    expect(cancelContext.setPendingRequest).toHaveBeenCalledWith({
      status: "pending",
      requested_course: "Biology",
    });

    cancelCourseChangeRequest.mockResolvedValueOnce(undefined);
    getMyCourseChangeRequest.mockRejectedValueOnce(new Error("refresh failed"));
    await createCancelCourseRequestHandler(cancelContext)();
    expect(cancelContext.setPendingRequest).toHaveBeenCalledWith(null);

    cancelCourseChangeRequest.mockRejectedValueOnce(new Error("No pending request to cancel"));
    await createCancelCourseRequestHandler(cancelContext)();
    expect(cancelContext.setPendingRequest).toHaveBeenCalledWith(null);

    cancelCourseChangeRequest.mockRejectedValueOnce(new Error("Server down"));
    await createCancelCourseRequestHandler(cancelContext)();
    expect(cancelContext.setCourseRequestError).toHaveBeenCalledWith("Server down");

    cancelCourseChangeRequest.mockRejectedValueOnce({});
    await createCancelCourseRequestHandler(cancelContext)();
    expect(cancelContext.setCourseRequestError).toHaveBeenCalledWith("Failed to cancel request. Please try again.");

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

    clearCachedPendingRequest();
    createCourseRequestSuccessHandler(successContext)(null, "");
    expect(getCachedPendingRequest()).toBeNull();
  });
});
