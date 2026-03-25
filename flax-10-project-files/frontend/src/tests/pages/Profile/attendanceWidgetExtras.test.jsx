import React from "react";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pieChartProps = [];
const segmentDetailPanelProps = [];
const overallChartProps = [];
const byTypeChartProps = [];
const useAttendanceStats = vi.fn();
const useAttendanceRecords = vi.fn();
const recordAttendance = vi.fn();

vi.mock("@mui/x-charts/PieChart", () => ({
  PieChart: (props) => {
    pieChartProps.push(props);
    return <button type="button" data-testid="pie-chart" onClick={() => props.onItemClick?.({}, { dataIndex: 0 }, { label: "Clicked" })}>pie</button>;
  },
}));

vi.mock("../../../pages/Attendance/components/SegmentDetailPanel", () => ({
  default: (props) => {
    segmentDetailPanelProps.push(props);
    return <div data-testid="segment-detail-panel">{props.segmentLabel}</div>;
  },
}));

vi.mock("../../../pages/Attendance/components/OverallAttendanceChart", () => ({
  default: (props) => {
    overallChartProps.push(props);
    return <div data-testid="overall-attendance-chart">overall chart</div>;
  },
}));

vi.mock("../../../pages/Attendance/components/ByTypeAttendanceChart", () => ({
  default: (props) => {
    byTypeChartProps.push(props);
    return <div data-testid="by-type-attendance-chart">by-type chart</div>;
  },
}));

vi.mock("../../../pages/Attendance/hooks/useAttendanceStats", () => ({
  useAttendanceStats: (...args) => useAttendanceStats(...args),
}));

vi.mock("../../../pages/Attendance/hooks/useAttendanceRecords", () => ({
  useAttendanceRecords: (...args) => useAttendanceRecords(...args),
}));

vi.mock("../../../api/attendanceApi", () => ({
  recordAttendance: (...args) => recordAttendance(...args),
}));

import AttendanceCharts from "../../../pages/Profile/components/widgets/attendance/AttendanceCharts";
import {
  AttendanceWarningBadge,
  CompactAttHeader,
  CompactByTypeDonut,
  CompactOverallDonut,
  SegmentDetailPanelWrapper,
} from "../../../pages/Profile/components/widgets/attendance/AttendanceShared";
import { useAttendanceWidgetData } from "../../../pages/Profile/components/widgets/attendance/useAttendanceWidgetData";

describe("attendance widget extras", () => {
  beforeEach(() => {
    pieChartProps.length = 0;
    segmentDetailPanelProps.length = 0;
    overallChartProps.length = 0;
    byTypeChartProps.length = 0;
    vi.clearAllMocks();
  });

  it("renders compact overall donut empty state and click selection", () => {
    const onSegmentClick = vi.fn();
    const { rerender } = render(<CompactOverallDonut overallData={[]} onSegmentClick={onSegmentClick} />);
    expect(screen.getByText("No attendance records yet.")).toBeInTheDocument();

    rerender(
      <CompactOverallDonut
        overallData={[{ label: "Attended", value: 3, color: "#0f0" }]}
        onSegmentClick={onSegmentClick}
      />,
    );

    fireEvent.click(screen.getByTestId("pie-chart"));
    expect(onSegmentClick).toHaveBeenCalledWith({ chart: "overall", label: "Clicked" });
    expect(pieChartProps.at(-1).series[0].innerRadius).toBe(38);
  });

  it("renders by-type donut only when data exists and stops wrapper clicks", () => {
    const onSegmentClick = vi.fn();
    const outerClick = vi.fn();
    const { rerender } = render(
      <div onClick={outerClick}>
        <CompactByTypeDonut byTypeData={[]} onSegmentClick={onSegmentClick} />
      </div>,
    );
    expect(screen.queryByText("By Type")).toBeNull();

    rerender(
      <div onClick={outerClick}>
        <CompactByTypeDonut byTypeData={[{ label: "Lecture", value: 2, color: "#00f" }]} onSegmentClick={onSegmentClick} />
      </div>,
    );

    fireEvent.click(screen.getByText("By Type").closest("div"));
    expect(outerClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("pie-chart"));
    expect(onSegmentClick).toHaveBeenCalledWith({ chart: "byType", label: "Clicked" });
  });

  it("handles attendance header navigation via callback and window event", () => {
    const onNavigate = vi.fn();
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const { rerender } = render(<CompactAttHeader onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: "View attendance details" }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).not.toHaveBeenCalled();

    rerender(<CompactAttHeader />);
    fireEvent.click(screen.getByRole("button", { name: "View attendance details" }));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "navigate", detail: "attendance" }));
    dispatchSpy.mockRestore();
  });

  it("renders attendance warning badge for low percentages", () => {
    render(<AttendanceWarningBadge attendancePct={63} />);
    expect(screen.getByText("Low Attendance (63%)")).toBeInTheDocument();
  });

  it("renders segment detail panel wrapper when selected", () => {
    const onToggleStatus = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(
      <SegmentDetailPanelWrapper selectedSegment={null} events={[]} onToggleStatus={onToggleStatus} onClose={onClose} />
    );
    expect(screen.queryByTestId("segment-detail-panel")).toBeNull();

    rerender(
      <SegmentDetailPanelWrapper
        selectedSegment={{ chart: "byType", label: "Lab" }}
        events={[{ id: 1 }]}
        onToggleStatus={onToggleStatus}
        onClose={onClose}
      />
    );
    expect(screen.getByText("By type: Lab")).toBeInTheDocument();
    expect(segmentDetailPanelProps.at(-1)).toEqual(expect.objectContaining({
      segmentLabel: "By type: Lab",
      events: [{ id: 1 }],
      onToggleStatus,
      onClose,
    }));
  });

  it("renders attendance charts and stops parent click propagation", () => {
    const outerClick = vi.fn();
    render(<div onClick={outerClick}><AttendanceCharts overall={{ attended: 4, missed: 1 }} overallData={[{ label: "A", value: 4 }]} onSegmentClick={vi.fn()} /></div>);
    fireEvent.click(screen.getByTestId("overall-attendance-chart").closest("div"));
    expect(outerClick).not.toHaveBeenCalled();
    expect(overallChartProps.at(-1)).toEqual(expect.objectContaining({ attended: 4, missed: 1 }));
  });

  it("passes data and handlers to by-type attendance chart", () => {
    const onSegmentClick = vi.fn();
    render(<AttendanceCharts byTypeData={[{ label: "L", value: 5 }]} onSegmentClick={onSegmentClick} />);
    expect(byTypeChartProps.at(-1)).toEqual(expect.objectContaining({ data: [{ label: "L", value: 5 }], onSegmentClick }));
  });

  it("composes overall and by-type attendance data", async () => {
    useAttendanceStats.mockReturnValue({ stats: { overall: { attended: 3, missed: 1 }, by_type: { L: { attended: 2, missed: 0 } } }, loading: false });
    useAttendanceRecords.mockReturnValue({ records: [{ id: 1, title: "L", event_type: "Lecture" }] });
    
    const { result } = renderHook(() => useAttendanceWidgetData({ chart: "overall", label: "Attended" }));
    await waitFor(() => expect(result.current.attendancePct).toBe(75));
    expect(result.current.overall.attended).toBe(3);
    expect(result.current.byTypeData[0].label).toBe("L");
  });

  it("handles event status toggling and refetches", async () => {
    const refetchStats = vi.fn();
    const refetchRecords = vi.fn();
    useAttendanceStats.mockReturnValue({ stats: { overall: { attended: 1, missed: 0 } }, refetch: refetchStats });
    useAttendanceRecords.mockReturnValue({ records: [], refetch: refetchRecords });
    recordAttendance.mockResolvedValue();

    const { result } = renderHook(() => useAttendanceWidgetData({}));
    await act(async () => { await result.current.handleToggleStatus(7, false); });

    expect(recordAttendance).toHaveBeenCalledWith(7, false);
    await waitFor(() => expect(refetchStats).toHaveBeenCalled());
    expect(refetchRecords).toHaveBeenCalled();
  });
});
