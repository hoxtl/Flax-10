import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useAttendanceWidgetDataMock = vi.fn();

vi.mock("../../../../pages/Profile/components/widgets/attendance/useAttendanceWidgetData", () => ({
  useAttendanceWidgetData: (...args) => useAttendanceWidgetDataMock(...args),
}));

vi.mock("../../../../pages/Profile/components/widgets/ProfileWidget", () => ({
  default: ({ title, subtitle, children }) => (
    <div>
      <div>{title}</div>
      <div data-testid="subtitle">{subtitle}</div>
      {children}
    </div>
  ),
}));

vi.mock("../../../../pages/Profile/components/widgets/attendance/AttendanceCharts", () => ({
  default: ({ onSegmentClick }) => <button onClick={() => onSegmentClick("overall", undefined)}>chart</button>,
}));

vi.mock("../../../../pages/Profile/components/widgets/attendance/AttendanceShared", () => ({
  AttendanceWarningBadge: ({ attendancePct }) => <div>Low Attendance ({attendancePct}%)</div>,
  CompactAttHeader: () => null,
  CompactByTypeDonut: () => null,
  CompactOverallDonut: () => null,
  SegmentDetailPanelWrapper: ({ selectedSegment }) => <div data-testid="segment-detail">{selectedSegment?.label ?? "none"}</div>,
}));

import { AttendanceWidget } from "../../../../pages/Profile/components/widgets/AttendanceWidgets";

describe("AttendanceWidget coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAttendanceWidgetDataMock.mockReturnValue({
      loading: false,
      error: null,
      stats: { overall: { attended: 2, missed: 3 } },
      overall: { attended: 2, missed: 3 },
      overallData: [{ value: 2 }],
      byTypeData: [],
      attendancePct: 40,
      segmentEvents: [],
      handleToggleStatus: vi.fn(),
    });
  });

  it("shows the low-attendance subtitle and clears chart selections when no label is provided", () => {
    render(<AttendanceWidget />);
    expect(screen.getByText("Low Attendance (40%)")).toBeInTheDocument();
    fireEvent.click(screen.getByText("chart"));
    expect(screen.getByTestId("segment-detail")).toHaveTextContent("none");
  });
});
