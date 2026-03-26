import { describe, expect, it } from "vitest";

import {
  ATTENDED_COLOR,
  CHART_MARGIN,
  MISSED_COLOR,
  getAttendanceMargin,
  getAttendancePercentage,
  getAttendanceSeries,
} from "../../../components/analytics/attendanceChartConfig";

describe("attendanceChartConfig", () => {
  it("returns mobile and desktop margins", () => {
    expect(getAttendanceMargin(true)).toEqual({ left: 26, right: 10, top: 10, bottom: 40 });
    expect(getAttendanceMargin(false)).toBe(CHART_MARGIN);
  });

  it("builds the attended and missed series from types", () => {
    expect(
      getAttendanceSeries(["Lecture", "Seminar"], {
        Lecture: { attended: 4, missed: 1 },
        Seminar: { attended: 2, missed: 3 },
      }),
    ).toEqual([
      { data: [4, 2], label: "Attended", color: ATTENDED_COLOR },
      { data: [1, 3], label: "Missed", color: MISSED_COLOR },
    ]);
  });

  it("calculates percentages and safely handles zero totals", () => {
    expect(getAttendancePercentage({ attended: 3, missed: 1 })).toBe(75);
    expect(getAttendancePercentage({ attended: 0, missed: 0 })).toBe(0);
  });
});
