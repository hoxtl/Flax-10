import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

const useAttendanceStatsMock = vi.fn();
const useAttendanceRecordsMock = vi.fn();
const recordAttendanceMock = vi.fn();
const buildOverallChartDataMock = vi.fn();
const buildByTypeChartDataMock = vi.fn();
const withByTypeColorsMock = vi.fn();
const buildMarkedEventsFromRecordsMock = vi.fn();
const buildSegmentEventsMock = vi.fn();
const computeAttendancePctMock = vi.fn();

vi.mock("../../../../pages/attendance/hooks/useAttendanceStats", () => ({
  useAttendanceStats: (...args) => useAttendanceStatsMock(...args),
}));

vi.mock("../../../../pages/attendance/hooks/useAttendanceRecords", () => ({
  useAttendanceRecords: (...args) => useAttendanceRecordsMock(...args),
}));

vi.mock("../../../../api/attendanceApi", () => ({
  recordAttendance: (...args) => recordAttendanceMock(...args),
}));

vi.mock("../../../../pages/attendance/utils/attendanceChartData", () => ({
  buildOverallChartData: (...args) => buildOverallChartDataMock(...args),
  buildByTypeChartData: (...args) => buildByTypeChartDataMock(...args),
  withByTypeColors: (...args) => withByTypeColorsMock(...args),
}));

vi.mock("../../../../pages/attendance/utils/attendanceRecords", () => ({
  buildMarkedEventsFromRecords: (...args) => buildMarkedEventsFromRecordsMock(...args),
}));

vi.mock("../../../../pages/attendance/utils/attendanceSegments", () => ({
  buildSegmentEvents: (...args) => buildSegmentEventsMock(...args),
}));

vi.mock("../../../../pages/attendance/utils/attendanceSummary", () => ({
  computeAttendancePct: (...args) => computeAttendancePctMock(...args),
}));

vi.mock("../../../../pages/attendance/components/ByTypeAttendanceChart", () => ({
  default: ({ data, onSegmentClick }) => (
    <button type="button" onClick={() => onSegmentClick?.("byType", data[0]?.label)}>
      ByType chart
    </button>
  ),
}));

vi.mock("../../../../pages/attendance/components/OverallAttendanceChart", () => ({
  default: ({ data, onSegmentClick }) => (
    <button type="button" onClick={() => onSegmentClick?.("overall", data[0]?.label)}>
      Overall chart
    </button>
  ),
}));

vi.mock("../../../../pages/attendance/components/SegmentDetailPanel", () => ({
  default: ({ segmentLabel, events, onClose, onToggleStatus, className }) => (
    <div data-testid="segment-panel" className={className}>
      <div>{segmentLabel}</div>
      <div>{events.length}</div>
      <button type="button" onClick={() => onToggleStatus?.(123, false)}>
        toggle status
      </button>
      <button type="button" onClick={onClose}>
        close detail
      </button>
    </div>
  ),
}));

vi.mock("@mui/x-charts/PieChart", () => ({
  PieChart: ({ onItemClick }) => (
    <button
      type="button"
      onClick={() => {
        onItemClick?.({}, { dataIndex: 0 }, undefined);
        onItemClick?.({}, { dataIndex: 0 }, { label: "Attended" });
      }}
    >
      Pie chart
    </button>
  ),
}));

import AttendanceCharts from "../../../../pages/profile/components/widgets/attendance/AttendanceCharts";
import {
  AttendanceWidget,
  CompactAttendanceTile,
  CompactStreakTile,
} from "../../../../pages/profile/components/widgets/AttendanceWidgets";
import {
  AttendanceWarningBadge,
  CompactAttHeader,
  CompactByTypeDonut,
  CompactOverallDonut,
  SegmentDetailPanelWrapper,
} from "../../../../pages/profile/components/widgets/attendance/AttendanceShared";
import {
  buildMarkedEvents,
  buildSegmentEvents,
  computeAttendancePct,
} from "../../../../pages/profile/components/widgets/attendance/attendanceWidgetUtils";
import { useAttendanceWidgetData } from "../../../../pages/profile/components/widgets/attendance/useAttendanceWidgetData";

describe("Profile widget attendance coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildOverallChartDataMock.mockImplementation((overall) => [
      { label: "Attended", value: overall.attended },
      { label: "Missed", value: overall.missed },
    ]);
    buildByTypeChartDataMock.mockImplementation((byType) => Object.keys(byType).map((key) => ({ label: key })));
    withByTypeColorsMock.mockImplementation((items) => items.map((item, index) => ({ ...item, color: `#${index}` })));
    buildMarkedEventsFromRecordsMock.mockImplementation((records) => records.map((record) => ({ id: record.event_id, ...record })));
    buildSegmentEventsMock.mockImplementation((segment, events) => segment ? events.filter(Boolean) : []);
    computeAttendancePctMock.mockImplementation(({ attended = 0, missed = 0 }) => {
      const total = attended + missed;
      return total ? Math.round((attended / total) * 100) : 0;
    });
    useAttendanceStatsMock.mockReturnValue({
      stats: { overall: { attended: 3, missed: 1 }, by_type: { lecture: { attended: 2, missed: 1 } } },
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    });
    useAttendanceRecordsMock.mockReturnValue({
      records: [{ event_id: 1, title: "Lecture", attended: true, event_type: "Lecture" }],
      refetch: vi.fn().mockResolvedValue(undefined),
    });
    recordAttendanceMock.mockResolvedValue(undefined);
  });

  it("covers attendance utility wrappers and hook refresh flow", async () => {
    expect(buildMarkedEvents([{ event_id: 10 }])).toEqual([{ id: 10, event_id: 10 }]);
    expect(buildSegmentEvents({ chart: "overall", label: "Attended" }, [{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(computeAttendancePct({ attended: 1, missed: 1 })).toBe(50);

    const { result } = renderHook(() => useAttendanceWidgetData({ chart: "overall", label: "Attended" }));
    expect(result.current.overall).toEqual({ attended: 3, missed: 1 });
    expect(result.current.overallData).toEqual([
      { label: "Attended", value: 3 },
      { label: "Missed", value: 1 },
    ]);
    expect(result.current.byTypeData).toEqual([{ label: "lecture", color: "#0" }]);
    expect(result.current.segmentEvents).toEqual([
      { id: 1, event_id: 1, title: "Lecture", attended: true, event_type: "Lecture" },
    ]);

    await result.current.handleToggleStatus(77, true);

    expect(recordAttendanceMock).toHaveBeenCalledWith(77, true);
    expect(useAttendanceStatsMock.mock.results[0].value.refetch).toHaveBeenCalled();
    expect(useAttendanceRecordsMock.mock.results[0].value.refetch).toHaveBeenCalled();
  });

  it("renders shared attendance pieces and blocks parent bubbling from charts and donuts", () => {
    const outerClick = vi.fn();
    const onSegmentClick = vi.fn();

    render(
      <div onClick={outerClick}>
        <AttendanceCharts
          overall={{ attended: 4, missed: 1 }}
          overallData={[{ label: "Attended", color: "#0f0" }]}
          byTypeData={[{ label: "Lecture", color: "#00f" }]}
          onSegmentClick={onSegmentClick}
        />
        <AttendanceWarningBadge attendancePct={49} />
        <CompactOverallDonut overallData={[{ label: "Attended", color: "#0f0" }]} onSegmentClick={onSegmentClick} />
        <CompactByTypeDonut byTypeData={[{ label: "Lecture", color: "#00f" }]} onSegmentClick={onSegmentClick} />
      </div>,
    );

    fireEvent.click(screen.getByText("Overall chart"));
    fireEvent.click(screen.getAllByText("Pie chart")[0]);
    fireEvent.click(screen.getAllByText("Pie chart")[1]);

    expect(screen.getByText("Low Attendance (49%)")).toBeInTheDocument();
    expect(screen.getByText("Overall")).toBeInTheDocument();
    expect(screen.getAllByText("By Type").length).toBeGreaterThan(0);
    expect(onSegmentClick).toHaveBeenCalled();
    expect(outerClick).not.toHaveBeenCalled();
  });

  it("covers empty and fallback attendance shared branches", () => {
    const navigateListener = vi.fn();
    window.addEventListener("navigate", navigateListener);

    const { container, rerender } = render(
      <>
        <CompactOverallDonut overallData={[]} onSegmentClick={vi.fn()} />
        <CompactByTypeDonut byTypeData={[]} onSegmentClick={vi.fn()} />
        <CompactAttHeader />
        <SegmentDetailPanelWrapper selectedSegment={null} events={[]} onToggleStatus={vi.fn()} onClose={vi.fn()} />
      </>,
    );

    expect(screen.getByText("No attendance records yet.")).toBeInTheDocument();
    expect(container).not.toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: /view attendance details/i }));
    expect(navigateListener).toHaveBeenCalledTimes(1);

    rerender(
      <>
        <CompactOverallDonut overallData={[{ label: "Attended", color: "#0f0" }]} />
        <CompactByTypeDonut byTypeData={[{ label: "Lecture", color: "#00f" }]} />
        <SegmentDetailPanelWrapper
          selectedSegment={{ chart: "byType", label: "Lecture" }}
          events={[{ id: 1 }]}
          onToggleStatus={vi.fn()}
          onClose={vi.fn()}
        />
      </>,
    );

    expect(screen.getByText("By type: Lecture")).toBeInTheDocument();
    window.removeEventListener("navigate", navigateListener);
  });

  it("covers compact and detailed attendance widget states and selection clearing", async () => {
    const onNavigate = vi.fn();
    render(<CompactAttendanceTile onNavigate={onNavigate} />);

    expect(screen.queryByText(/Low Attendance/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /view attendance details/i }));
    expect(onNavigate).toHaveBeenCalledWith("attendance");

    fireEvent.click(screen.getAllByText("Pie chart")[0]);
    expect(screen.getByText("Overall: Attended")).toBeInTheDocument();
    fireEvent.click(screen.getByText("close detail"));
    await waitFor(() => expect(screen.queryByText("Overall: Attended")).not.toBeInTheDocument());

    useAttendanceStatsMock.mockReturnValueOnce({
      stats: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });
    const loadingRender = render(<AttendanceWidget />);
    expect(screen.getByText("Loading metrics...")).toBeInTheDocument();
    loadingRender.unmount();

    useAttendanceStatsMock.mockReturnValueOnce({
      stats: null,
      loading: false,
      error: new Error("fail"),
      refetch: vi.fn(),
    });
    const errorRender = render(<AttendanceWidget />);
    expect(errorRender.container).toBeEmptyDOMElement();
    errorRender.unmount();

    useAttendanceStatsMock.mockReturnValueOnce({
      stats: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    const compactEmpty = render(<CompactAttendanceTile onNavigate={vi.fn()} />);
    expect(compactEmpty.container).toBeEmptyDOMElement();
    compactEmpty.unmount();

    useAttendanceStatsMock.mockReturnValueOnce({
      stats: { overall: { attended: 2, missed: 3 }, by_type: {} },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AttendanceWidget />);
    expect(screen.getByText("Low Attendance (40%)")).toBeInTheDocument();
  });

  it("covers compact streak values and fallbacks", () => {
    const { rerender } = render(<CompactStreakTile streaks={undefined} />);
    expect(screen.getAllByText("—").length).toBe(2);

    rerender(<CompactStreakTile streaks={{ current: 4, longest: 9 }} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });
});
