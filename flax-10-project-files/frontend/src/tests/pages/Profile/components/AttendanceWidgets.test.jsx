import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook, waitFor } from "@testing-library/react";

import AttendanceCharts from "../../../../pages/Profile/components/widgets/attendance/AttendanceCharts";
import {
  AttendanceWarningBadge,
  CompactOverallDonut,
  CompactByTypeDonut,
  CompactAttHeader,
  SegmentDetailPanelWrapper,
} from "../../../../pages/Profile/components/widgets/attendance/AttendanceShared";
import { useAttendanceWidgetData } from "../../../../pages/Profile/components/widgets/attendance/useAttendanceWidgetData";
import {
  buildMarkedEvents,
  buildSegmentEvents,
  computeAttendancePct,
} from "../../../../pages/Profile/components/widgets/attendance/attendanceWidgetUtils";

const useAttendanceStatsMock = vi.fn();
const useAttendanceRecordsMock = vi.fn();
const recordAttendanceMock = vi.fn();

vi.mock("../../../../pages/Attendance/hooks/useAttendanceStats", () => ({
  useAttendanceStats: (...args) => useAttendanceStatsMock(...args),
}));

vi.mock("../../../../pages/Attendance/hooks/useAttendanceRecords", () => ({
  useAttendanceRecords: (...args) => useAttendanceRecordsMock(...args),
}));

vi.mock("../../../../api/attendanceApi", () => ({
  recordAttendance: (...args) => recordAttendanceMock(...args),
}));

vi.mock("../../../../pages/Attendance/components/ByTypeAttendanceChart", () => ({
  default: ({ data, onSegmentClick }) => <button onClick={() => onSegmentClick?.("byType", data[0]?.label)}>ByType chart</button>,
}));

vi.mock("../../../../pages/Attendance/components/OverallAttendanceChart", () => ({
  default: ({ data, onSegmentClick }) => <button onClick={() => onSegmentClick?.("overall", data[0]?.label)}>Overall chart</button>,
}));

vi.mock("../../../../pages/Attendance/components/SegmentDetailPanel", () => ({
  default: ({ segmentLabel, onClose }) => <button onClick={onClose}>{segmentLabel}</button>,
}));

vi.mock("@mui/x-charts/PieChart", () => ({
  PieChart: ({ onItemClick }) => (
    <button onClick={() => onItemClick?.({}, { dataIndex: 0 }, { label: "Attended" })}>Pie chart</button>
  ),
}));

describe("Profile attendance widgets", () => {
  it("renders attendance charts and shared widget primitives", () => {
    const onSegmentClick = vi.fn();
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(
      <>
        <AttendanceCharts
          overall={{ attended: 4, missed: 1 }}
          overallData={[{ label: "Attended", color: "#0f0" }]}
          byTypeData={[{ label: "Lecture", color: "#00f" }]}
          onSegmentClick={onSegmentClick}
        />
        <AttendanceWarningBadge attendancePct={62} />
        <CompactOverallDonut overallData={[{ label: "Attended", color: "#0f0" }]} onSegmentClick={onSegmentClick} />
        <CompactByTypeDonut byTypeData={[{ label: "Lecture", color: "#00f" }]} onSegmentClick={onSegmentClick} />
        <CompactAttHeader onNavigate={onNavigate} />
        <SegmentDetailPanelWrapper
          selectedSegment={{ chart: "overall", label: "Attended" }}
          events={[{ id: 1 }]}
          onToggleStatus={vi.fn()}
          onClose={onClose}
        />
      </>
    );

    fireEvent.click(screen.getByText("Overall chart"));
    fireEvent.click(screen.getAllByText("Pie chart")[0]);
    fireEvent.click(screen.getByText("View attendance details"));
    fireEvent.click(screen.getByText("Overall: Attended"));

    expect(onSegmentClick).toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByText("Low Attendance (62%)")).toBeInTheDocument();
  });

  it("covers empty shared-state branches and widget data hook", async () => {
    useAttendanceStatsMock.mockReturnValue({
      stats: { overall: { attended: 3, missed: 1 }, by_type: { lecture: { attended: 3, missed: 1 } } },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    useAttendanceRecordsMock.mockReturnValue({
      records: [{ event_id: 1, title: "Lecture", start_time: "2026-03-01T09:00:00Z", attended: true, event_type: "Lecture" }],
      refetch: vi.fn(),
    });
    recordAttendanceMock.mockResolvedValue({});

    const { result } = renderHook(() => useAttendanceWidgetData({ chart: "overall", label: "Attended" }));
    await waitFor(() => expect(result.current.attendancePct).toBe(75));
    await result.current.handleToggleStatus(1, true);
    expect(recordAttendanceMock).toHaveBeenCalledWith(1, true);
    expect(result.current.segmentEvents).toHaveLength(1);

    expect(buildMarkedEvents(useAttendanceRecordsMock.mock.results[0].value.records)).toHaveLength(1);
    expect(buildSegmentEvents({ chart: "overall", label: "Attended" }, result.current.segmentEvents)).toHaveLength(1);
    expect(computeAttendancePct({ attended: 0, missed: 0 })).toBe(100);

    const { unmount } = render(<CompactOverallDonut overallData={[]} onSegmentClick={vi.fn()} />);
    expect(screen.getByText("No attendance records yet.")).toBeInTheDocument();
    unmount();
    const { container } = render(<CompactByTypeDonut byTypeData={[]} onSegmentClick={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
