import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockUseMediaQuery = vi.fn();
const mockUseAttendanceStats = vi.fn();
const mockUseTheme = vi.fn();
const mockGetChartColors = vi.fn();

vi.mock("@mui/material/useMediaQuery", () => ({
  default: (...args) => mockUseMediaQuery(...args),
}));

vi.mock("../../../context/ThemeContext", () => ({
  useTheme: () => mockUseTheme(),
}));

vi.mock("../../../components/Analytics/useAttendanceStats", () => ({
  default: () => mockUseAttendanceStats(),
}));

vi.mock("../../../components/Analytics/utils/chartColors", () => ({
  getChartColors: (...args) => mockGetChartColors(...args),
}));

vi.mock("../../../components/Analytics/AttendanceSummary", () => ({
  default: ({ pct }) => <div data-testid="attendance-summary">pct:{pct}</div>,
}));

vi.mock("../../../components/Analytics/AttendanceBarChart", () => ({
  default: ({ types, isMobile, gridColor, textColor }) => (
    <div data-testid="attendance-bar-chart">
      {types.join(",")}|{String(isMobile)}|{gridColor}|{textColor}
    </div>
  ),
}));

import AttendanceChart from "../../../components/Analytics/AttendanceChart";

function renderChart() {
  return render(
    <MemoryRouter>
      <AttendanceChart />
    </MemoryRouter>,
  );
}

describe("AttendanceChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false);
    mockUseTheme.mockReturnValue({ theme: "light" });
    mockGetChartColors.mockReturnValue({ textColor: "#111", gridColor: "#ddd" });
  });

  it("shows loading and unavailable fallback states", () => {
    mockUseAttendanceStats.mockReturnValueOnce({ stats: null, loading: true });
    const { rerender } = renderChart();
    expect(screen.getByText("Loading attendance…")).toBeTruthy();

    mockUseAttendanceStats.mockReturnValueOnce({ stats: null, loading: false });
    rerender(
      <MemoryRouter>
        <AttendanceChart />
      </MemoryRouter>,
    );
    expect(screen.getByText("Attendance data unavailable.")).toBeTruthy();
  });

  it("shows the no-attendance message when there are no recorded types", () => {
    mockUseAttendanceStats.mockReturnValue({
      loading: false,
      stats: {
        overall: { attended: 0, missed: 0 },
        by_type: {},
      },
    });

    renderChart();
    expect(screen.getByTestId("attendance-summary")).toHaveTextContent("pct:0");
    expect(screen.getByText("No attendance recorded yet.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Record attendance" })).toHaveAttribute("href", "/attendance");
  });

  it("renders the bar chart with computed percentage and chart colors", () => {
    mockUseMediaQuery.mockReturnValue(true);
    mockUseAttendanceStats.mockReturnValue({
      loading: false,
      stats: {
        overall: { attended: 3, missed: 1 },
        by_type: {
          Lecture: { attended: 2, missed: 1 },
          Seminar: { attended: 1, missed: 0 },
        },
      },
    });

    renderChart();
    expect(screen.getByTestId("attendance-summary")).toHaveTextContent("pct:75");
    expect(screen.getByTestId("attendance-bar-chart")).toHaveTextContent("Lecture,Seminar|true|#ddd|#111");
  });
});
