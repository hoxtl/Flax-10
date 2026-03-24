import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AttendanceDonutChart from "../../../pages/Attendance/components/AttendanceDonutChart";

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

vi.mock("../../../pages/Attendance/utils/attendanceChartUtils", () => ({
  buildDonutSeries: (...args) => buildDonutSeriesMock(...args),
  buildPieClickHandler: (...args) => buildPieClickHandlerMock(...args),
}));

describe("AttendanceDonutChart", () => {
  it("passes the built series and shared chart props into PieChart", () => {
    const onSegmentClick = vi.fn();
    const valueFormatter = vi.fn();
    const clickHandler = vi.fn();
    const builtSeries = [{ data: [{ label: "Attended", value: 3 }] }];

    buildDonutSeriesMock.mockReturnValue(builtSeries);
    buildPieClickHandlerMock.mockReturnValue(clickHandler);

    render(
      <AttendanceDonutChart
        chart="overall"
        data={[{ label: "Attended", value: 3 }]}
        onSegmentClick={onSegmentClick}
        valueFormatter={valueFormatter}
      />,
    );

    expect(buildDonutSeriesMock).toHaveBeenCalledWith(
      [{ label: "Attended", value: 3 }],
      valueFormatter,
    );
    expect(buildPieClickHandlerMock).toHaveBeenCalledWith(
      onSegmentClick,
      "overall",
      [{ label: "Attended", value: 3 }],
    );
    expect(screen.getByTestId("height")).toHaveTextContent("220");
    expect(screen.getByTestId("series")).toHaveTextContent("Attended");
    expect(screen.getByTestId("margin")).toHaveTextContent('"top":10');
    expect(screen.getByTestId("legend-hidden")).toHaveTextContent("true");
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
