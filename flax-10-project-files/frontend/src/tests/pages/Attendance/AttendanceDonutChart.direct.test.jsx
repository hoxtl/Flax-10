import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AttendanceDonutChart from "../../../pages/attendance/components/AttendanceDonutChart";

const buildDonutSeriesMock = vi.hoisted(() => vi.fn());
const buildPieClickHandlerMock = vi.hoisted(() => vi.fn());

vi.mock("@mui/x-charts/PieChart", () => ({
  PieChart: ({ series, height, margin, slotProps, sx, onItemClick }) => (
    <div data-testid="pie-chart">
      <div data-testid="height">{height}</div>
      <div data-testid="series">{JSON.stringify(series)}</div>
      <div data-testid="margin">{JSON.stringify(margin)}</div>
      <div data-testid="legend-hidden">{String(slotProps.legend.hidden)}</div>
      <div data-testid="sx">{JSON.stringify(sx)}</div>
      <button type="button" onClick={() => onItemClick?.("evt")}>
        trigger-click
      </button>
    </div>
  ),
}));

vi.mock("../../../pages/attendance/utils/attendanceChartUtils", () => ({
  buildDonutSeries: (...args) => buildDonutSeriesMock(...args),
  buildPieClickHandler: (...args) => buildPieClickHandlerMock(...args),
}));

describe("AttendanceDonutChart", () => {
  it("calls buildDonutSeries and buildPieClickHandler with correct arguments", () => {
    const onSegmentClick = vi.fn();
    const valueFormatter = vi.fn();
    const data = [{ label: "Attended", value: 3 }];
    
    render(<AttendanceDonutChart chart="overall" data={data} onSegmentClick={onSegmentClick} valueFormatter={valueFormatter} />);
    
    expect(buildDonutSeriesMock).toHaveBeenCalledWith(data, valueFormatter);
    expect(buildPieClickHandlerMock).toHaveBeenCalledWith(onSegmentClick, "overall", data);
  });

  it("passes correct height and legend settings to PieChart", () => {
    render(<AttendanceDonutChart chart="overall" data={[]} />);
    expect(screen.getByTestId("height")).toHaveTextContent("220");
    expect(screen.getByTestId("legend-hidden")).toHaveTextContent("true");
  });

  it("passes correct margin and styles to PieChart", () => {
    render(<AttendanceDonutChart chart="overall" data={[]} />);
    expect(screen.getByTestId("margin")).toHaveTextContent('"top":10');
    expect(screen.getByTestId("sx")).toHaveTextContent("MuiChartsLegend-label");
  });

  it("uses the built click handler as the chart item click callback", () => {
    const clickHandler = vi.fn();
    buildDonutSeriesMock.mockReturnValue([{ data: [] }]);
    buildPieClickHandlerMock.mockReturnValue(clickHandler);

    render(<AttendanceDonutChart chart="byType" data={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /trigger-click/i }));

    expect(clickHandler).toHaveBeenCalledWith("evt");
  });
});
