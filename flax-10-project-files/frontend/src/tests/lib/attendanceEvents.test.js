import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ATTENDANCE_UPDATED_EVENT,
  dispatchAttendanceUpdated,
} from "../../lib/attendanceEvents";

describe("attendanceEvents", () => {
  afterEach(() => {
    vi.unstubGlobal("window");
    vi.restoreAllMocks();
  });

  it("dispatches the shared attendance event in browser environments", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });

    dispatchAttendanceUpdated();

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: ATTENDANCE_UPDATED_EVENT }),
    );
  });

  it("returns safely when window is unavailable", () => {
    vi.stubGlobal("window", undefined);

    expect(() => dispatchAttendanceUpdated()).not.toThrow();
  });
});
