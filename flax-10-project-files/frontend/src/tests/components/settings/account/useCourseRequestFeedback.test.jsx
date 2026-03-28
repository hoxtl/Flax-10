import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import useCourseRequestFeedback from "../../../../components/settings/account/useCourseRequestFeedback";

describe("useCourseRequestFeedback", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses empty defaults when there is no cached pending request", () => {
    const { result } = renderHook(() => useCourseRequestFeedback());

    expect(result.current.showModal[0]).toBe(false);
    expect(result.current.cancellingRequest[0]).toBe(false);
    expect(result.current.courseRequestNotice[0]).toBe("");
    expect(result.current.courseRequestError[0]).toBe("");
    expect(result.current.saveSignal[0]).toBe(0);
  });

  it("shows the sent notice when a cached pending request exists", () => {
    localStorage.setItem(
      "course_change_pending_request",
      JSON.stringify({ requested_course: "Physics", created_at: Date.now() }),
    );

    const { result } = renderHook(() => useCourseRequestFeedback());
    expect(result.current.courseRequestNotice[0]).toBe("Request sent.");
  });
});
