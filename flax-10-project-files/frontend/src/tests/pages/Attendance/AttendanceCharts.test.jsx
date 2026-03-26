import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import AttendanceChartsColumn from "../../../pages/Attendance/components/AttendanceChartsColumn";
import OverallAttendanceChart from "../../../pages/Attendance/components/OverallAttendanceChart";
import ByTypeAttendanceChart from "../../../pages/Attendance/components/ByTypeAttendanceChart";
import AttendancePercentLine from "../../../pages/Attendance/components/AttendancePercentLine";

vi.mock("../../../pages/Attendance/components/AttendanceDonutChart", async () => {
  return {
    default: ({ chart, data, onSegmentClick, valueFormatter }) => (
      <div>
        <div>{chart}:{data.length}</div>
        <button type="button" onClick={() => onSegmentClick?.(chart, data[0]?.label)}>
          click-{chart}
        </button>
        <div data-testid={`${chart}-formatted`}>
          {valueFormatter?.(data[0], { dataIndex: 0 })}
        </div>
      </div>
    ),
  };
});

describe("Attendance charts", () => {
  it("renders chart cards and the empty notice state", () => {
    const selectSegment = vi.fn();
    render(
      <AttendanceChartsColumn
        model={{
          summary: { totalMarked: 0, attended: 0, missed: 0 },
          overallData: [{ label: "Attended", value: 0 }],
          byTypeData: [{ label: "Lecture", value: 0 }],
          selectSegment,
        }}
      />,
    );

    expect(screen.getByText(/No attendance recorded yet/)).toBeInTheDocument();
    expect(screen.getByText("Overall")).toBeInTheDocument();
    expect(screen.getByText("By type")).toBeInTheDocument();
    fireEvent.click(screen.getByText("click-overall"));
    expect(selectSegment).toHaveBeenCalledWith("overall", "Attended");
    fireEvent.click(screen.getByText("click-byType"));
    expect(selectSegment).toHaveBeenCalledWith("byType", "Lecture");
  });

  it("hides the empty notice once attendance exists and passes formatted values into both charts", () => {
    render(
      <AttendanceChartsColumn
        model={{
          summary: { totalMarked: 4, attended: 3, missed: 1 },
          overallData: [{ label: "Attended", value: 3 }],
          byTypeData: [{ label: "Lecture", value: 2 }, { label: "Lab", value: 0 }],
          selectSegment: vi.fn(),
        }}
      />,
    );

    expect(screen.queryByText(/No attendance recorded yet/)).not.toBeInTheDocument();
    expect(screen.getByTestId("overall-formatted")).toHaveTextContent("75%");
    expect(screen.getByTestId("byType-formatted")).toHaveTextContent("100%");
  });

  it("renders overall chart empty and populated branches", () => {
    const onSegmentClick = vi.fn();
    const { rerender } = render(
      <OverallAttendanceChart data={[]} attended={0} missed={0} onSegmentClick={onSegmentClick} />,
    );

    expect(screen.getByText("No overall data yet.")).toBeInTheDocument();

    rerender(<OverallAttendanceChart data={[]} attended={3} missed={1} onSegmentClick={onSegmentClick} />);
    expect(screen.getByText("75% attended")).toBeInTheDocument();
    expect(screen.getByText("No overall data yet.")).toBeInTheDocument();

    rerender(
      <OverallAttendanceChart
        data={[{ label: "Attended", value: 3 }]}
        attended={3}
        missed={1}
        onSegmentClick={onSegmentClick}
      />,
    );
    expect(screen.getByText("overall:1")).toBeInTheDocument();
    expect(screen.getByTestId("overall-formatted")).toHaveTextContent("75%");
    fireEvent.click(screen.getByText("click-overall"));
    expect(onSegmentClick).toHaveBeenCalledWith("overall", "Attended");
  });

  it("renders by-type chart empty and populated branches", () => {
    const onSegmentClick = vi.fn();
    const { rerender } = render(<ByTypeAttendanceChart data={[]} onSegmentClick={onSegmentClick} />);
    expect(screen.getByText("No data by type yet.")).toBeInTheDocument();

    rerender(
      <ByTypeAttendanceChart
        data={[{ label: "Lecture", value: 5 }, { label: "Seminar" }]}
        onSegmentClick={onSegmentClick}
      />,
    );
    expect(screen.getByText("byType:2")).toBeInTheDocument();
    expect(screen.getByTestId("byType-formatted")).toHaveTextContent("100%");
    fireEvent.click(screen.getByText("click-byType"));
    expect(onSegmentClick).toHaveBeenCalledWith("byType", "Lecture");
  });

  it("applies hidden visibility only when requested", () => {
    const { rerender } = render(<AttendancePercentLine>Visible text</AttendancePercentLine>);
    expect(screen.getByText("Visible text")).not.toHaveStyle({ visibility: "hidden" });

    rerender(<AttendancePercentLine hidden>Spacer text</AttendancePercentLine>);
    expect(screen.getByText("Spacer text")).toHaveStyle({ visibility: "hidden" });
  });
});
